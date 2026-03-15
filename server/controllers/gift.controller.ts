import { Request, Response } from 'express';
import { pool } from '../lib/db';
import loggerBack from '../utils/loggerBack';
import { notifyPointsUpdate, notifyGiftReceived } from '../lib/socket-handlers';
import { pointsService } from '../services/points.service';

/**
 * 선물하기
 * POST /gift
 */
export async function sendGift(req: Request, res: Response) {
  try {
    const { recipientUserId, amount } = req.body;
    const senderUserId = (req as any).userId;

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

    try {
      // 포인트 서비스를 통한 선물 전송 (잔액 체크 및 트랜잭션 처리 포함)
      await pointsService.sendGift(senderUserId, recipientUserId, amount);

      // 발신자의 새 잔액 조회
      const newSenderBalance = await pointsService.getBalance(senderUserId);

      // 수신자의 새 잔액 조회
      const newRecipientBalance = await pointsService.getBalance(recipientUserId);

      // 소켓으로 알림
      notifyPointsUpdate(senderUserId, newSenderBalance); // 발신자는 잔액만 업데이트
      notifyGiftReceived(recipientUserId, senderNickname, amount, newRecipientBalance); // 수신자는 선물 알림

      return res.status(200).json({
        message: '선물이 전송되었습니다.',
        newBalance: newSenderBalance,
      });
    } catch (error: any) {
      // 잔액 부족 에러는 400 (Bad Request)
      if (error.message && error.message.includes('포인트가 부족합니다')) {
        loggerBack.warn(`⚠️ 잔액 부족 - userId: ${senderUserId}, amount: ${amount}`);
        return res.status(400).json({ error: error.message });
      }

      // 그 외 에러는 500 (Server Error)
      throw error;
    }
  } catch (error: any) {
    loggerBack.error('❌ 선물 전송 에러:', error);
    return res.status(500).json({ error: '선물 전송 중 오류가 발생했습니다.' });
  }
}
