import translate from '@vitalets/google-translate-api';
import logger from '@/lib/logger';

// 언어 코드 매핑 (방 언어 → Google Translate 언어 코드)
const LANGUAGE_MAP: { [key: string]: string } = {
  korean: 'ko',
  english: 'en',
  japanese: 'ja',
};

/**
 * 텍스트를 대상 언어로 번역
 * @param text 원본 텍스트
 * @param targetLanguage 대상 언어 (korean, english, japanese)
 * @returns 번역된 텍스트 (실패 시 원본 텍스트 반환)
 */
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    const targetLangCode = LANGUAGE_MAP[targetLanguage] || 'en';

    const result = await translate(text, { to: targetLangCode });

    logger.log(`🌐 번역 성공: "${text}" → "${result.text}" (${targetLangCode})`);
    return result.text;
  } catch (error) {
    logger.error('❌ 번역 실패:', error);
    // 번역 실패 시 원본 텍스트 반환
    return text;
  }
}
