-- 005_add_profile_image.sql
-- 프로필 이미지 URL 컬럼 추가

ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

COMMENT ON COLUMN users.profile_image_url IS '프로필 이미지 URL';
