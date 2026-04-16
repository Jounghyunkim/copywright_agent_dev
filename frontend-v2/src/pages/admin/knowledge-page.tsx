import { useEffect, useRef, useState } from 'react'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { FieldLabel, TextInput } from '@/shared/ui/field'
import { apiClient, postFormData } from '@/shared/api/client'

const CATEGORIES = ['저서', '에세이', '인터뷰', '카피샘플', '인사이트'] as const
type Category = (typeof CATEGORIES)[number]

const ACCEPTED_EXT = '.txt,.md,.pdf,.docx'

interface KnowledgeDoc {
  id: number
  filename: string
  category: string
  chunk_count: number
  total_chars: number
  added_by: string
  created_at: string
}

export function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([])
  const [loading, setLoading] = useState(true)

  // File upload state
  const [uploadCat, setUploadCat] = useState<Category>('인사이트')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Text input state
  const [textTitle, setTextTitle] = useState('')
  const [textBody, setTextBody] = useState('')
  const [textCat, setTextCat] = useState<Category>('인사이트')
  const [textSaving, setTextSaving] = useState(false)
  const [textError, setTextError] = useState<string | null>(null)

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadDocs = async () => {
    try {
      const data = await apiClient.get<KnowledgeDoc[]>('/admin/knowledge')
      setDocs(data)
    } catch {
      console.error('[KnowledgePage] load failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocs()
  }, [])

  const handleUpload = async () => {
    const files = fileRef.current?.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      for (const f of Array.from(files)) fd.append('files', f, f.name)
      fd.append('category', uploadCat)
      await postFormData<KnowledgeDoc[]>('/admin/knowledge', fd)
      if (fileRef.current) fileRef.current.value = ''
      await loadDocs()
    } catch (err) {
      console.error('[KnowledgePage] upload failed', err)
      setUploadError('업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleTextSave = async () => {
    if (!textBody.trim()) return
    setTextSaving(true)
    setTextError(null)
    try {
      await apiClient.post('/admin/knowledge/text', {
        text: textBody,
        title: textTitle.trim() || '직접 입력',
        category: textCat,
      })
      setTextTitle('')
      setTextBody('')
      await loadDocs()
    } catch (err) {
      console.error('[KnowledgePage] text save failed', err)
      setTextError('저장에 실패했습니다.')
    } finally {
      setTextSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 문서를 삭제하면 벡터 인덱스에서도 제거됩니다. 계속하시겠습니까?')) return
    setDeletingId(id)
    try {
      await apiClient.delete(`/admin/knowledge/${id}`)
      await loadDocs()
    } catch {
      alert('삭제에 실패했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  const totalChunks = docs.reduce((s, d) => s + d.chunk_count, 0)

  return (
    <>
      <div>
        <h2 className="page-title">지식 구축</h2>
        <p className="page-subtitle">
          Copywriter 페르소나 RAG 지식 베이스 관리 — 업로드된 텍스트는 청킹 후 벡터
          인덱스에 저장되어 카피 생성 시 자동 검색됩니다.
        </p>
      </div>

      {/* Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
        }}
      >
        <Card>
          <p style={{ fontSize: 12, color: 'var(--neutral-500)', marginBottom: 4 }}>
            등록 문서
          </p>
          <p style={{ fontSize: 22, fontWeight: 700 }}>{docs.length}건</p>
        </Card>
        <Card>
          <p style={{ fontSize: 12, color: 'var(--neutral-500)', marginBottom: 4 }}>
            총 청크 수
          </p>
          <p style={{ fontSize: 22, fontWeight: 700 }}>{totalChunks}개</p>
        </Card>
      </div>

      {/* File Upload */}
      <Card className="stack">
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>파일 업로드</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <FieldLabel>파일 선택 (txt, md, pdf, docx)</FieldLabel>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={ACCEPTED_EXT}
              style={{ fontSize: 13 }}
            />
          </div>
          <div>
            <FieldLabel>카테고리</FieldLabel>
            <select
              value={uploadCat}
              onChange={(e) => setUploadCat(e.target.value as Category)}
              style={selectStyle}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? '업로드 중…' : '업로드'}
          </Button>
        </div>
        {uploadError && (
          <p style={{ fontSize: 12, color: 'var(--danger)' }}>{uploadError}</p>
        )}
      </Card>

      {/* Text Input */}
      <Card className="stack">
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>텍스트 직접 입력</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <FieldLabel>제목</FieldLabel>
            <TextInput
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              placeholder="예: 2024 인터뷰 발췌"
            />
          </div>
          <div>
            <FieldLabel>카테고리</FieldLabel>
            <select
              value={textCat}
              onChange={(e) => setTextCat(e.target.value as Category)}
              style={selectStyle}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <textarea
          value={textBody}
          onChange={(e) => setTextBody(e.target.value)}
          placeholder="에세이, 인터뷰 내용, 인사이트 메모 등을 붙여넣기…"
          rows={6}
          style={textareaStyle}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <span style={{ flex: 1, fontSize: 12, color: 'var(--neutral-500)', alignSelf: 'center' }}>
            {textBody.length > 0 ? `${textBody.length}자` : ''}
          </span>
          <Button
            onClick={handleTextSave}
            disabled={textSaving || !textBody.trim()}
          >
            {textSaving ? '저장 중…' : '저장'}
          </Button>
        </div>
        {textError && (
          <p style={{ fontSize: 12, color: 'var(--danger)' }}>{textError}</p>
        )}
      </Card>

      {/* Document List */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          등록된 지식 ({docs.length}건)
        </h3>
        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>로드 중…</p>
        ) : docs.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            등록된 문서가 없습니다. 파일 업로드 또는 텍스트 입력으로 지식을 추가하세요.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>제목</th>
                  <th>카테고리</th>
                  <th style={{ textAlign: 'right' }}>청크</th>
                  <th style={{ textAlign: 'right' }}>글자 수</th>
                  <th>등록일</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 500, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.filename}
                    </td>
                    <td>
                      <Badge tone="neutral">{d.category}</Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>{d.chunk_count}</td>
                    <td style={{ textAlign: 'right', color: 'var(--neutral-500)', fontSize: 12 }}>
                      {d.total_chars.toLocaleString()}
                    </td>
                    <td style={{ color: 'var(--neutral-500)', fontSize: 12 }}>
                      {d.created_at?.slice(0, 10)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="ghost"
                        className="btn-compact"
                        onClick={() => handleDelete(d.id)}
                        disabled={deletingId === d.id}
                      >
                        삭제
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--color-border)',
  fontSize: 13,
  outline: 'none',
  background: '#fff',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--color-border)',
  fontSize: 14,
  fontFamily: 'inherit',
  lineHeight: 1.6,
  outline: 'none',
  resize: 'vertical',
}
