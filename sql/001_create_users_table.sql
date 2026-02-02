-- Users 테이블 생성
-- 서로말(SeRoMal) 사용자 정보 관리

CREATE TABLE IF NOT EXISTS users (
  -- 기본 정보
  id INT4 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL,
  password TEXT, -- 소셜 로그인은 NULL

  -- 사용자 프로필
  name TEXT, -- 실명 (소셜 로그인에서 가져옴)
  nickname TEXT NOT NULL, -- 닉네임 (필수)
  phone TEXT, -- 휴대폰 번호
  bio TEXT, -- 자기소개
  profile_image_url TEXT, -- 프로필 이미지 경로

  -- 로그인 제공자
  provider TEXT NOT NULL CHECK (provider IN ('google', 'kakao', 'line', 'apple', 'email')),
  social_id TEXT, -- 소셜 로그인 고유 ID

  -- 선택 정보
  age_group INTEGER CHECK (age_group IN (10, 20, 30, 40, 50, 60)), -- 연령대
  gender TEXT CHECK (gender IN ('man', 'woman')), -- 성별
  country TEXT, -- 국가 코드 (KR, JP 등)

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMPTZ,

  -- 유니크 제약조건 (이메일 중복 방지)
  CONSTRAINT unique_email UNIQUE (email)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider);
CREATE INDEX idx_users_social_id ON users(social_id);
CREATE INDEX idx_users_created_at ON users(created_at);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 생성
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 코멘트 추가
COMMENT ON TABLE users IS '서로말 사용자 정보 테이블';
COMMENT ON COLUMN users.id IS '사용자 고유 ID';
COMMENT ON COLUMN users.email IS '이메일 주소';
COMMENT ON COLUMN users.password IS '비밀번호 (해시) - 이메일 로그인만 사용';
COMMENT ON COLUMN users.name IS '실명 (소셜 로그인에서 제공)';
COMMENT ON COLUMN users.nickname IS '닉네임';
COMMENT ON COLUMN users.phone IS '휴대폰 번호';
COMMENT ON COLUMN users.bio IS '자기소개';
COMMENT ON COLUMN users.profile_image_url IS '프로필 이미지 경로';
COMMENT ON COLUMN users.provider IS '로그인 제공자 (google/kakao/line/apple/email)';
COMMENT ON COLUMN users.social_id IS '소셜 로그인 고유 ID';
COMMENT ON COLUMN users.age_group IS '연령대 (10/20/30/40/50/60)';
COMMENT ON COLUMN users.gender IS '성별 (man/woman)';
COMMENT ON COLUMN users.country IS '국가 코드 (KR, JP 등)';
COMMENT ON COLUMN users.created_at IS '계정 생성일';
COMMENT ON COLUMN users.updated_at IS '최종 수정일';
COMMENT ON COLUMN users.last_login_at IS '마지막 로그인 시간';
