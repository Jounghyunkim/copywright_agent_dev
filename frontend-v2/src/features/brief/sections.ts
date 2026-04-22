import type { CampaignBrief } from '@/shared/api/types'

export type BriefFieldName = keyof CampaignBrief

/**
 * 각 brief 섹션/필드는 i18n 키를 참조한다.
 * labelKey / placeholderKey / titleKey / guideKey 는 namespace:path 형식.
 * UI 렌더 시 t(...) 로 해석.
 */
export interface BriefField {
  name: BriefFieldName
  /** Label i18n key. 빈 문자열 라벨이면 생략. */
  labelKey?: string
  type: 'text' | 'textarea'
  placeholderKey: string
  required?: boolean
  rows?: number
}

export interface BriefSection {
  id: string
  titleKey: string
  guideKey?: string
  fields: BriefField[]
}

const TODAY = new Date().toISOString().slice(0, 10)

export const INITIAL_BRIEF: CampaignBrief = {
  projectName: '',
  date: TODAY,
  projectContext: '',
  objectiveCommercial: '',
  objectiveBehavior: '',
  objectiveAttitudinal: '',
  audience: '',
  keyMessage: '',
  proofPoints: '',
  mandatories: '',
  budget: '',
  marketNeeds: '',
  timing: '',
}

export const SECTIONS: BriefSection[] = [
  {
    id: 'project',
    titleKey: 'brief:section.project.title',
    fields: [
      {
        name: 'projectName',
        labelKey: 'brief:field.projectName.label',
        type: 'text',
        placeholderKey: 'brief:field.projectName.placeholder',
        required: true,
      },
    ],
  },
  {
    id: 'context',
    titleKey: 'brief:section.context.title',
    guideKey: 'brief:section.context.guide',
    fields: [
      {
        name: 'projectContext',
        type: 'textarea',
        placeholderKey: 'brief:field.projectContext.placeholder',
        required: true,
        rows: 5,
      },
    ],
  },
  {
    id: 'objective',
    titleKey: 'brief:section.objective.title',
    guideKey: 'brief:section.objective.guide',
    fields: [
      {
        name: 'objectiveCommercial',
        labelKey: 'brief:field.objectiveCommercial.label',
        type: 'textarea',
        placeholderKey: 'brief:field.objectiveCommercial.placeholder',
        required: true,
        rows: 2,
      },
      {
        name: 'objectiveBehavior',
        labelKey: 'brief:field.objectiveBehavior.label',
        type: 'textarea',
        placeholderKey: 'brief:field.objectiveBehavior.placeholder',
        required: true,
        rows: 2,
      },
      {
        name: 'objectiveAttitudinal',
        labelKey: 'brief:field.objectiveAttitudinal.label',
        type: 'textarea',
        placeholderKey: 'brief:field.objectiveAttitudinal.placeholder',
        required: true,
        rows: 2,
      },
    ],
  },
  {
    id: 'audience',
    titleKey: 'brief:section.audience.title',
    guideKey: 'brief:section.audience.guide',
    fields: [
      {
        name: 'audience',
        type: 'textarea',
        placeholderKey: 'brief:field.audience.placeholder',
        required: true,
        rows: 3,
      },
    ],
  },
  {
    id: 'keyMessage',
    titleKey: 'brief:section.keyMessage.title',
    guideKey: 'brief:section.keyMessage.guide',
    fields: [
      {
        name: 'keyMessage',
        type: 'textarea',
        placeholderKey: 'brief:field.keyMessage.placeholder',
        required: true,
        rows: 3,
      },
    ],
  },
  {
    id: 'proofPoints',
    titleKey: 'brief:section.proofPoints.title',
    guideKey: 'brief:section.proofPoints.guide',
    fields: [
      {
        name: 'proofPoints',
        type: 'textarea',
        placeholderKey: 'brief:field.proofPoints.placeholder',
        required: true,
        rows: 4,
      },
    ],
  },
  {
    id: 'mandatories',
    titleKey: 'brief:section.mandatories.title',
    guideKey: 'brief:section.mandatories.guide',
    fields: [
      {
        name: 'mandatories',
        type: 'textarea',
        placeholderKey: 'brief:field.mandatories.placeholder',
        rows: 3,
      },
    ],
  },
  {
    id: 'budget',
    titleKey: 'brief:section.budget.title',
    guideKey: 'brief:section.budget.guide',
    fields: [
      {
        name: 'budget',
        type: 'text',
        placeholderKey: 'brief:field.budget.placeholder',
      },
    ],
  },
  {
    id: 'marketNeeds',
    titleKey: 'brief:section.marketNeeds.title',
    guideKey: 'brief:section.marketNeeds.guide',
    fields: [
      {
        name: 'marketNeeds',
        type: 'textarea',
        placeholderKey: 'brief:field.marketNeeds.placeholder',
        required: true,
        rows: 3,
      },
    ],
  },
  {
    id: 'timing',
    titleKey: 'brief:section.timing.title',
    guideKey: 'brief:section.timing.guide',
    fields: [
      {
        name: 'timing',
        type: 'text',
        placeholderKey: 'brief:field.timing.placeholder',
        required: true,
      },
    ],
  },
]

export function isSectionRequired(section: BriefSection): boolean {
  return section.fields.some((f) => f.required)
}

export function sectionHasEmpty(
  section: BriefSection,
  brief: CampaignBrief,
): boolean {
  return section.fields.some(
    (f) => f.required && (brief[f.name] ?? '').toString().trim() === '',
  )
}

export function isBriefValid(brief: CampaignBrief): boolean {
  return SECTIONS.every((s) =>
    s.fields.every(
      (f) => !f.required || (brief[f.name] ?? '').toString().trim() !== '',
    ),
  )
}

/** Markdown 변환 — 저장된 brief를 보기 좋게 출력.
 *  "(not written)" 플레이스홀더는 호출자가 i18n된 값을 placeholder로 넘긴다. */
export function briefToMarkdown(
  b: CampaignBrief,
  opts?: { notWritten?: string; createdLabel?: string },
): string {
  const placeholder = opts?.notWritten ?? '_(not written)_'
  const createdLabel = opts?.createdLabel ?? 'Created'
  const val = (v: string) => (v.trim() ? v : placeholder)
  return `# LG Project Input Research

### PROJECT: ${b.projectName}
### ${createdLabel}: ${b.date.replace(/-/g, '.')}

---

## 1. Project Context
${val(b.projectContext)}

---

## 2. Objective

### Commercial Objectives
${val(b.objectiveCommercial)}

### Behavior Objectives
${val(b.objectiveBehavior)}

### Attitudinal Objectives
${val(b.objectiveAttitudinal)}

---

## 3. Audience
${val(b.audience)}

---

## 4. Key Message
${val(b.keyMessage)}

---

## 5. Proof Points
${val(b.proofPoints)}

---

## 6. Mandatories
${val(b.mandatories)}

---

## 7. Budget
${val(b.budget)}

---

## 8. Market Needs
${val(b.marketNeeds)}

---

## 9. Timing
${val(b.timing)}
`
}
