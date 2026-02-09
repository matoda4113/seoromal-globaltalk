-- 호스트 평가 테이블
CREATE TABLE ratings (
  -- 기본 정보
  rating_id SERIAL PRIMARY KEY,
  call_id INT NOT NULL REFERENCES call_history(call_id) ON DELETE CASCADE,

  -- 평가자 및 피평가자
  rater_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 평가하는 사람 (게스트)
  rated_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 평가받는 사람 (호스트)

  -- 평가 내용
  rating_score INT NOT NULL CHECK (rating_score >= 1 AND rating_score <= 5),  -- 1~5점
  rating_comment TEXT,  -- 선택적 코멘트

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_ratings_call ON ratings(call_id);
CREATE INDEX idx_ratings_rated_user ON ratings(rated_user_id);
CREATE INDEX idx_ratings_rater ON ratings(rater_user_id);

-- 중복 평가 방지: 한 통화당 한 번만 평가 가능
CREATE UNIQUE INDEX idx_ratings_unique_call_rater ON ratings(call_id, rater_user_id);

-- 코멘트
COMMENT ON TABLE ratings IS '호스트 평가 테이블 (10분 이상 통화 후 게스트가 호스트 평가)';
COMMENT ON COLUMN ratings.rater_user_id IS '평가하는 사람 (보통 게스트)';
COMMENT ON COLUMN ratings.rated_user_id IS '평가받는 사람 (보통 호스트)';
COMMENT ON COLUMN ratings.rating_score IS '평가 점수 1~5점';
