import { Request, Response } from 'express';
import { pool } from '../lib/db';
import { getUserPoints } from '../lib/points';

/**
 * 사용자의 포인트 내역 조회
 * GET /api/points/history
 */
export const getPointsHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 포인트 내역 조회 (최신순)
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
      LIMIT 100
    `;

    const result = await pool.query(query, [userId]);

    // 총 포인트 조회
    const totalPoints = await getUserPoints(pool, userId);

    return res.json({
      message: 'Points history retrieved successfully',
      data: {
        totalPoints,
        history: result.rows,
      },
    });
  } catch (error) {
    console.error('Get points history error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
