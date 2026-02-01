import { Router } from 'express';

const router = Router();

// 헬스체크 엔드포인트
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
