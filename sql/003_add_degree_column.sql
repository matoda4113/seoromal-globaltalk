-- Add degree column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS degree NUMERIC DEFAULT 36.5;

COMMENT ON COLUMN users.degree IS '사용자 온도 (기본값 36.5)';
