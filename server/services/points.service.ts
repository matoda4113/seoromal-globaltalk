import { Pool } from 'pg';
import { pool } from '../lib/db';
import loggerBack from '../utils/loggerBack';
import { PointTransactionType, PointReason, ReferenceType } from '../../types/points-shared';

// Re-export for backward compatibility
export { PointTransactionType, PointReason, ReferenceType };

/**
 * 포인트 트랜잭션 파라미터
 */
interface PointTransactionParams {
  userId: number;
  amount: number;
  type: PointTransactionType;
  reason: PointReason | string;
  referenceType?: ReferenceType | string;
  referenceId?: number;
}

/**
 * 포인트 서비스 클래스
 */
class PointsService {
  private pool: Pool;

  constructor(dbPool: Pool) {
    this.pool = dbPool;
  }

  /**
   * 사용자의 현재 포인트 잔액 조회
   */
  async getBalance(userId: number): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(amount), 0)::int as balance
      FROM points
      WHERE user_id = $1
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0].balance;
  }

  /**
   * 포인트 트랜잭션 생성 (내부 메서드)
   */
  private async createTransaction(params: PointTransactionParams): Promise<void> {
    const { userId, amount, type, reason, referenceType, referenceId } = params;

    const query = `
      INSERT INTO points (user_id, amount, type, reason, reference_type, reference_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await this.pool.query(query, [
      userId,
      amount,
      type,
      reason,
      referenceType || null,
      referenceId || null
    ]);

    loggerBack.log(`💰 포인트 ${amount > 0 ? '적립' : '차감'}: userId=${userId}, amount=${amount}, reason=${reason}`);
  }

  /**
   * 회원가입 보너스 지급
   */
  async grantSignupBonus(userId: number): Promise<void> {
    await this.createTransaction({
      userId,
      amount: 50,
      type: PointTransactionType.EARN,
      reason: PointReason.SIGNUP_BONUS,
      referenceType: ReferenceType.SIGNUP
    });
  }

  /**
   * 호스트 통화 수익 지급
   */
  async grantCallEarning(userId: number, amount: number, callId: number): Promise<void> {
    await this.createTransaction({
      userId,
      amount,
      type: PointTransactionType.EARN,
      reason: PointReason.CALL_EARNING,
      referenceType: ReferenceType.CALL_HISTORY,
      referenceId: callId
    });
  }

  /**
   * 평가 작성 보상 지급
   */
  async grantRatingReward(userId: number, callId: number): Promise<void> {
    await this.createTransaction({
      userId,
      amount: 1,
      type: PointTransactionType.EARN,
      reason: PointReason.RATING_REWARD,
      referenceType: ReferenceType.RATINGS,
      referenceId: callId
    });
  }

  /**
   * 5점 평가 보너스 지급
   */
  async grantFiveStarBonus(userId: number, callId: number): Promise<void> {
    await this.createTransaction({
      userId,
      amount: 1,
      type: PointTransactionType.EARN,
      reason: PointReason.FIVE_STAR_BONUS,
      referenceType: ReferenceType.RATINGS,
      referenceId: callId
    });
  }

  /**
   * 선물 받기
   */
  async receiveGift(userId: number, amount: number, senderUserId: number): Promise<void> {
    await this.createTransaction({
      userId,
      amount,
      type: PointTransactionType.EARN,
      reason: PointReason.GIFT_RECEIVED,
      referenceType: ReferenceType.USERS,
      referenceId: senderUserId
    });
  }

  /**
   * 게스트 통화 요금 차감
   */
  async chargeCallFee(userId: number, amount: number, callId: number): Promise<void> {
    await this.createTransaction({
      userId,
      amount: -amount,
      type: PointTransactionType.CHARGE,
      reason: PointReason.CALL_CHARGE,
      referenceType: ReferenceType.CALL_HISTORY,
      referenceId: callId
    });
  }

  /**
   * 호스트 조기 퇴장 패널티 부과
   */
  async applyEarlyExitPenalty(userId: number, callId: number): Promise<void> {
    await this.createTransaction({
      userId,
      amount: -5,
      type: PointTransactionType.CHARGE,
      reason: PointReason.EARLY_EXIT_PENALTY,
      referenceType: ReferenceType.CALL_HISTORY,
      referenceId: callId
    });
  }

  /**
   * 선물 보내기 (잔액 체크 포함)
   */
  async sendGift(senderUserId: number, recipientUserId: number, amount: number): Promise<void> {
    // 잔액 확인
    const balance = await this.getBalance(senderUserId);
    if (balance < amount) {
      throw new Error(`포인트가 부족합니다. (현재 ${balance}점)`);
    }

    // 트랜잭션 시작
    await this.pool.query('BEGIN');

    try {
      // 발신자 차감
      await this.createTransaction({
        userId: senderUserId,
        amount: -amount,
        type: PointTransactionType.CHARGE,
        reason: PointReason.GIFT_SENT,
        referenceType: ReferenceType.USERS,
        referenceId: recipientUserId
      });

      // 수신자 지급
      await this.createTransaction({
        userId: recipientUserId,
        amount,
        type: PointTransactionType.EARN,
        reason: PointReason.GIFT_RECEIVED,
        referenceType: ReferenceType.USERS,
        referenceId: senderUserId
      });

      await this.pool.query('COMMIT');
      loggerBack.log(`🎁 선물 전송 완료: ${senderUserId} → ${recipientUserId}, ${amount}점`);
    } catch (error) {
      await this.pool.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * 포인트 잔액 체크 (입장 시 사용)
   */
  async checkMinimumBalance(userId: number, requiredAmount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= requiredAmount;
  }

  /**
   * 포인트 내역 조회 (최근 100개)
   */
  async getHistory(userId: number, limit: number = 100): Promise<any[]> {
    const query = `
      SELECT
        id,
        amount,
        type,
        reason,
        reference_type,
        reference_id,
        created_at
      FROM points
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [userId, limit]);
    return result.rows;
  }
}

// 싱글톤 인스턴스 생성
export const pointsService = new PointsService(pool);
