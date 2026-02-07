'use client';

import { useState } from 'react';
import logger from '@/lib/logger';

// 언어 코드 매핑
const LANGUAGE_MAP: { [key: string]: string } = {
  korean: 'ko',
  english: 'en',
  japanese: 'ja',
  // 국가 코드 -> 언어 코드
  kr: 'ko',
  us: 'en',
  jp: 'ja',
  cn: 'zh',
  tw: 'zh-TW',
  gb: 'en',
  au: 'en',
  ca: 'en',
  de: 'de',
  fr: 'fr',
  es: 'es',
  it: 'it',
  ru: 'ru',
  br: 'pt',
  mx: 'es',
  in: 'hi',
  th: 'th',
  vn: 'vi',
  id: 'id',
  ph: 'tl',
  sg: 'en',
  my: 'ms',
};

/**
 * 클라이언트 사이드에서 텍스트 번역
 * MyMemory Translation API 사용 (무료, 제한: 하루 1000 단어)
 */
export function useTranslate() {
  const [isLoading, setIsLoading] = useState(false);

  const translateText = async (text: string, targetLanguage: string, sourceLanguage?: string): Promise<string> => {
    if (typeof window === 'undefined') return text;
    if (!text || text.trim() === '') return text;

    setIsLoading(true);
    try {
      // targetLanguage가 'ko', 'en', 'ja' 같은 코드면 그대로 사용
      // korean, english 같은 단어면 코드로 변환
      const targetLangCode = LANGUAGE_MAP[targetLanguage] || targetLanguage || 'en';

      // sourceLanguage도 매핑 (korean -> ko)
      const sourceLangCode = sourceLanguage ? (LANGUAGE_MAP[sourceLanguage] || sourceLanguage) : 'en';

      // MyMemory Translation API (무료)
      // langpair 형식: 소스언어|대상언어 (예: ko|ja, en|ko)
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLangCode}|${targetLangCode}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translatedText = data.responseData.translatedText;
        logger.log(`🌐 번역 성공: "${text}" (${sourceLangCode}) → "${translatedText}" (${targetLangCode})`);
        return translatedText;
      } else {
        logger.warn('⚠️ 번역 API 응답 이상, 원본 표시:', data);
        return text;
      }
    } catch (error) {
      logger.error('❌ 번역 실패:', error);
      // 번역 실패 시 원본 텍스트 반환
      return text;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    translateText,
    isLoading,
  };
}
