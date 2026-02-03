import { Router } from 'express';
import * as pointsController from '../controllers/points.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * 포인트 내역 조회
 * GET /points/history
 * Header: Cookie (accessToken)
 */
router.get('/history', authenticate, pointsController.getPointsHistory);

export default router;
