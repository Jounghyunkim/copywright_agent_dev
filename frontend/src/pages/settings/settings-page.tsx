import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Settings, PenTool, ListChecks, Trash2, Loader, Wand2, Save, ArrowLeft, AlertCircle, Shield, Puzzle, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react'
import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { useSkills, useSkillDetail, useDeleteSkill } from '@/features/skill-registry/api'
import { useGenerateSkillDraft, useSaveSkill } from '@/features/skill-authoring/api'
import { useUIStore } from '@/shared/state/ui-store'

type Tab = 'general' | 'skill-builder' | 'skill-manager'

const TABS: { id: Tab; label: string; icon: typeof Settings }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'skill-builder', label: 'Skill Authoring', icon: PenTool },
  { id: 'skill-manager', label: 'Skill Management', icon: ListChecks },
]

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = (searchParams.get('tab') || 'general') as Tab
  const [activeTab, setActiveTab] = useState<Tab>(tabParam)
  const addToast = useUIStore((s) => s.addToast)

  useEffect(() => { setActiveTab(tabParam) }, [tabParam])

  const switchTab = (tab: Tab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  return (
    <div style={{ padding: '2rem 6%', maxWidth: 1000 }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Settings</h2>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: 0 }}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => switchTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
              border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: active ? 700 : 500,
              color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
              transition: 'all 0.2s', marginBottom: -1,
            }}>
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'general' && <GeneralTab />}
      {activeTab === 'skill-builder' && <SkillBuilderTab addToast={addToast} />}
      {activeTab === 'skill-manager' && <SkillManagerTab addToast={addToast} />}
    </div>
  )
}

/* General */
function GeneralTab() {
  return (
    <Card>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>General Settings</h3>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
        Application settings will appear here. Currently no configurable options.
      </p>
    </Card>
  )
}

/* Skill Builder */
function SkillBuilderTab({ addToast }: { addToast: (msg: string, type?: 'info' | 'success' | 'error') => void }) {
  const [builderStep, setBuilderStep] = useState<'input' | 'preview'>('input')
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [goal, setGoal] = useState('')
  const [goodExample, setGoodExample] = useState('')
  const [badExample, setBadExample] = useState('')
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null)

  const generateDraft = useGenerateSkillDraft()
  const saveSkill = useSaveSkill()

  const handleGenerate = async () => {
    if (!name.trim() || !purpose.trim() || !goal.trim()) return
    try {
      const result = await generateDraft.mutateAsync({ name, purpose, goal, goodExample, badExample })
      setDraft(result.draft)
      setBuilderStep('preview')
    } catch {
      addToast('Draft generation failed.', 'error')
    }
  }

  const handleConfirm = async () => {
    if (!draft) return
    try {
      await saveSkill.mutateAsync(draft)
      addToast('Skill saved successfully.', 'success')
      setBuilderStep('input')
      setName('')
      setPurpose('')
      setGoal('')
      setGoodExample('')
      setBadExample('')
      setDraft(null)
    } catch {
      addToast('Skill save failed.', 'error')
    }
  }

  const handleCancel = () => {
    setBuilderStep('input')
  }

  const fieldStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)', fontSize: '0.85rem', outline: 'none',
    background: 'var(--color-bg)', resize: 'vertical' as const, lineHeight: 1.6,
  }
  const labelStyle = { fontSize: '0.82rem', fontWeight: 600 as const, display: 'block', marginBottom: 4 }

  /* ── Preview Step ── */
  if (builderStep === 'preview' && draft) {
    const d = draft as Record<string, string>
    const promptText = d.prompt_template || ''

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Puzzle size={20} color="var(--color-primary)" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{String(d.label || d.id)}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>ID: {String(d.id)}</span>
              </div>
            </div>
            <Badge variant="purple">{String(d['category'] || 'validation')}</Badge>
          </div>
          {d.description && (
            <p style={{ margin: '12px 0 0', fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              {String(d.description)}
            </p>
          )}
        </Card>

        {/* Prompt Template */}
        <Card>
          <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <PenTool size={14} color="var(--color-primary)" /> Prompt Template
          </h4>
          <div style={{
            background: 'var(--color-bg)', padding: 16, borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: '0.82rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            maxHeight: 400, overflow: 'auto',
          }}>
            {promptText}
          </div>
        </Card>

        {/* Output Schema */}
        {d.output_schema && (
          <Card>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Settings size={14} color="var(--color-text-secondary)" /> Output Schema
            </h4>
            <pre style={{
              background: 'var(--color-bg)', padding: 12, borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: '0.78rem', overflow: 'auto', maxHeight: 200, lineHeight: 1.5, margin: 0,
            }}>
              {JSON.stringify(d.output_schema, null, 2)}
            </pre>
          </Card>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Button icon={<CheckCircle2 size={16} />} loading={saveSkill.isPending} onClick={handleConfirm}>
            Confirm & Save
          </Button>
          <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={handleCancel}>
            Cancel & Edit
          </Button>
        </div>
      </div>
    )
  }

  /* ── Input Step ── */
  return (
    <Card>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Create New Skill</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Skill Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
          <input style={{ ...fieldStyle, resize: 'none' as const }} placeholder="e.g. Promo Legal Check, CTA Effectiveness Guard" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Purpose <span style={{ color: 'var(--color-error)' }}>*</span></label>
          <textarea style={fieldStyle} rows={2} placeholder="What does this skill check?" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Goal <span style={{ color: 'var(--color-error)' }}>*</span></label>
          <textarea style={fieldStyle} rows={2} placeholder="What outcome do you expect?" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Good Example</label>
          <textarea style={fieldStyle} rows={2} placeholder="Example that would PASS" value={goodExample} onChange={(e) => setGoodExample(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Bad Example</label>
          <textarea style={fieldStyle} rows={2} placeholder="Example that would FAIL" value={badExample} onChange={(e) => setBadExample(e.target.value)} />
        </div>
        <Button icon={<Wand2 size={16} />} loading={generateDraft.isPending} onClick={handleGenerate}
          disabled={!name.trim() || !purpose.trim() || !goal.trim()}>
          Generate Skill Draft
        </Button>
      </div>
    </Card>
  )
}

/* Skill Manager */
function SkillManagerTab({ addToast }: { addToast: (msg: string, type?: 'info' | 'success' | 'error') => void }) {
  const { data: skills, isLoading } = useSkills()
  const deleteMutation = useDeleteSkill()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this skill?')) return
    try {
      await deleteMutation.mutateAsync(id)
      if (expandedId === id) setExpandedId(null)
      addToast('Skill deleted.', 'success')
    } catch {
      addToast('Delete failed.', 'error')
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(!skills || skills.length === 0) ? (
        <Card style={{ textAlign: 'center', padding: '2rem' }}>
          <Puzzle size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>No skills registered.</p>
        </Card>
      ) : (
        skills.map((skill) => {
          const isExpanded = expandedId === skill.id
          return (
            <Card key={skill.id} style={{ overflow: 'hidden' }}>
              {/* Header row — clickable */}
              <div
                onClick={() => toggleExpand(skill.id)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isExpanded ? <ChevronDown size={14} color="var(--color-text-secondary)" /> : <ChevronRight size={14} color="var(--color-text-secondary)" />}
                  {skill.type === 'builtin' ? <Shield size={14} color="var(--color-info-text)" /> : <Puzzle size={14} color="var(--color-purple)" />}
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{skill.label || skill.name}</span>
                  <Badge variant={skill.type === 'builtin' ? 'info' : 'purple'}>{skill.type}</Badge>
                  {skill.category && <Badge variant="default">{skill.category}</Badge>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {skill.type !== 'builtin' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(skill.id) }}
                      disabled={deleteMutation.isPending}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 8,
                        borderRadius: 'var(--radius-sm)', transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-error-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Trash2 size={16} color="var(--color-error)" />
                    </button>
                  )}
                </div>
              </div>

              {/* Description (always visible) */}
              <p style={{ margin: '6px 0 0 30px', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                {skill.description}
              </p>

              {/* Expanded detail panel */}
              {isExpanded && <SkillDetailPanel skillId={skill.id} />}
            </Card>
          )
        })
      )}
    </div>
  )
}

/* Skill Detail Panel — fetches full detail on expand */
function SkillDetailPanel({ skillId }: { skillId: string }) {
  const { data: detail, isLoading } = useSkillDetail(skillId)

  if (isLoading) {
    return (
      <div style={{ padding: '16px 30px' }}>
        <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (!detail) return null

  const sectionTitle = {
    margin: '0 0 6px' as const, fontSize: '0.82rem', fontWeight: 700 as const,
    color: 'var(--color-text)',
  }

  const codeBlock = {
    background: 'var(--color-bg)', padding: 12, borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    fontSize: '0.78rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const,
    maxHeight: 300, overflow: 'auto' as const, margin: 0,
  }

  return (
    <div style={{
      marginTop: 12, paddingTop: 12, marginLeft: 30,
      borderTop: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* ID */}
      <div>
        <p style={sectionTitle}>ID</p>
        <code style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
          {detail.id}
        </code>
      </div>

      {/* Prompt Template (custom only) */}
      {detail.prompt_template && (
        <div>
          <p style={sectionTitle}>Prompt Template</p>
          <div style={codeBlock}>{detail.prompt_template}</div>
        </div>
      )}

      {/* Output Schema */}
      {detail.output_schema && (
        <div>
          <p style={sectionTitle}>Output Schema</p>
          <pre style={{ ...codeBlock, lineHeight: 1.5 }}>
            {JSON.stringify(detail.output_schema, null, 2)}
          </pre>
        </div>
      )}

      {/* Metadata */}
      {(detail.createdAt || detail.updatedAt) && (
        <div style={{ display: 'flex', gap: 24, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {detail.createdAt && <span>Created: {new Date(detail.createdAt).toLocaleString()}</span>}
          {detail.updatedAt && <span>Updated: {new Date(detail.updatedAt).toLocaleString()}</span>}
        </div>
      )}
    </div>
  )
}
