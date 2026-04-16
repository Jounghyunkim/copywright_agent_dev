import {
  CSSProperties,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react'
import Markdown from 'react-markdown'

import { Button } from '@/shared/ui/button'
import { useChat } from '@/shared/api/hooks'
import { postFormData } from '@/shared/api/client'
import type {
  ChatAttachment,
  ChatMessage,
  ExtractFilesResponse,
} from '@/shared/api/types'
import { useWorkflowStore } from '@/shared/state/workflow-store'
import { useAuthStore } from '@/shared/state/auth-store'

export interface ChatPanelHandle {
  /** 외부에서 어시스턴트 메시지를 주입 (가이드 도움말 등) */
  addAssistantMessage: (content: string) => void
}

// Keep in sync with backend MAX_CHAT_FILE_BYTES
const MAX_FILE_BYTES = 5 * 1024 * 1024
const ACCEPTED_EXT =
  '.txt,.md,.markdown,.log,.json,.csv,.tsv,.pdf,.docx,.xlsx,.xlsm,.png,.jpg,.jpeg,.gif,.webp'

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp'])

function isImageFile(f: File): boolean {
  if (f.type && f.type.startsWith('image/')) return true
  const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
  return IMAGE_EXTS.has(ext)
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') resolve(result)
      else reject(new Error('FileReader returned non-string result'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'))
    reader.readAsDataURL(file)
  })
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

/**
 * Chat panel — workflow 진행 중 AI 어시스턴트와 대화.
 * 컨텍스트(brief/analysisReport/strategicMessage 등)를 자동으로 서버에 전달.
 * 파일 첨부 시 /api/v1/chat/extract-text 로 텍스트 추출 후 메시지에 동봉.
 */
export const ChatPanel = forwardRef<ChatPanelHandle>(function ChatPanel(_, ref) {
  const rawName = useAuthStore((s) => s.user?.display_name)
  const userName = rawName?.split('/')[0]?.trim() || rawName

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: userName
        ? `안녕하세요, **${userName}**님! Copywriting Assistant입니다.\n각 단계에서 질문이 있거나, 도움이 필요하면 편하게 말씀해 주세요.`
        : '안녕하세요! Copywriting Assistant입니다.\n각 단계에서 질문이 있거나, 도움이 필요하면 편하게 말씀해 주세요.',
    },
  ])
  const [input, setInput] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [attachError, setAttachError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const chat = useChat()
  const currentStep = useWorkflowStore((s) => s.currentStep)
  const brief = useWorkflowStore((s) => s.brief)
  const analysisReport = useWorkflowStore((s) => s.analysisReport)
  const strategicMessage = useWorkflowStore((s) => s.strategicMessage)
  const copyResults = useWorkflowStore((s) => s.copyResults)
  const reviewResults = useWorkflowStore((s) => s.reviewResults)

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, chat.isPending, uploading])

  useImperativeHandle(ref, () => ({
    addAssistantMessage: (content: string) => {
      setMessages((prev) => [...prev, { role: 'assistant', content }])
    },
  }))

  const handlePickFiles = () => fileInputRef.current?.click()

  const handleFilesChosen = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setAttachError(null)
    const picked = Array.from(evt.target.files ?? [])
    if (picked.length === 0) return

    // Validate size and dedupe by name
    const accepted: File[] = []
    const existingNames = new Set(pendingFiles.map((f) => f.name))
    const rejects: string[] = []
    for (const f of picked) {
      if (f.size > MAX_FILE_BYTES) {
        rejects.push(`${f.name} (용량 초과)`)
        continue
      }
      if (existingNames.has(f.name)) continue
      accepted.push(f)
      existingNames.add(f.name)
    }
    if (rejects.length > 0) {
      setAttachError(`첨부 불가: ${rejects.join(', ')}. 파일당 최대 5MB.`)
    }
    if (accepted.length > 0) {
      setPendingFiles((prev) => [...prev, ...accepted])
    }
    // reset so the same file can be re-selected later
    evt.target.value = ''
  }

  const handleRemoveFile = (name: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.name !== name))
  }

  const handleSend = async () => {
    const text = input.trim()
    if ((!text && pendingFiles.length === 0) || chat.isPending || uploading) return

    let attachments: ChatAttachment[] | undefined
    if (pendingFiles.length > 0) {
      setUploading(true)
      setAttachError(null)
      try {
        // Partition: images go client-side (base64), others → /extract-text
        const imageFiles = pendingFiles.filter(isImageFile)
        const textFiles = pendingFiles.filter((f) => !isImageFile(f))

        const imageAttachments: ChatAttachment[] = await Promise.all(
          imageFiles.map(async (f) => ({
            kind: 'image' as const,
            filename: f.name,
            image_url: await readFileAsDataURL(f),
          })),
        )

        let textAttachments: ChatAttachment[] = []
        const errors: string[] = []
        if (textFiles.length > 0) {
          const fd = new FormData()
          for (const f of textFiles) fd.append('files', f, f.name)
          const res = await postFormData<ExtractFilesResponse>(
            '/api/v1/chat/extract-text',
            fd,
          )
          for (const r of res.files) {
            if (r.error) errors.push(`${r.filename}: ${r.error}`)
          }
          textAttachments = res.files
            .filter((r) => !r.error && r.text)
            .map((r) => ({
              kind: 'text' as const,
              filename: r.filename,
              text: r.text,
              truncated: r.truncated,
            }))
        }

        if (errors.length > 0) setAttachError(errors.join(' · '))

        attachments = [...imageAttachments, ...textAttachments]
        if (attachments.length === 0) {
          // nothing usable — abort send (user still has the input intact)
          setUploading(false)
          return
        }
      } catch (err) {
        console.error('[ChatPanel] file extract failed', err)
        setAttachError('파일을 처리하지 못했습니다. 다시 시도해 주세요.')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: text || '(첨부 파일만 전송)',
      attachments,
    }
    const nextMessages: ChatMessage[] = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setPendingFiles([])

    try {
      const res = await chat.mutateAsync({
        messages: nextMessages,
        currentStep,
        context: {
          brief,
          analysisReport,
          strategicMessage,
          copyResults,
          reviewResults,
        },
      })
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.reply },
      ])
    } catch (err) {
      console.error('[ChatPanel] chat failed', err)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '응답을 가져오지 못했습니다. 백엔드 연결을 확인해 주세요.',
        },
      ])
    }
  }

  const canSend =
    !chat.isPending && !uploading && (input.trim().length > 0 || pendingFiles.length > 0)

  return (
    <div style={container}>
      <div ref={listRef} style={listStyle}>
        {messages.map((m, i) => (
          <Bubble key={i} message={m} />
        ))}
        {(chat.isPending || uploading) && (
          <div style={{ ...bubbleWrap, justifyContent: 'flex-start' }}>
            <div style={{ ...bubble, background: 'var(--neutral-100)' }}>
              <span style={{ color: 'var(--neutral-500)', fontSize: 13 }}>
                {uploading ? '파일 처리 중…' : '생각 중…'}
              </span>
            </div>
          </div>
        )}
      </div>

      {pendingFiles.length > 0 && (
        <div style={chipRow}>
          {pendingFiles.map((f) => (
            <PendingChip key={f.name} file={f} onRemove={() => handleRemoveFile(f.name)} />
          ))}
        </div>
      )}

      {attachError && (
        <p style={{ fontSize: 12, color: 'var(--danger)', padding: '0 4px' }}>
          {attachError}
        </p>
      )}

      <div style={inputRow}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXT}
          style={{ display: 'none' }}
          onChange={handleFilesChosen}
        />
        <button
          type="button"
          onClick={handlePickFiles}
          disabled={uploading || chat.isPending}
          title="파일 첨부 (문서: txt·md·csv·json·pdf·docx·xlsx / 이미지: png·jpg·gif·webp)"
          style={attachBtn}
        >
          📎
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="메시지를 입력하세요"
          rows={1}
          style={textarea}
        />
        <Button onClick={handleSend} disabled={!canSend}>
          전송
        </Button>
      </div>
    </div>
  )
})

function PendingChip({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  const isImg = isImageFile(file)

  useEffect(() => {
    if (!isImg) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file, isImg])

  return (
    <span style={chip} title={`${file.name} · ${formatBytes(file.size)}`}>
      {isImg && preview ? (
        <img src={preview} alt={file.name} style={thumb} />
      ) : (
        <span aria-hidden>📎</span>
      )}
      <span
        style={{
          maxWidth: 160,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {file.name}
      </span>
      <span style={{ color: 'var(--neutral-500)', fontSize: 11 }}>
        {formatBytes(file.size)}
      </span>
      <button
        type="button"
        onClick={onRemove}
        style={chipRemove}
        aria-label={`${file.name} 제거`}
      >
        ×
      </button>
    </span>
  )
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const imageAtts = message.attachments?.filter((a) => a.kind === 'image') ?? []
  const textAtts = message.attachments?.filter((a) => a.kind !== 'image') ?? []
  return (
    <div
      style={{
        ...bubbleWrap,
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          ...bubble,
          background: isUser ? 'var(--lg-red-600)' : 'var(--neutral-100)',
          color: isUser ? 'var(--white)' : 'var(--neutral-900)',
        }}
      >
        {isUser ? (
          <>
            {imageAtts.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                {imageAtts.map((a) =>
                  a.image_url ? (
                    <img
                      key={a.filename}
                      src={a.image_url}
                      alt={a.filename}
                      style={bubbleImage}
                    />
                  ) : null,
                )}
              </div>
            )}
            <div>{message.content}</div>
            {textAtts.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: '1px solid rgba(255,255,255,0.25)',
                }}
              >
                {textAtts.map((a) => (
                  <span
                    key={a.filename}
                    style={{
                      fontSize: 11,
                      background: 'rgba(255,255,255,0.2)',
                      padding: '2px 8px',
                      borderRadius: 10,
                    }}
                    title={a.truncated ? '일부만 전달됨 (내용이 길어 잘림)' : undefined}
                  >
                    📎 {a.filename}
                    {a.truncated ? ' ✂' : ''}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="chat-markdown">
            <Markdown>{message.content}</Markdown>
          </div>
        )}
      </div>
    </div>
  )
}

const container: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 400,
  gap: 8,
}

const listStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px 4px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const bubbleWrap: CSSProperties = {
  display: 'flex',
  width: '100%',
}

const bubble: CSSProperties = {
  maxWidth: '80%',
  padding: '10px 14px',
  borderRadius: 12,
  fontSize: 14,
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}

const inputRow: CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'flex-end',
  paddingTop: 8,
  borderTop: '1px solid var(--color-border)',
}

const textarea: CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--color-border)',
  fontSize: 14,
  fontFamily: 'inherit',
  lineHeight: 1.5,
  outline: 'none',
  resize: 'none',
}

const attachBtn: CSSProperties = {
  height: 40,
  width: 40,
  borderRadius: 8,
  border: '1px solid var(--color-border)',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const chipRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  padding: '4px 4px 0',
}

const chip: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 6px 4px 10px',
  fontSize: 12,
  background: 'var(--neutral-100)',
  border: '1px solid var(--color-border)',
  borderRadius: 14,
  color: 'var(--neutral-900)',
}

const chipRemove: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
  color: 'var(--neutral-500)',
  padding: '0 4px',
}

const thumb: CSSProperties = {
  width: 24,
  height: 24,
  objectFit: 'cover',
  borderRadius: 4,
  border: '1px solid var(--color-border)',
}

const bubbleImage: CSSProperties = {
  maxWidth: 240,
  maxHeight: 240,
  borderRadius: 8,
  display: 'block',
  border: '1px solid rgba(255,255,255,0.25)',
}
