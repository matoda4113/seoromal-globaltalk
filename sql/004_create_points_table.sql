-- Points (포인트) 테이블
CREATE TABLE IF NOT EXISTS points (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- 포인트 금액 (양수: 적립, 음수: 사용)
  type TEXT NOT NULL, -- 포인트 유형 (earn, spend, refund, admin_adjust 등)
  reason TEXT, -- 포인트 획득/사용 사유
  reference_type TEXT, -- 참조 타입 (call, rating, purchase, reward 등)
  reference_id INTEGER, -- 참조 ID (call_id, rating_id 등)
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_points_user_id ON points(user_id);
CREATE INDEX IF NOT EXISTS idx_points_created_at ON points(created_at);
CREATE INDEX IF NOT EXISTS idx_points_reference ON points(reference_type, reference_id);

-- 컬럼 코멘트
COMMENT ON TABLE points IS '포인트 거래 내역';
COMMENT ON COLUMN points.id IS '포인트 거래 ID';
COMMENT ON COLUMN points.user_id IS '사용자 ID';
COMMENT ON COLUMN points.amount IS '포인트 금액 (양수: 적립, 음수: 사용)';
COMMENT ON COLUMN points.type IS '포인트 유형 (earn: 적립, spend: 사용, refund: 환불, admin_adjust: 관리자 조정)';
COMMENT ON COLUMN points.reason IS '포인트 획득/사용 사유';
COMMENT ON COLUMN points.reference_type IS '참조 타입 (call: 통화, rating: 평가, purchase: 구매, reward: 보상, admin: 관리자)';
COMMENT ON COLUMN points.reference_id IS '참조 ID (해당 타입의 레코드 ID)';
COMMENT ON COLUMN points.created_at IS '거래 일시';
