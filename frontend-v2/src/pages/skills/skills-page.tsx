import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import {
  SkillDetailModal,
  SkillEditorModal,
  SkillList,
} from '@/features/skill-registry'
import { SkillDraftWizard } from '@/features/skill-authoring'
import { useDeleteSkill, useSkills } from '@/shared/api/hooks'
import type { CustomSkillCreate, Skill } from '@/shared/api/types'

export function SkillsPage() {
  const { t } = useTranslation(['skills', 'common', 'page'])
  const skills = useSkills()
  const deleteSkill = useDeleteSkill()

  const [filter, setFilter] = useState<'all' | 'skillmd' | 'custom'>('all')
  const [query, setQuery] = useState('')
  const [viewing, setViewing] = useState<Skill | null>(null)
  const [editing, setEditing] = useState<Skill | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [draftSeed, setDraftSeed] = useState<CustomSkillCreate | undefined>()
  const [isWizardOpen, setIsWizardOpen] = useState(false)

  const filtered = useMemo(() => {
    const all = skills.data ?? []
    const q = query.trim().toLowerCase()
    return all.filter((s) => {
      if (filter !== 'all' && s.type !== filter) return false
      if (!q) return true
      return (
        s.id.toLowerCase().includes(q) ||
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      )
    })
  }, [skills.data, filter, query])

  const counts = useMemo(() => {
    const all = skills.data ?? []
    return {
      total: all.length,
      skillmd: all.filter((s) => s.type === 'skillmd').length,
      custom: all.filter((s) => s.type === 'custom').length,
    }
  }, [skills.data])

  const handleDelete = async (s: Skill) => {
    if (!confirm(t('skills:confirm.delete', { label: s.label }))) return
    try {
      await deleteSkill.mutateAsync(s.id)
    } catch (err) {
      console.error('[SkillsPage] delete failed', err)
      alert(t('skills:error.deleteFailed'))
    }
  }

  const handleDraftReady = (draft: CustomSkillCreate) => {
    setDraftSeed(draft)
    setIsCreating(true)
  }

  const handleClosedEditor = () => {
    setEditing(null)
    setIsCreating(false)
    setDraftSeed(undefined)
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2 className="page-title">{t('page:skills.title')}</h2>
          <p className="page-subtitle">{t('page:skills.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Button variant="ghost" onClick={() => setIsWizardOpen(true)}>
            {t('skills:button.aiDraft')}
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            {t('skills:button.newSkill')}
          </Button>
        </div>
      </div>

      <Card>
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginBottom: 12,
            flexWrap: 'wrap',
          }}
        >
          <FilterChip
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            {t('skills:filter.all')} <Badge tone="neutral">{counts.total}</Badge>
          </FilterChip>
          <FilterChip
            active={filter === 'skillmd'}
            onClick={() => setFilter('skillmd')}
          >
            {t('skills:filter.builtin')}{' '}
            <Badge tone="neutral">{counts.skillmd}</Badge>
          </FilterChip>
          <FilterChip
            active={filter === 'custom'}
            onClick={() => setFilter('custom')}
          >
            {t('skills:filter.custom')}{' '}
            <Badge tone="neutral">{counts.custom}</Badge>
          </FilterChip>
          <div style={{ flex: 1 }} />
          <input
            className="input"
            placeholder={t('skills:searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ maxWidth: 280 }}
          />
        </div>

        {skills.isLoading && (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            {t('skills:loading')}
          </p>
        )}
        {skills.isError && (
          <p style={{ fontSize: 13, color: 'var(--danger)' }}>
            {t('skills:loadError')}
          </p>
        )}
        {!skills.isLoading && !skills.isError && (
          <SkillList
            skills={filtered}
            onView={setViewing}
            onEdit={setEditing}
            onDelete={handleDelete}
            isDeleting={deleteSkill.isPending}
          />
        )}
      </Card>

      <SkillDetailModal
        skill={viewing}
        onClose={() => setViewing(null)}
        onEdit={(s) => setEditing(s)}
      />

      <SkillEditorModal
        open={isCreating || !!editing}
        skill={editing}
        initialDraft={isCreating ? draftSeed : undefined}
        onClose={handleClosedEditor}
      />

      <SkillDraftWizard
        open={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onDraftReady={handleDraftReady}
      />
    </>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 999,
        border: `1.5px solid ${active ? 'var(--lg-red-600)' : 'var(--color-border)'}`,
        background: active ? 'var(--lg-red-100)' : 'var(--white)',
        color: active ? 'var(--lg-red-700)' : 'var(--neutral-900)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
