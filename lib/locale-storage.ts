import { Locale, locales } from './i18n';

const LOCALE_STORAGE_KEY = 'preferredLocale';

/**
 * 브라우저 언어 감지 (ko, en, ja 중 하나)
 */
export function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return 'en';

  const browserLang = navigator.language.toLowerCase();

  if (browserLang.startsWith('ko')) return 'ko';
  if (browserLang.startsWith('ja')) return 'ja';
  return 'en';
}

/**
 * localStorage에서 언어 가져오기
 */
export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && locales.includes(stored as Locale)) {
    return stored as Locale;
  }
  return null;
}

/**
 * localStorage에 언어 저장
 */
export function setStoredLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

/**
 * URL 파라미터, localStorage, 브라우저 언어 순으로 언어 결정
 */
export function resolveLocale(urlParam: string | null): Locale {
  // 1. URL 파라미터 우선
  if (urlParam && locales.includes(urlParam as Locale)) {
    return urlParam as Locale;
  }

  // 2. localStorage 확인
  const stored = getStoredLocale();
  if (stored) return stored;

  // 3. 브라우저 언어 감지
  return detectBrowserLocale();
}
