import { Router } from 'express';
import * as ratingsController from '../controllers/ratings.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * 평가 제출
 * POST /ratings
 * Header: Cookie (accessToken)
 */
router.post('/', authenticate, ratingsController.submitRating);

/**
 * 특정 사용자가 받은 평가 상세 조회
 * GET /ratings/:userId
 * Header: Cookie (accessToken)
 */
router.get('/:userId', ratingsController.getUserRatings);

export default router;
