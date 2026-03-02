/**
 * 포인트 시스템 공통 타입 정의
 * 서버와 클라이언트에서 공유됩니다.
 */

/**
 * 포인트 트랜잭션 타입
 */
export enum PointTransactionType {
  EARN = 'earn',
  CHARGE = 'charge'
}

/**
 * 포인트 트랜잭션 사유
 */
export enum PointReason {
  // 수입 사유
  SIGNUP_BONUS = 'signup_bonus',
  CALL_EARNING = 'call_earning',
  RATING_REWARD = 'rating_reward',
  FIVE_STAR_BONUS = 'five_star_bonus',
  GIFT_RECEIVED = 'gift_received',

  // 지출 사유
  CALL_CHARGE = 'call_charge',
  EARLY_EXIT_PENALTY = 'early_exit_penalty',
  GIFT_SENT = 'gift_sent'
}

/**
 * 참조 타입
 */
export enum ReferenceType {
  SIGNUP = 'signup',
  CALL_HISTORY = 'call_history',
  RATINGS = 'ratings',
  USERS = 'users'
}

/**
 * TypeScript용 문자열 타입 (클라이언트에서 사용)
 */
export type PointTransactionTypeString = `${PointTransactionType}`;
export type PointReasonString = `${PointReason}`;
export type ReferenceTypeString = `${ReferenceType}`;
