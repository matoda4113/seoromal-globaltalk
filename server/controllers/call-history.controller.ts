import { Request, Response } from 'express';
import { pool } from '../lib/db';
import loggerBack from "../utils/loggerBack";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    nickname: string;
  };
}

/**
 * 내 통화 기록 조회
 * GET /call-history?role=all|host|guest&page=1&limit=20
 */
export const getCallHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 쿼리 파라미터
    const role = (req.query.role as string) || 'all'; // all, host, guest
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // role에 따른 WHERE 조건
    let roleCondition = 'WHERE (ch.host_user_id = $1 OR ch.guest_user_id = $1)';
    if (role === 'host') {
      roleCondition = 'WHERE ch.host_user_id = $1';
    } else if (role === 'guest') {
      roleCondition = 'WHERE ch.guest_user_id = $1';
    }

    // 총 개수 조회
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM call_history ch
       ${roleCondition}`,
      [userId]
    );
    const totalCount = parseInt(countResult.rows[0].total);

    // 총 통화 시간 조회
    const statsResult = await pool.query(
      `SELECT
        COALESCE(SUM(duration_seconds), 0) as total_duration_seconds
       FROM call_history ch
       ${roleCondition}`,
      [userId]
    );
    const totalDurationSeconds = parseInt(statsResult.rows[0].total_duration_seconds);

    // 통화 기록 조회 (페이징)
    const result = await pool.query(
      `SELECT
        ch.call_id,
        ch.room_id,
        ch.call_type,
        ch.language,
        ch.topic,
        ch.started_at,
        ch.ended_at,
        ch.duration_seconds,
        ch.host_points_earned,
        ch.guest_points_charged,
        ch.host_early_exit,
        ch.host_penalty_points,
        ch.guest_too_short,
        ch.end_reason,
        ch.created_at,
        -- 상대방 정보
        CASE
          WHEN ch.host_user_id = $1 THEN ch.guest_user_id
          ELSE ch.host_user_id
        END as partner_user_id,
        CASE
          WHEN ch.host_user_id = $1 THEN guest.nickname
          ELSE host.nickname
        END as partner_nickname,
        CASE
          WHEN ch.host_user_id = $1 THEN guest.profile_image_url
          ELSE host.profile_image_url
        END as partner_profile_image,
        -- 내 역할
        CASE
          WHEN ch.host_user_id = $1 THEN 'host'
          ELSE 'guest'
        END as my_role,
        -- 내가 받았거나 지불한 포인트 (호스트 조기퇴장 시 패널티 포함)
        CASE
          WHEN ch.host_user_id = $1 THEN
            CASE
              WHEN ch.host_early_exit THEN -ch.host_penalty_points
              ELSE ch.host_points_earned
            END
          ELSE -ch.guest_points_charged
        END as my_points_change
      FROM call_history ch
      LEFT JOIN users host ON ch.host_user_id = host.id
      LEFT JOIN users guest ON ch.guest_user_id = guest.id
      ${roleCondition}
      ORDER BY ch.started_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    loggerBack.log(`✅ Call history fetched for userId: ${userId}, role: ${role}, count: ${result.rows.length}, total: ${totalCount}`);

    return res.json({
      message: 'Call history retrieved successfully',
      data: {
        callHistory: result.rows,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        stats: {
          totalDurationSeconds,
        },
      },
    });
  } catch (error) {
    loggerBack.error('❌ Error fetching call history:', error);
    return res.status(500).json({ error: '통화 기록 조회 중 오류가 발생했습니다.' });
  }
};
