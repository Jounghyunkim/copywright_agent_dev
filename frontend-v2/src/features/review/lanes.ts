/**
 * 리뷰 스킬을 4개의 검증 레인으로 분류.
 * - Risk & Compliance: 법무/규제/클레임 리스크
 * - Brand Integrity: LG 브랜드 정합성
 * - Craft Quality: 카피 자체 품질
 * - Localization: 국가·문화·언어 현지화
 *
 * 신규 스킬은 아래 매핑에 추가하거나, skill id가 'culture-*' 형태면 자동으로
 * localization 레인에 배정됩니다.
 */
export type Lane = 'risk' | 'brand' | 'craft' | 'localization'

const LANE_MAP: Record<string, Lane> = {
  // Risk & Compliance
  'ai-washing-risk-check': 'risk',
  'compliance-redflag-detector': 'risk',
  'environmental-claim-risk-check': 'risk',
  'comparative-ad-risk-check': 'risk',
  'claim-extractor': 'risk',
  'proof-point-checker': 'risk',
  'regulatory-copy-validation': 'risk',

  // Brand Integrity
  'lg-brand-fit-check': 'brand',
  'lg-brand-voice': 'brand',
  'brand-lexicon-check': 'brand',
  'tone-and-voice-enforcer': 'brand',
  'writer-solmi-check': 'brand',

  // Craft Quality
  'main-message-clarifier': 'craft',
  'headline-body-cta-composer': 'craft',
  'creative-impact-scorer': 'craft',
  'copy-scorecard-generator': 'craft',
  'customer-segment-fit-check': 'craft',
  'competitive-differentiation-review': 'craft',
  'competitor-copy-contrast-check': 'craft',
  'seasonality-fit-check': 'craft',

  // Localization
  'language-transcreation': 'localization',
  'regional-copy-adaptation': 'localization',
  'regional-culture-fit-check': 'localization',
  'localization-base': 'localization',
}

/** 스킬 ID → 레인. 매핑에 없고 'culture-' 접두사면 localization. 그 외엔 null(숨김). */
export function classifyLane(skillId: string): Lane | null {
  const direct = LANE_MAP[skillId]
  if (direct) return direct
  if (skillId.startsWith('culture-')) return 'localization'
  return null
}

/**
 * 레인 × 프리셋 레벨 → 권장 스킬 ID 세트.
 * 실제 활성화 시에는 사용 가능한 스킬 목록과 교집합만 적용됩니다.
 */
const PRESETS: Record<
  Lane,
  { light: string[]; standard: string[]; deep: string[] }
> = {
  risk: {
    light: ['compliance-redflag-detector'],
    standard: [
      'compliance-redflag-detector',
      'ai-washing-risk-check',
      'comparative-ad-risk-check',
    ],
    deep: [
      'compliance-redflag-detector',
      'ai-washing-risk-check',
      'comparative-ad-risk-check',
      'environmental-claim-risk-check',
      'claim-extractor',
      'proof-point-checker',
      'regulatory-copy-validation',
    ],
  },
  brand: {
    light: ['lg-brand-fit-check'],
    standard: [
      'lg-brand-fit-check',
      'lg-brand-voice',
      'tone-and-voice-enforcer',
    ],
    deep: [
      'lg-brand-fit-check',
      'lg-brand-voice',
      'brand-lexicon-check',
      'tone-and-voice-enforcer',
      'writer-solmi-check',
    ],
  },
  craft: {
    light: ['main-message-clarifier'],
    standard: [
      'main-message-clarifier',
      'creative-impact-scorer',
      'customer-segment-fit-check',
    ],
    deep: [
      'main-message-clarifier',
      'headline-body-cta-composer',
      'creative-impact-scorer',
      'copy-scorecard-generator',
      'customer-segment-fit-check',
      'competitive-differentiation-review',
      'competitor-copy-contrast-check',
      'seasonality-fit-check',
    ],
  },
  localization: {
    // culture-* 는 국가 자동 추천(1-C)에서 처리하므로 프리셋엔 기본 localization 파이프라인만
    light: ['regional-culture-fit-check'],
    standard: [
      'regional-culture-fit-check',
      'regional-copy-adaptation',
    ],
    deep: [
      'regional-culture-fit-check',
      'regional-copy-adaptation',
      'language-transcreation',
      'localization-base',
    ],
  },
}

/**
 * 레인의 프리셋을 해당 레인에서 실제 사용 가능한 스킬과 교집합으로 반환.
 * @param lane 레인
 * @param level Light / Standard / Deep
 * @param availableIds 이 레인에서 현재 선택 가능한 스킬 ID
 */
export function getLanePreset(
  lane: Lane,
  level: 'light' | 'standard' | 'deep',
  availableIds: string[],
): string[] {
  const recommended = PRESETS[lane][level]
  const availableSet = new Set(availableIds)
  return recommended.filter((id) => availableSet.has(id))
}
