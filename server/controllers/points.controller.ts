import { Request, Response } from 'express';
import { pointsService } from '../services/points.service';

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

    // 포인트 내역 조회
    const history = await pointsService.getHistory(userId);

    // 총 포인트 조회
    const totalPoints = await pointsService.getBalance(userId);

    return res.json({
      message: 'Points history retrieved successfully',
      data: {
        totalPoints,
        history,
      },
    });
  } catch (error) {
    console.error('Get points history error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
