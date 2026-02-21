import { Request, Response } from 'express';
import { pool } from '../lib/db';
import logger from '@/lib/logger';
import { notifyPointsUpdate, notifyGiftReceived } from '../lib/socket-handlers';

/**
 * 선물하기
 * POST /gift
 */
export async function sendGift(req: Request, res: Response) {
  try {
    const { recipientUserId, amount } = req.body;
    const senderUserId = (req as any).userId;
    console.log(recipientUserId);
    console.log(amount);
    console.log(senderUserId);
    // 필수 파라미터 검증
    if (!recipientUserId || !amount || !senderUserId) {
      return res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' });
    }

    // 선물 금액 검증 (50, 100, 200, 300만 가능)
    if (![50, 100, 200, 300].includes(amount)) {
      return res.status(400).json({ error: '유효하지 않은 선물 금액입니다.' });
    }

    // 자기 자신에게 선물 불가
    if (senderUserId === recipientUserId) {
      return res.status(400).json({ error: '자기 자신에게 선물할 수 없습니다.' });
    }

    // 발신자 잔액 조회
    const senderBalanceResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0)::int AS balance FROM points WHERE user_id = $1`,
      [senderUserId]
    );
    const senderBalance = senderBalanceResult.rows[0].balance;

    // 잔액 확인
    if (senderBalance < amount) {
      return res.status(400).json({ error: `포인트가 부족합니다. (현재 ${senderBalance}점)` });
    }

    // 수신자 존재 확인
    const recipientResult = await pool.query(
      `SELECT id FROM users WHERE id = $1`,
      [recipientUserId]
    );
    if (recipientResult.rows.length === 0) {
      return res.status(404).json({ error: '수신자를 찾을 수 없습니다.' });
    }

    // 발신자 닉네임 조회 (알림용)
    const senderResult = await pool.query(
      `SELECT nickname FROM users WHERE id = $1`,
      [senderUserId]
    );
    const senderNickname = senderResult.rows[0]?.nickname || 'Unknown';

    // 트랜잭션 시작
    await pool.query('BEGIN');

    try {
      // 발신자 포인트 차감
      await pool.query(
        `INSERT INTO points (user_id, amount, type, reason, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [senderUserId, -amount, 'charge', 'gift_sent', 'users', recipientUserId]
      );

      // 수신자 포인트 지급
      await pool.query(
        `INSERT INTO points (user_id, amount, type, reason, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [recipientUserId, amount, 'earn', 'gift_received', 'users', senderUserId]
      );

      await pool.query('COMMIT');

      logger.log(`🎁 선물 전송: ${senderUserId} → ${recipientUserId}, ${amount}점`);

      // 발신자의 새 잔액 조회
      const newSenderBalanceResult = await pool.query(
        `SELECT COALESCE(SUM(amount), 0)::int AS balance FROM points WHERE user_id = $1`,
        [senderUserId]
      );
      const newSenderBalance = newSenderBalanceResult.rows[0].balance;

      // 수신자의 새 잔액 조회
      const newRecipientBalanceResult = await pool.query(
        `SELECT COALESCE(SUM(amount), 0)::int AS balance FROM points WHERE user_id = $1`,
        [recipientUserId]
      );
      const newRecipientBalance = newRecipientBalanceResult.rows[0].balance;

      // 소켓으로 알림
      notifyPointsUpdate(senderUserId, newSenderBalance); // 발신자는 잔액만 업데이트
      notifyGiftReceived(recipientUserId, senderNickname, amount, newRecipientBalance); // 수신자는 선물 알림

      return res.status(200).json({
        message: '선물이 전송되었습니다.',
        newBalance: newSenderBalance,
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('❌ 선물 전송 에러:', error);
    return res.status(500).json({ error: '선물 전송 중 오류가 발생했습니다.' });
  }
}
