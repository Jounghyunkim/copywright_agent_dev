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
  label: string
  desc: string
}

export const TARGET_PERSONAS: TargetPersona[] = [
  {
    id: 'tech-enthusiast',
    label: 'Tech Enthusiast',
    desc: '최신 기술에 민감한 얼리어답터',
  },
  {
    id: 'premium-lifestyle',
    label: 'Premium Lifestyle',
    desc: '프리미엄 라이프스타일 지향',
  },
  {
    id: 'value-seeker',
    label: 'Value Seeker',
    desc: '가성비를 중시하는 합리적 소비자',
  },
  {
    id: 'family-first',
    label: 'Family First',
    desc: '가족 중심의 실용적 소비자',
  },
  {
    id: 'eco-conscious',
    label: 'Eco Conscious',
    desc: '환경과 지속가능성에 관심',
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
