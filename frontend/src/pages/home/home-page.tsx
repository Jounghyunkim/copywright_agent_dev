import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BarChart3, Globe, Clock, Plus, Search,
  ChevronRight, FileText, Loader, Trash2,
} from 'lucide-react'
import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { useDashboard, useDeleteCampaign } from '@/features/case/api'
import type { CampaignListItem } from '@/shared/api/types'

const COUNTRY_FLAGS: Record<string, string> = {
  US: '\u{1F1FA}\u{1F1F8}', DE: '\u{1F1E9}\u{1F1EA}', GB: '\u{1F1EC}\u{1F1E7}',
  FR: '\u{1F1EB}\u{1F1F7}', IT: '\u{1F1EE}\u{1F1F9}', ES: '\u{1F1EA}\u{1F1F8}',
  IN: '\u{1F1EE}\u{1F1F3}', BR: '\u{1F1E7}\u{1F1F7}', KR: '\u{1F1F0}\u{1F1F7}',
  AU: '\u{1F1E6}\u{1F1FA}', ID: '\u{1F1EE}\u{1F1E9}', SA: '\u{1F1F8}\u{1F1E6}',
}

const statItems = [
  { label: 'Total Projects', icon: LayoutDashboard, color: '#007AFF', key: 'totalProjects' as const },
  { label: 'Avg. Brand Score', icon: BarChart3, color: 'var(--color-success)', key: 'avgBrandScore' as const },
  { label: 'Target Regions', icon: Globe, color: '#FF9500', key: 'targetRegions' as const },
  { label: 'Avg. Review Score', icon: Clock, color: '#5856D6', key: 'avgReviewScore' as const },
]

export function HomePage() {
  const navigate = useNavigate()
  const { data, isLoading } = useDashboard()
  const deleteMutation = useDeleteCampaign()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const stats = data?.stats ?? { totalProjects: 0, avgBrandScore: 0, avgReviewScore: 0, targetRegions: 0 }
  const campaigns = data?.campaigns ?? []
  const filtered = searchQuery.trim()
    ? campaigns.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.summary.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : campaigns

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!window.confirm('Delete this campaign?')) return
    deleteMutation.mutate(id)
  }

  return (
    <div style={{ padding: '2rem 6%', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Project Dashboard</h2>
          <p style={{ color: 'var(--color-text-secondary)', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
            Overview of your AI-driven marketing campaigns.
          </p>
        </div>
        <Button icon={<Plus size={18} />} size="lg" onClick={() => navigate('/new')}>
          New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        {statItems.map((stat) => {
          const Icon = stat.icon
          const val = stats[stat.key]
          return (
            <Card key={stat.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{stat.label}</span>
                <Icon size={18} color={stat.color} />
              </div>
              <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {isLoading ? (
                  <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-text-muted)' }} />
                ) : val > 0 ? val : '\u2014'}
              </span>
            </Card>
          )
        })}
      </div>

      {/* Campaign list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Campaigns</h3>
          <div style={{ position: 'relative' }}>
            <input
              style={{
                padding: '8px 12px 8px 35px', width: 250, borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)', fontSize: '0.85rem',
                outline: 'none', background: 'var(--color-bg)',
              }}
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--color-text-muted)' }} />
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
            <p style={{ margin: 0 }}>Loading campaigns...</p>
          </div>
        ) : filtered.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--color-border)' }}>
            <FileText size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>
              {searchQuery ? 'No results found.' : 'No campaigns yet.'}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              {searchQuery ? 'Try a different keyword.' : 'Click New Campaign to get started.'}
            </p>
          </Card>
        ) : (
          filtered.map((project: CampaignListItem) => (
            <Card
              key={project.id}
              hover
              onClick={() => navigate(`/workflows/${project.id}`)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                  {project.status === 'draft' && (
                    <Badge variant="warning">Step {project.currentStep || 1}/5</Badge>
                  )}
                  {project.status === 'completed' && (
                    <Badge variant="info">Completed</Badge>
                  )}
                  {(project.countries || []).map((cc) => (
                    <Badge key={cc}>{COUNTRY_FLAGS[cc] || '\u{1F310}'} {cc}</Badge>
                  ))}
                  {project.totalCopies > 0 && <Badge variant="success">{project.totalCopies} copies</Badge>}
                </div>
                <div style={{ marginBottom: 5 }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem' }}>{project.title}</span>
                </div>
                <p style={{
                  margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500,
                }}>
                  {project.summary || '\u2014'}
                </p>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4, display: 'inline-block' }}>
                  {project.date}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', marginBottom: 2 }}>Brand Fit</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {project.brandFitScore ?? '\u2014'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', marginBottom: 2 }}>Review</div>
                  <div style={{
                    fontSize: '1.1rem', fontWeight: 800,
                    color: (project.reviewAvgScore ?? 0) >= 70 ? 'var(--color-success-text)' :
                           (project.reviewAvgScore ?? 0) >= 40 ? 'var(--color-warning-text)' : 'var(--color-error-text)',
                  }}>
                    {project.reviewAvgScore ?? '\u2014'}
                  </div>
                </div>
                <div
                  onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === project.id ? null : project.id) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                >
                  <ChevronRight size={20} color="var(--color-border)" style={{
                    transition: 'transform 0.2s',
                    transform: expandedId === project.id ? 'rotate(90deg)' : 'none',
                  }} />
                  {expandedId === project.id && (
                    <button
                      onClick={(e) => handleDelete(e, project.id)}
                      disabled={deleteMutation.isPending}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: 6, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-error-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      title="Delete campaign"
                    >
                      <Trash2 size={18} color={deleteMutation.isPending ? 'var(--color-border)' : 'var(--color-error)'} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
