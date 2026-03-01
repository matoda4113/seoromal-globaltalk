import { Router } from 'express';
import * as callHistoryController from '../controllers/call-history.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * 내 통화 기록 조회
 * GET /call-history
 * Header: Cookie (accessToken)
 */
router.get('/', authenticate, callHistoryController.getCallHistory);


export default router;
