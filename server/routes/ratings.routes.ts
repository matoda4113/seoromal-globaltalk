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

export default router;
