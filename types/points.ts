import { Locale } from './locale';
import { PointReason, PointTransactionType, ReferenceType, PointReasonString } from './points-shared';

// Re-export for convenience
export { PointReason, PointTransactionType, ReferenceType };
export type { PointReasonString };

/**
 * 포인트 내역 아이템
 */
export interface PointHistoryItem {
  id: number;
  amount: number;
  type: string;
  reason: string;
  reference_type?: string;
  reference_id?: number;
  created_at: string;
}

/**
 * 포인트 사유별 다국어 번역
 */
export const pointReasonTranslations: Record<string, Record<Locale, string>> = {
  // 수입 사유
  signup_bonus: {
    ko: '회원가입 축하 포인트',
    en: 'Sign-up Bonus',
    ja: '会員登録祝いポイント',
  },
  call_earning: {
    ko: '통화 수익',
    en: 'Call Earnings',
    ja: '通話収益',
  },
  rating_reward: {
    ko: '평가 작성 보상',
    en: 'Rating Reward',
    ja: '評価作成報酬',
  },
  five_star_bonus: {
    ko: '5점 평가 보너스',
    en: '5-Star Bonus',
    ja: '5つ星ボーナス',
  },
  gift_received: {
    ko: '선물 받기',
    en: 'Gift Received',
    ja: 'ギフト受取',
  },
  // 지출 사유
  call_charge: {
    ko: '통화 요금',
    en: 'Call Fee',
    ja: '通話料金',
  },
  early_exit_penalty: {
    ko: '조기 퇴장 패널티',
    en: 'Early Exit Penalty',
    ja: '早期退出ペナルティ',
  },
  gift_sent: {
    ko: '선물 보내기',
    en: 'Gift Sent',
    ja: 'ギフト送付',
  },
};

/**
 * 포인트 타입별 다국어 번역
 */
export const pointTypeTranslations: Record<string, Record<Locale, string>> = {
  earn: {
    ko: '적립',
    en: 'Earn',
    ja: '獲得',
  },
  charge: {
    ko: '사용',
    en: 'Spend',
    ja: '使用',
  },
};

/**
 * 포인트 타입을 사용자 언어로 번역
 */
export function translatePointType(type: string, locale: Locale): string {
  return pointTypeTranslations[type]?.[locale] || type;
}

/**
 * 포인트 사유를 사용자 언어로 번역
 */
export function translatePointReason(reason: string, locale: Locale): string {
  return pointReasonTranslations[reason]?.[locale] || reason;
}

/**
 * 포인트 금액을 형식화 (+100, -50)
 */
export function formatPointAmount(amount: number): string {
  return amount > 0 ? `+${amount}` : `${amount}`;
}

/**
 * 포인트 금액에 따른 색상 클래스 반환 (Tailwind)
 */
export function getPointAmountColorClass(amount: number): string {
  return amount > 0 ? 'text-green-600' : 'text-red-600';
}
