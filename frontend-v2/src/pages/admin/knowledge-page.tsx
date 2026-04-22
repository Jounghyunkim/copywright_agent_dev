import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { FieldLabel, TextInput } from '@/shared/ui/field'
import { apiClient, postFormData } from '@/shared/api/client'

// 백엔드 API는 한국어 카테고리 값을 그대로 수신. 값은 고정하고 UI만 로컬라이즈.
const CATEGORIES = [
  { value: '저서', labelKey: 'knowledge:category.book' },
  { value: '에세이', labelKey: 'knowledge:category.essay' },
  { value: '인터뷰', labelKey: 'knowledge:category.interview' },
  { value: '카피샘플', labelKey: 'knowledge:category.copySample' },
  { value: '인사이트', labelKey: 'knowledge:category.insight' },
] as const
type Category = (typeof CATEGORIES)[number]['value']

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
  const { t } = useTranslation(['knowledge', 'common', 'page'])
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
      setUploadError(t('knowledge:error.uploadFailed'))
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
        title: textTitle.trim() || t('knowledge:directInput'),
        category: textCat,
      })
      setTextTitle('')
      setTextBody('')
      await loadDocs()
    } catch (err) {
      console.error('[KnowledgePage] text save failed', err)
      setTextError(t('common:error.saveFailed'))
    } finally {
      setTextSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('knowledge:confirm.delete'))) return
    setDeletingId(id)
    try {
      await apiClient.delete(`/admin/knowledge/${id}`)
      await loadDocs()
    } catch {
      alert(t('common:error.deleteFailed'))
    } finally {
      setDeletingId(null)
    }
  }

  const totalChunks = docs.reduce((s, d) => s + d.chunk_count, 0)

  return (
    <>
      <div>
        <h2 className="page-title">{t('page:knowledge.title')}</h2>
        <p className="page-subtitle">{t('page:knowledge.subtitle')}</p>
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
            {t('knowledge:registeredDocs')}
          </p>
          <p style={{ fontSize: 22, fontWeight: 700 }}>
            {t('knowledge:summary.docsCount', { count: docs.length })}
          </p>
        </Card>
        <Card>
          <p style={{ fontSize: 12, color: 'var(--neutral-500)', marginBottom: 4 }}>
            {t('knowledge:totalChunks')}
          </p>
          <p style={{ fontSize: 22, fontWeight: 700 }}>
            {t('knowledge:summary.chunksCount', { count: totalChunks })}
          </p>
        </Card>
      </div>

      {/* File Upload */}
      <Card className="stack">
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>{t('knowledge:fileUpload')}</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <FieldLabel>{t('knowledge:fileSelect')}</FieldLabel>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={ACCEPTED_EXT}
              style={{ fontSize: 13 }}
            />
          </div>
          <div>
            <FieldLabel>{t('common:category')}</FieldLabel>
            <select
              value={uploadCat}
              onChange={(e) => setUploadCat(e.target.value as Category)}
              style={selectStyle}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {t(c.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? t('common:button.uploading') : t('common:button.upload')}
          </Button>
        </div>
        {uploadError && (
          <p style={{ fontSize: 12, color: 'var(--danger)' }}>{uploadError}</p>
        )}
      </Card>

      {/* Text Input */}
      <Card className="stack">
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>{t('knowledge:textInput')}</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <FieldLabel>{t('common:title')}</FieldLabel>
            <TextInput
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              placeholder={t('knowledge:titlePlaceholder')}
            />
          </div>
          <div>
            <FieldLabel>{t('common:category')}</FieldLabel>
            <select
              value={textCat}
              onChange={(e) => setTextCat(e.target.value as Category)}
              style={selectStyle}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {t(c.labelKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <textarea
          value={textBody}
          onChange={(e) => setTextBody(e.target.value)}
          placeholder={t('knowledge:textPlaceholder')}
          rows={6}
          style={textareaStyle}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <span style={{ flex: 1, fontSize: 12, color: 'var(--neutral-500)', alignSelf: 'center' }}>
            {textBody.length > 0
              ? t('common:charCount', { count: textBody.length })
              : ''}
          </span>
          <Button
            onClick={handleTextSave}
            disabled={textSaving || !textBody.trim()}
          >
            {textSaving ? t('common:button.saving') : t('common:button.save')}
          </Button>
        </div>
        {textError && (
          <p style={{ fontSize: 12, color: 'var(--danger)' }}>{textError}</p>
        )}
      </Card>

      {/* Document List */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          {t('knowledge:registered', { count: docs.length })}
        </h3>
        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            {t('common:loading')}
          </p>
        ) : docs.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            {t('knowledge:noDocs')}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>{t('knowledge:table.title')}</th>
                  <th>{t('knowledge:table.category')}</th>
                  <th style={{ textAlign: 'right' }}>
                    {t('knowledge:table.chunks')}
                  </th>
                  <th style={{ textAlign: 'right' }}>
                    {t('knowledge:table.chars')}
                  </th>
                  <th>{t('knowledge:table.createdAt')}</th>
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
                      <Badge tone="neutral">
                        {t(
                          CATEGORIES.find((c) => c.value === d.category)
                            ?.labelKey ?? '',
                          d.category,
                        )}
                      </Badge>
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
                        {t('common:button.delete')}
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
