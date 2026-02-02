import { Pool } from 'pg';
import logger from '@/lib/logger';
import dotenv from 'dotenv';
dotenv.config();
// Connection Pool 생성
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL_POOLER,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // 10초로 늘림
  allowExitOnIdle: false,
});

// Pool 에러 핸들링
pool.on('error', (err) => {
  logger.error('Unexpected database pool error:', err);
});

// Pool 상태 모니터링 (개발 환경)
if (process.env.NODE_ENV !== 'production') {
  pool.on('connect', () => {
    logger.info('Database pool connected');
  });
}
