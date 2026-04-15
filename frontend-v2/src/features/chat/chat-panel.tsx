import { CSSProperties, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import Markdown from 'react-markdown'

import { Button } from '@/shared/ui/button'
import { useChat } from '@/shared/api/hooks'
import type { ChatMessage } from '@/shared/api/types'
import { useWorkflowStore } from '@/shared/state/workflow-store'
import { useAuthStore } from '@/shared/state/auth-store'

export interface ChatPanelHandle {
  /** 외부에서 어시스턴트 메시지를 주입 (가이드 도움말 등) */
  addAssistantMessage: (content: string) => void
}

/**
 * Chat panel — workflow 진행 중 AI 어시스턴트와 대화.
 * 컨텍스트(brief/analysisReport/strategicMessage 등)를 자동으로 서버에 전달.
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
  const listRef = useRef<HTMLDivElement>(null)

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
  }, [messages, chat.isPending])

  useImperativeHandle(ref, () => ({
    addAssistantMessage: (content: string) => {
      setMessages((prev) => [...prev, { role: 'assistant', content }])
    },
  }))

  const handleSend = async () => {
    const text = input.trim()
    if (!text || chat.isPending) return
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: text },
    ]
    setMessages(nextMessages)
    setInput('')

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

  return (
    <div style={container}>
      <div ref={listRef} style={listStyle}>
        {messages.map((m, i) => (
          <Bubble key={i} message={m} />
        ))}
        {chat.isPending && (
          <div style={{ ...bubbleWrap, justifyContent: 'flex-start' }}>
            <div style={{ ...bubble, background: 'var(--neutral-100)' }}>
              <span style={{ color: 'var(--neutral-500)', fontSize: 13 }}>
                생각 중…
              </span>
            </div>
          </div>
        )}
      </div>

      <div style={inputRow}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="메시지를 입력하세요 (Shift+Enter로 줄바꿈)"
          rows={2}
          style={textarea}
        />
        <Button onClick={handleSend} disabled={chat.isPending || !input.trim()}>
          전송
        </Button>
      </div>
    </div>
  )
})

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
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
          message.content
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
