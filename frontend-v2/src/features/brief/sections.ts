import type { CampaignBrief } from '@/shared/api/types'

export type BriefFieldName = keyof CampaignBrief

export interface BriefField {
  name: BriefFieldName
  label: string
  type: 'text' | 'textarea'
  placeholder: string
  required?: boolean
  rows?: number
}

export interface BriefSection {
  id: string
  title: string
  guide?: string
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
    title: 'Project',
    fields: [
      {
        name: 'projectName',
        label: 'Project Name',
        type: 'text',
        placeholder: '예: LG OLED TV Global Launch',
        required: true,
      },
    ],
  },
  {
    id: 'context',
    title: '1. Project Context',
    guide:
      '이 프로젝트가 왜 지금 필요한지, 배경과 중요성을 설명합니다.\n\n다음 중 해당하는 사항을 중심으로 서술해 주세요:\n- 신제품 런칭: 어떤 제품/서비스가 새로 출시되는가?\n- 소비자 인사이트: 최근 발견된 소비자 트렌드나 니즈 변화는?\n- 경쟁사 대응: 경쟁사의 어떤 움직임에 대응하는 캠페인인가?\n- 시즌/이벤트: 특정 시즌이나 스폰서십 연계인가?\n- 브랜드 전략: 리포지셔닝, 인지도 확대 등 전략적 목적이 있는가?\n\n작성 팁: "왜 이 캠페인을 하는가?"에 대한 답을 경영진에게 설명하듯 간결하게 써주세요.',
    fields: [
      {
        name: 'projectContext',
        label: '',
        type: 'textarea',
        placeholder: '배경과 중요성을 서술해 주세요',
        required: true,
        rows: 5,
      },
    ],
  },
  {
    id: 'objective',
    title: '2. Objective',
    guide:
      '캠페인 목표를 세 가지 계층으로 서술합니다. 각 목표는 측정 가능(Measurable)해야 합니다.\n\n[Commercial] 매출/점유율/재구매 등 비즈니스 목표\n[Behavior] 광고를 본 소비자가 취하길 바라는 행동\n[Attitudinal] 브랜드/제품에 대한 인식 변화',
    fields: [
      {
        name: 'objectiveCommercial',
        label: 'Commercial',
        type: 'textarea',
        placeholder: '예: 북미 OLED 매출 YoY +15%, 프리미엄 점유율 45%',
        required: true,
        rows: 2,
      },
      {
        name: 'objectiveBehavior',
        label: 'Behavior',
        type: 'textarea',
        placeholder: '예: 제품 페이지 방문 +20%, 매장 체험 예약 10,000건',
        required: true,
        rows: 2,
      },
      {
        name: 'objectiveAttitudinal',
        label: 'Attitudinal',
        type: 'textarea',
        placeholder: '예: "TV 기술 리더" 이미지 속성 +5pt',
        required: true,
        rows: 2,
      },
    ],
  },
  {
    id: 'audience',
    title: '3. Audience',
    guide:
      '인구통계(연령/성별/소득/지역), 라이프스타일, 구매 행동, 페인 포인트를 포함해 구체적으로 정의합니다. 복수 타겟은 Primary / Secondary 우선순위를 명시해 주세요.',
    fields: [
      {
        name: 'audience',
        label: '',
        type: 'textarea',
        placeholder: '타겟 고객을 구체적으로 묘사해 주세요',
        required: true,
        rows: 3,
      },
    ],
  },
  {
    id: 'keyMessage',
    title: '4. Key Message',
    guide:
      '소비자에게 전달할 가장 중요한 메시지 1-2문장. 기능(Feature)이 아닌 혜택(Benefit)으로, "딱 하나만 기억한다면?"에 대한 답을 작성합니다.',
    fields: [
      {
        name: 'keyMessage',
        label: '',
        type: 'textarea',
        placeholder: '소비자가 기억해야 할 단 하나의 메시지',
        required: true,
        rows: 3,
      },
    ],
  },
  {
    id: 'proofPoints',
    title: '5. Proof Points',
    guide:
      'Key Message를 뒷받침할 근거 1~3개. 기술적 우위, 수상/인증, 실적, 소비자 증언, 전문가 보증 등에서 선정하고 숫자/출처를 포함하면 좋습니다.',
    fields: [
      {
        name: 'proofPoints',
        label: '',
        type: 'textarea',
        placeholder: '1. ... \n2. ... \n3. ...',
        required: true,
        rows: 4,
      },
    ],
  },
  {
    id: 'mandatories',
    title: '6. Mandatories',
    guide:
      '반드시 준수해야 하는 미디어/채널, 제작물 스펙, 브랜드 가이드라인, 법적/규제 사항 등.',
    fields: [
      {
        name: 'mandatories',
        label: '',
        type: 'textarea',
        placeholder: '필수 요건을 기입해 주세요 (선택)',
        rows: 3,
      },
    ],
  },
  {
    id: 'budget',
    title: '7. Budget',
    guide: '총 예산 및 매체별 배분. 전년 대비 증감도 함께 기입하면 좋습니다.',
    fields: [
      {
        name: 'budget',
        label: '',
        type: 'text',
        placeholder: '예: 총 $2M (미디어 $1.5M + 제작 $500K)',
      },
    ],
  },
  {
    id: 'marketNeeds',
    title: '8. Market Needs',
    guide:
      '광고가 집행될 시장 정보와 로컬라이제이션 요구사항. 타겟 국가/언어, 문화적 고려사항, 현지 경쟁 환경 등.',
    fields: [
      {
        name: 'marketNeeds',
        label: '',
        type: 'textarea',
        placeholder: '예: 미국/독일/인도 3개 시장, 시장별 어댑테이션 필요',
        required: true,
        rows: 3,
      },
    ],
  },
  {
    id: 'timing',
    title: '9. Timing',
    guide:
      '캠페인 집행 기간, 주요 마일스톤(제품 출시일, CES/IFA 등), 단계별 계획(Teasing/Launch/Sustain).',
    fields: [
      {
        name: 'timing',
        label: '',
        type: 'text',
        placeholder: '예: 2026.04.01 ~ 2026.06.30 (3개월)',
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

export function briefToMarkdown(b: CampaignBrief): string {
  const val = (v: string) => (v.trim() ? v : '_(미작성)_')
  return `# LG Project Input Research

### PROJECT: ${b.projectName}
### 생성일: ${b.date.replace(/-/g, '.')}

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
