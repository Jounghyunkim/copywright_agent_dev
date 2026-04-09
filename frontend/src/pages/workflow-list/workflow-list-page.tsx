import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, FileText, Loader } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { useDashboard } from '@/features/case/api'

const COUNTRY_FLAGS: Record<string, string> = {
  US: '\u{1F1FA}\u{1F1F8}', DE: '\u{1F1E9}\u{1F1EA}', GB: '\u{1F1EC}\u{1F1E7}',
  FR: '\u{1F1EB}\u{1F1F7}', IT: '\u{1F1EE}\u{1F1F9}', ES: '\u{1F1EA}\u{1F1F8}',
  IN: '\u{1F1EE}\u{1F1F3}', BR: '\u{1F1E7}\u{1F1F7}', KR: '\u{1F1F0}\u{1F1F7}',
  AU: '\u{1F1E6}\u{1F1FA}', ID: '\u{1F1EE}\u{1F1E9}', SA: '\u{1F1F8}\u{1F1E6}',
}

export function WorkflowListPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useDashboard()
  const [search, setSearch] = useState('')

  const campaigns = data?.campaigns ?? []
  const filtered = search.trim()
    ? campaigns.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : campaigns

  return (
    <div style={{ padding: '2rem 6%', maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>All Campaigns</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              style={{
                padding: '8px 12px 8px 34px', width: 220, borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)', fontSize: '0.85rem', outline: 'none',
                background: 'var(--color-bg)',
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: 11, top: 10, color: 'var(--color-text-muted)' }} />
          </div>
          <Button icon={<Plus size={16} />} onClick={() => navigate('/new')}>New</Button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>{search ? 'No results.' : 'No campaigns yet.'}</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((c) => (
            <Card key={c.id} hover onClick={() => navigate(`/workflows/${c.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    {c.status === 'draft' && (
                      <Badge variant="warning">Step {c.currentStep || 1}/5</Badge>
                    )}
                    {c.status === 'completed' && (
                      <Badge variant="info">Completed</Badge>
                    )}
                    {(c.countries || []).map((cc) => (
                      <Badge key={cc}>{COUNTRY_FLAGS[cc] || '\u{1F310}'} {cc}</Badge>
                    ))}
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.title}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                    {c.summary || '\u2014'}
                  </p>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{c.date}</span>
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>Brand</div>
                    <div style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{c.brandFitScore ?? '\u2014'}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>Review</div>
                    <div style={{ fontWeight: 800 }}>{c.reviewAvgScore ?? '\u2014'}</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
