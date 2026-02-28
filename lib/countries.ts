import { Locale } from '@/types/locale';

export const countryNames: { [key: string]: { ko: string; en: string; ja: string } } = {
  kr: { ko: '대한민국', en: 'South Korea', ja: '韓国' },
  us: { ko: '미국', en: 'United States', ja: 'アメリカ' },
  jp: { ko: '일본', en: 'Japan', ja: '日本' },
  cn: { ko: '중국', en: 'China', ja: '中国' },
  gb: { ko: '영국', en: 'United Kingdom', ja: 'イギリス' },
  de: { ko: '독일', en: 'Germany', ja: 'ドイツ' },
  fr: { ko: '프랑스', en: 'France', ja: 'フランス' },
  ca: { ko: '캐나다', en: 'Canada', ja: 'カナダ' },
  au: { ko: '호주', en: 'Australia', ja: 'オーストラリア' },
  vn: { ko: '베트남', en: 'Vietnam', ja: 'ベトナム' },
  th: { ko: '태국', en: 'Thailand', ja: 'タイ' },
  ph: { ko: '필리핀', en: 'Philippines', ja: 'フィリピン' },
  in: { ko: '인도', en: 'India', ja: 'インド' },
  sg: { ko: '싱가포르', en: 'Singapore', ja: 'シンガポール' },
  my: { ko: '말레이시아', en: 'Malaysia', ja: 'マレーシア' },
  tw: { ko: '대만', en: 'Taiwan', ja: '台湾' },
  hk: { ko: '홍콩', en: 'Hong Kong', ja: '香港' },
};

export function getCountryName(countryCode: string | null | undefined, locale: Locale, fallback: string = 'Not Set'): string {
  if (!countryCode) return fallback;

  const code = countryCode.toLowerCase();
  return countryNames[code]?.[locale] || countryCode.toUpperCase();
}
