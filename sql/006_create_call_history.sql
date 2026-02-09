-- 통화 기록 테이블
CREATE TABLE call_history (
  -- 기본 정보
  call_id SERIAL PRIMARY KEY,
  room_id TEXT NOT NULL,  -- 소켓 방 ID

  -- 참가자 정보 (로그인 유저만 가능)
  host_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guest_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 방 설정
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  language TEXT NOT NULL,  -- korean, english, japanese
  topic TEXT NOT NULL,  -- free, romance, hobby, business, travel

  -- 시간 정보
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INT DEFAULT 0,  -- 실제 통화 시간 (초)

  -- 정산 정보
  host_points_earned INT DEFAULT 0,  -- 호스트가 받은 포인트
  guest_points_charged INT DEFAULT 0,  -- 게스트가 지불한 포인트

  -- 패널티/상태
  host_early_exit BOOLEAN DEFAULT FALSE,  -- 호스트 조기 퇴장 여부 (10분 미만 + 게스트 있음)
  host_penalty_points INT DEFAULT 0,  -- 호스트 패널티 포인트 (차감)
  guest_too_short BOOLEAN DEFAULT FALSE,  -- 게스트 15초 이하 퇴장 (정산 안 함)

  -- 종료 사유
  end_reason TEXT,  -- 'host_left', 'guest_left', 'room_closed', 'timeout'

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_call_history_host ON call_history(host_user_id);
CREATE INDEX idx_call_history_guest ON call_history(guest_user_id);
CREATE INDEX idx_call_history_started_at ON call_history(started_at DESC);
CREATE INDEX idx_call_history_room ON call_history(room_id);

-- 코멘트
COMMENT ON TABLE call_history IS '통화 기록 테이블 (로그인 유저만)';
COMMENT ON COLUMN call_history.duration_seconds IS '실제 통화 시간 (초)';
COMMENT ON COLUMN call_history.host_points_earned IS '호스트 수익: 음성 1포인트/분, 화상 4포인트/분';
COMMENT ON COLUMN call_history.guest_points_charged IS '게스트 차감: 15초 이상이면 기본 10분 요금 (음성 10, 화상 40)';
COMMENT ON COLUMN call_history.host_early_exit IS '호스트 조기 퇴장: 10분 미만 + 게스트 있을 때 true';
COMMENT ON COLUMN call_history.guest_too_short IS '게스트 15초 이하 퇴장: true면 정산 안 함';
