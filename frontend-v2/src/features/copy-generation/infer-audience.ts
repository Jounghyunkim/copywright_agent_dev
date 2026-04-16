/**
 * Infer target age groups and personas from the brief's audience free-text.
 *
 * Uses simple keyword matching (Korean + English). Returns IDs that match
 * constants.ts AGE_GROUPS and TARGET_PERSONAS.
 * Result is used to pre-select checkboxes; users can still freely modify.
 */

// ── Age group inference ──

/** Maps keyword patterns to AGE_GROUPS id(s) */
const AGE_PATTERNS: [RegExp, string[]][] = [
  // Explicit ranges (e.g., "25-34", "25~34", "25–34")
  [/18[\s~\-–—]+24/, ['18-24']],
  [/25[\s~\-–—]+34/, ['25-34']],
  [/35[\s~\-–—]+44/, ['35-44']],
  [/45[\s~\-–—]+54/, ['45-54']],
  [/55\s*[\+이상]/, ['55+']],

  // Korean decade terms (20대, 30대, …)
  [/10대/, ['18-24']],
  [/20대/, ['18-24', '25-34']],
  [/30대/, ['25-34', '35-44']],
  [/40대/, ['35-44', '45-54']],
  [/50대/, ['45-54', '55+']],
  [/60대/, ['55+']],

  // Generational labels
  [/z\s*세대|gen[\s-]*z/i, ['18-24']],
  [/mz\s*세대/i, ['18-24', '25-34']],
  [/밀레니얼|millennia/i, ['25-34', '35-44']],
  [/x\s*세대|gen[\s-]*x/i, ['35-44', '45-54']],
  [/베이비\s*붐|baby[\s-]*boom/i, ['55+']],

  // General terms
  [/청년|young\s*adult/i, ['18-24', '25-34']],
  [/중장년/, ['45-54', '55+']],
  [/시니어|senior|실버|고령/i, ['55+']],
]

// ── Persona inference ──

/** Maps keyword patterns to TARGET_PERSONAS id */
const PERSONA_PATTERNS: [RegExp, string][] = [
  // tech-enthusiast
  [/테크|tech|기술|얼리\s*어답터|early\s*adopt|디지털|digital|혁신|innovat|IT|스마트|smart|가전|gadget|첨단/i, 'tech-enthusiast'],

  // premium-lifestyle
  [/프리미엄|premium|럭셔리|luxury|하이엔드|high[\s-]*end|고급|상위\s*계층|상류|富|affluent/i, 'premium-lifestyle'],

  // value-seeker
  [/가성비|가격\s*대비|value|합리적|실용|경제적|알뜰|budget|price[\s-]*conscious|저렴|비용\s*효율/i, 'value-seeker'],

  // family-first
  [/가족|family|자녀|아이|육아|부모|parent|child|kid|주부|맞벌이|신혼|household/i, 'family-first'],

  // eco-conscious
  [/환경|eco|지속\s*가능|sustainable|친환경|그린|green|탄소|carbon|재활용|recycle|에너지\s*절약|energy[\s-]*sav/i, 'eco-conscious'],
]

export interface InferredAudience {
  ageGroups: string[]
  personas: string[]
}

export function inferFromAudience(audienceText: string): InferredAudience {
  if (!audienceText || !audienceText.trim()) return { ageGroups: [], personas: [] }

  const text = audienceText.toLowerCase()

  const ageSet = new Set<string>()
  for (const [re, ids] of AGE_PATTERNS) {
    if (re.test(text)) {
      for (const id of ids) ageSet.add(id)
    }
  }

  const personaSet = new Set<string>()
  for (const [re, id] of PERSONA_PATTERNS) {
    if (re.test(text)) personaSet.add(id)
  }

  return {
    ageGroups: Array.from(ageSet),
    personas: Array.from(personaSet),
  }
}
