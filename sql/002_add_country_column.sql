-- country 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;

-- 코멘트 추가
COMMENT ON COLUMN users.country IS '국가 코드 (KR, JP 등)';
