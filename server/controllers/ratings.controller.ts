import { Request, Response } from 'express';
import { pool } from '../lib/db';
import logger from '@/lib/logger';

/**
 * 평가 제출
 * POST /ratings
 */
export async function submitRating(req: Request, res: Response) {
  try {
    const { ratedUserId, raterUserId, ratingScore, ratingComment } = req.body;

    // 필수 파라미터 검증
    if (!ratedUserId || !raterUserId || !ratingScore) {
      return res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' });
    }

    // 평점 범위 검증
    if (ratingScore < 1 || ratingScore > 5) {
      return res.status(400).json({ error: '평점은 1~5 사이여야 합니다.' });
    }

    // call_id 조회 (가장 최근 통화 기록)
    const callResult = await pool.query(
      `SELECT call_id FROM call_history
       WHERE (host_user_id = $1 AND guest_user_id = $2)
          OR (host_user_id = $2 AND guest_user_id = $1)
       ORDER BY created_at DESC
       LIMIT 1`,
      [ratedUserId, raterUserId]
    );

    if (callResult.rows.length === 0) {
      return res.status(404).json({ error: '통화 기록을 찾을 수 없습니다.' });
    }

    const callId = callResult.rows[0].call_id;

    // 평가 중복 체크
    const existingRating = await pool.query(
      `SELECT rating_id FROM ratings
       WHERE call_id = $1 AND rater_user_id = $2`,
      [callId, raterUserId]
    );

    if (existingRating.rows.length > 0) {
      return res.status(409).json({ error: '이미 평가를 제출하였습니다.' });
    }

    // 평가 저장
    await pool.query(
      `INSERT INTO ratings (call_id, rater_user_id, rated_user_id, rating_score, rating_comment)
       VALUES ($1, $2, $3, $4, $5)`,
      [callId, raterUserId, ratedUserId, ratingScore, ratingComment]
    );

    logger.log(`⭐ 평가 저장 완료: call_id=${callId}, rater=${raterUserId}, rated=${ratedUserId}, score=${ratingScore}`);

    // 평가 받은 사람의 degree 업데이트
    if (ratingScore === 5) {
      await pool.query(
        `UPDATE users SET degree = degree + 0.1 WHERE id = $1`,
        [ratedUserId]
      );
      logger.log(`📈 ${ratedUserId}의 degree +0.1 (5점 평가)`);
    } else if (ratingScore === 4) {
      await pool.query(
        `UPDATE users SET degree = degree + 0.05 WHERE id = $1`,
        [ratedUserId]
      );
      logger.log(`📈 ${ratedUserId}의 degree +0.05 (4점 평가)`);
    } else if (ratingScore <= 2) {
      await pool.query(
        `UPDATE users SET degree = degree - 0.1 WHERE id = $1`,
        [ratedUserId]
      );
      logger.log(`📉 ${ratedUserId}의 degree -0.1 (${ratingScore}점 평가)`);
    }
    // 3점은 중립 평가로 degree 변화 없음

    // 평가한 사람에게 1포인트 지급
    await pool.query(
      `INSERT INTO points (user_id, amount, type, reason, reference_type, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [raterUserId, 1, 'earn', 'rating_reward', 'ratings', callId]
    );
    logger.log(`💰 평가자 ${raterUserId}에게 1포인트 지급`);

    // 5점 받으면 평가받는 사람에게 보너스 1포인트 지급
    if (ratingScore === 5) {
      await pool.query(
        `INSERT INTO points (user_id, amount, type, reason, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [ratedUserId, 1, 'earn', 'five_star_bonus', 'ratings', callId]
      );
      logger.log(`⭐ 5점 받음! ${ratedUserId}에게 보너스 1포인트 지급`);
    }

    return res.status(200).json({ message: '평가가 성공적으로 제출되었습니다.' });
  } catch (error) {
    logger.error('❌ 평가 제출 에러:', error);
    return res.status(500).json({ error: '평가 제출 중 오류가 발생했습니다.' });
  }
}

/**
 * 특정 사용자가 받은 평가 상세 조회 (최근 100개)
 * GET /ratings/:userId
 */
export async function getUserRatings(req: Request, res: Response) {
  try {
    const userIdParam = req.params.userId;
    const userId = parseInt(Array.isArray(userIdParam) ? userIdParam[0] : userIdParam);

    if (isNaN(userId)) {
      return res.status(400).json({ error: '유효하지 않은 사용자 ID입니다.' });
    }

    // 평가 상세 조회 (최근 100개, 평가자 정보 포함)
    const query = `
      SELECT
        r.rating_id,
        r.rating_score,
        r.rating_comment,
        r.created_at,
        u.id as rater_user_id,
        u.nickname as rater_nickname,
        u.profile_image_url as rater_profile_image
      FROM ratings r
      LEFT JOIN users u ON r.rater_user_id = u.id
      WHERE r.rated_user_id = $1
      ORDER BY r.created_at DESC
      LIMIT 100
    `;

    const result = await pool.query(query, [userId]);

    return res.status(200).json({
      data: {
        ratings: result.rows,
        total: result.rows.length
      }
    });
  } catch (error) {
    logger.error('❌ 평가 조회 에러:', error);
    return res.status(500).json({ error: '평가 조회 중 오류가 발생했습니다.' });
  }
}
