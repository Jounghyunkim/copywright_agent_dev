/** Skill ID -> Korean label map */
export const SKILL_LABELS: Record<string, string> = {
  'brand-lexicon-check': '브랜드 용어 검증',
  'cultural-sensitivity-check': '문화 감수성 검증',
  'ai-washing-check': 'AI Washing 검증',
  'tone-consistency-check': '톤앤매너 일관성 검증',
  'cta-effectiveness-check': 'CTA 효과성 검증',
  'legal-compliance-check': '법적 준수사항 검증',
}

export function getSkillLabel(id: string): string {
  return SKILL_LABELS[id] ?? id
}
