/**
 * 국가 코드 → 추천 스킬 매핑.
 *
 * 선택된 카피의 국가에 따라 자동 체크되는 기본 스킬 세트. 사용자는 그 위에서
 * 추가/해제할 수 있습니다. 실제 활성화 시에는 서버에서 받은 사용 가능 스킬과
 * 교집합만 반영됩니다.
 */

/** 국가 코드 → 해당 국가의 culture-* 스킬 ID */
const COUNTRY_TO_CULTURE: Record<string, string> = {
  US: 'culture-usa',
  DE: 'culture-germany',
  GB: 'culture-uk',
  FR: 'culture-france',
  IT: 'culture-italy',
  ES: 'culture-spain',
  JP: 'culture-japan',
  CN: 'culture-china',
  IN: 'culture-india',
  BR: 'culture-brazil',
  ID: 'culture-indonesia',
  TH: 'culture-thailand',
  SA: 'culture-uae',
  NL: 'culture-netherlands',
  SE: 'culture-sweden',
  PL: 'culture-poland',
  MX: 'culture-mexico',
  CA: 'culture-canada',
}

/**
 * 국가별 규제 리스크 번들 (해당 관할에서 특별히 주의해야 하는 검증).
 * 강한 규제 프레임이 있는 국가만 지정. 매핑에 없는 국가는 기본(compliance) 만.
 */
const COUNTRY_TO_REGULATORY: Record<string, string[]> = {
  // US: FTC 광고 관련 가이드 (endorsement, green guides, advertising substantiation)
  US: [
    'ai-washing-risk-check',
    'environmental-claim-risk-check',
    'comparative-ad-risk-check',
  ],
  // EU Green Claims Directive / Unfair Commercial Practices Directive
  DE: ['environmental-claim-risk-check', 'comparative-ad-risk-check'],
  FR: ['environmental-claim-risk-check', 'comparative-ad-risk-check'],
  IT: ['environmental-claim-risk-check', 'comparative-ad-risk-check'],
  ES: ['environmental-claim-risk-check', 'comparative-ad-risk-check'],
  NL: ['environmental-claim-risk-check', 'comparative-ad-risk-check'],
  SE: ['environmental-claim-risk-check', 'comparative-ad-risk-check'],
  PL: ['environmental-claim-risk-check', 'comparative-ad-risk-check'],
  // UK: CAP code (comparative), CMA Green Claims
  GB: ['environmental-claim-risk-check', 'comparative-ad-risk-check'],
  // 기타 국가는 기본 compliance만 (함수에서 추가)
}

/**
 * 국가 코드들에 대해 자동 추천할 스킬 ID 세트 반환.
 *
 * 포함:
 *  1. 해당 국가의 culture-<country>
 *  2. 해당 국가의 규제 번들 (있을 때)
 *  3. 모든 검토의 기본: `compliance-redflag-detector`, `regional-culture-fit-check`
 *
 * @param countryCodes 카피가 겨냥하는 국가 코드들 (예: ['US','DE','KR'])
 */
export function recommendSkillsForCountries(countryCodes: string[]): string[] {
  const set = new Set<string>()

  // 기본 세트 — 어떤 국가든 공통으로 추천
  set.add('compliance-redflag-detector')
  if (countryCodes.length > 0) {
    set.add('regional-culture-fit-check')
  }

  for (const code of countryCodes) {
    const culture = COUNTRY_TO_CULTURE[code]
    if (culture) set.add(culture)
    const reg = COUNTRY_TO_REGULATORY[code]
    if (reg) reg.forEach((id) => set.add(id))
  }

  return [...set]
}

/** 단일 국가의 culture-* 스킬 ID (없으면 null). */
export function cultureSkillFor(countryCode: string): string | null {
  return COUNTRY_TO_CULTURE[countryCode] ?? null
}
