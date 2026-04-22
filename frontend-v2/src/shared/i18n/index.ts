/**
 * i18next 초기화 모듈.
 *
 * - 리소스는 public/locales/<lang>/<ns>.json 에서 HTTP로 lazy load
 * - 감지 우선순위: localStorage('i18nextLng') → navigator.language → fallback(ko)
 * - 네임스페이스는 feature/영역별로 분리해 lazy 로드 가능
 * - HTML 루트의 lang / dir 속성을 언어 변경 시 자동 갱신 (setupHtmlDirSync)
 */
import i18n from 'i18next'
import HttpBackend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

export const SUPPORTED_LOCALES = [
  'ko',
  'en',
  'de',
  'fr',
  'es',
  'zh-CN',
  'ar',
  'th',
] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const LOCALE_META: Record<
  SupportedLocale,
  { label: string; nativeLabel: string; dir: 'ltr' | 'rtl' }
> = {
  ko: { label: 'Korean', nativeLabel: '한국어', dir: 'ltr' },
  en: { label: 'English', nativeLabel: 'English', dir: 'ltr' },
  de: { label: 'German', nativeLabel: 'Deutsch', dir: 'ltr' },
  fr: { label: 'French', nativeLabel: 'Français', dir: 'ltr' },
  es: { label: 'Spanish', nativeLabel: 'Español', dir: 'ltr' },
  'zh-CN': { label: 'Chinese (Simplified)', nativeLabel: '简体中文', dir: 'ltr' },
  ar: { label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
  th: { label: 'Thai', nativeLabel: 'ไทย', dir: 'ltr' },
}

export const NAMESPACES = [
  'common',
  'navigation',
  'page',
  'auth',
  'settings',
  'home',
  'workflow',
  'workflow-list',
  'copy-review',
  'copy-results',
  'generation',
  'review',
  'approval',
  'skills',
  'brief',
  'analysis',
  'chat',
  'knowledge',
  'stats',
  'admin',
  'matrix',
  'dashboard',
  'strategic-message',
] as const

void i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // 소스 언어를 'en' 단일로 고정. ko→en→키 순으로 폴백하여
    // 영어 사용자에게 한국어가 노출되는 역류 현상을 차단.
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LOCALES as unknown as string[],
    ns: NAMESPACES as unknown as string[],
    defaultNS: 'common',
    load: 'currentOnly',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React는 자체 XSS 방어
    },
    returnEmptyString: false,
    returnNull: false,
    react: {
      useSuspense: false, // 초기 로딩 중 blank flash 방지
    },
  })

/**
 * <html lang> / <html dir> / body 글꼴을 현재 로케일에 맞춰 동기화.
 * App 진입 시 한 번 호출하면 이후 i18n.changeLanguage 시 자동 반응.
 */
export function setupHtmlDirSync(): void {
  const apply = (lng: string) => {
    const meta =
      LOCALE_META[lng as SupportedLocale] ??
      LOCALE_META[lng.split('-')[0] as SupportedLocale] ??
      LOCALE_META.ko
    document.documentElement.setAttribute('lang', lng)
    document.documentElement.setAttribute('dir', meta.dir)
    document.documentElement.setAttribute('data-locale', lng)
  }
  apply(i18n.language || 'ko')
  i18n.on('languageChanged', apply)
}

/**
 * i18next 초기화 완료까지 대기. App 최상단에서 await 하여
 * 키 원문(`common:button.save`)이 순간 노출되는 flash 를 방지.
 */
export function waitForI18n(): Promise<void> {
  if (i18n.isInitialized) return Promise.resolve()
  return new Promise((resolve) => {
    i18n.on('initialized', () => resolve())
  })
}

/** 현재 로케일이 RTL인지 여부. CSS logical property 전환이 부족한 컴포넌트에서 참조. */
export function isRTL(lng?: string): boolean {
  const target = lng ?? i18n.language
  const meta =
    LOCALE_META[target as SupportedLocale] ??
    LOCALE_META[target.split('-')[0] as SupportedLocale]
  return meta?.dir === 'rtl'
}

export default i18n
