export interface CountryMeta {
  code: string
  label: string
  flag: string
  lang: string
}

export const COUNTRIES: CountryMeta[] = [
  { code: 'US', label: 'USA', flag: '🇺🇸', lang: 'English' },
  { code: 'DE', label: 'Germany', flag: '🇩🇪', lang: 'Deutsch' },
  { code: 'GB', label: 'UK', flag: '🇬🇧', lang: 'English (UK)' },
  { code: 'FR', label: 'France', flag: '🇫🇷', lang: 'Français' },
  { code: 'IT', label: 'Italy', flag: '🇮🇹', lang: 'Italiano' },
  { code: 'ES', label: 'Spain', flag: '🇪🇸', lang: 'Español' },
  { code: 'JP', label: 'Japan', flag: '🇯🇵', lang: '日本語' },
  { code: 'CN', label: 'China', flag: '🇨🇳', lang: '中文' },
  { code: 'IN', label: 'India', flag: '🇮🇳', lang: 'English / Hindi' },
  { code: 'BR', label: 'Brazil', flag: '🇧🇷', lang: 'Português' },
  { code: 'KR', label: 'Korea', flag: '🇰🇷', lang: '한국어' },
  { code: 'AU', label: 'Australia', flag: '🇦🇺', lang: 'English (AU)' },
  { code: 'ID', label: 'Indonesia', flag: '🇮🇩', lang: 'Bahasa Indonesia' },
  { code: 'TH', label: 'Thailand', flag: '🇹🇭', lang: 'ไทย' },
  { code: 'SA', label: 'Saudi Arabia', flag: '🇸🇦', lang: 'العربية' },
  { code: 'NL', label: 'Netherlands', flag: '🇳🇱', lang: 'Nederlands' },
  { code: 'SE', label: 'Sweden', flag: '🇸🇪', lang: 'Svenska' },
  { code: 'PL', label: 'Poland', flag: '🇵🇱', lang: 'Polski' },
  { code: 'MX', label: 'Mexico', flag: '🇲🇽', lang: 'Español' },
  { code: 'CA', label: 'Canada', flag: '🇨🇦', lang: 'English / Français' },
]

export interface AgeGroup {
  id: string
  label: string
}

export const AGE_GROUPS: AgeGroup[] = [
  { id: '18-24', label: '18–24' },
  { id: '25-34', label: '25–34' },
  { id: '35-44', label: '35–44' },
  { id: '45-54', label: '45–54' },
  { id: '55+', label: '55+' },
]

export interface TargetPersona {
  id: string
  /** i18n resource key (generation:persona.<key>.{label,desc}) */
  i18nKey: 'techEnthusiast' | 'premiumLifestyle' | 'valueSeeker' | 'familyFirst' | 'ecoConscious'
  /** 번역 누락 시 fallback용 원문 label */
  label: string
  /** 번역 누락 시 fallback용 원문 desc */
  desc: string
}

export const TARGET_PERSONAS: TargetPersona[] = [
  {
    id: 'tech-enthusiast',
    i18nKey: 'techEnthusiast',
    label: 'Tech Enthusiast',
    desc: 'Early adopter attuned to the latest technology',
  },
  {
    id: 'premium-lifestyle',
    i18nKey: 'premiumLifestyle',
    label: 'Premium Lifestyle',
    desc: 'Oriented toward premium lifestyle',
  },
  {
    id: 'value-seeker',
    i18nKey: 'valueSeeker',
    label: 'Value Seeker',
    desc: 'Rational shopper focused on value for money',
  },
  {
    id: 'family-first',
    i18nKey: 'familyFirst',
    label: 'Family First',
    desc: 'Practical, family-centered buyer',
  },
  {
    id: 'eco-conscious',
    i18nKey: 'ecoConscious',
    label: 'Eco Conscious',
    desc: 'Cares about environment and sustainability',
  },
]

export function countryMeta(code: string): CountryMeta {
  return (
    COUNTRIES.find((c) => c.code === code) ?? {
      code,
      label: code,
      flag: '🏳️',
      lang: '',
    }
  )
}
