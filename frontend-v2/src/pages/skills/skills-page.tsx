import { useMemo, useState } from 'react'

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
    if (!confirm(`"${s.label}" 스킬을 삭제할까요?`)) return
    try {
      await deleteSkill.mutateAsync(s.id)
    } catch (err) {
      console.error('[SkillsPage] delete failed', err)
      alert('삭제에 실패했습니다.')
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
          <h2 className="page-title">스킬 관리</h2>
          <p className="page-subtitle">
            카피 검증/생성/분석에 사용되는 built-in 및 custom 스킬을
            관리하세요.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Button variant="ghost" onClick={() => setIsWizardOpen(true)}>
            ✦ AI 초안 생성
          </Button>
          <Button onClick={() => setIsCreating(true)}>+ 새 스킬</Button>
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
            전체 <Badge tone="neutral">{counts.total}</Badge>
          </FilterChip>
          <FilterChip
            active={filter === 'skillmd'}
            onClick={() => setFilter('skillmd')}
          >
            built-in <Badge tone="neutral">{counts.skillmd}</Badge>
          </FilterChip>
          <FilterChip
            active={filter === 'custom'}
            onClick={() => setFilter('custom')}
          >
            custom <Badge tone="neutral">{counts.custom}</Badge>
          </FilterChip>
          <div style={{ flex: 1 }} />
          <input
            className="input"
            placeholder="ID/라벨/설명 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ maxWidth: 280 }}
          />
        </div>

        {skills.isLoading && (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            스킬을 불러오는 중…
          </p>
        )}
        {skills.isError && (
          <p style={{ fontSize: 13, color: 'var(--danger)' }}>
            스킬 목록을 불러오지 못했습니다.
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
