import { Router } from 'express';
import * as giftController from '../controllers/gift.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// 선물하기
router.post('/', authenticate, giftController.sendGift);

export default router;
