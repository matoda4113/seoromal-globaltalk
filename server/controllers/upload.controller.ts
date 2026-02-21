import { Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { supabase } from '../lib/supabase.js';
import { pool } from '../lib/db.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// Multer 설정 - 메모리 스토리지 사용
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한 (원본 이미지도 받으므로 증가)
  },
  fileFilter: (req, file, cb) => {
    // 모든 이미지 포맷 허용 (webp, jpeg, jpg, png, heic, heif 등)
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// 단일 파일 업로드 미들웨어
export const uploadSingle = upload.single('image');

/**
 * 프로필 이미지 업로드
 * - multipart/form-data로 이미지 수신 (모든 이미지 포맷 허용)
 * - webp가 아닌 경우 webp로 변환 (최대 1024px)
 * - Supabase Storage에 업로드 (버켓: images, 폴더: user-image)
 * - users 테이블의 profile_image 컬럼에 URL 저장
 */
export async function uploadProfileImage(req: Request, res: Response) {
  const client = await pool.connect();

  try {
    const userId = (req as any).userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: 'No file uploaded',
      });
    }

    logger.info(`Processing profile image for user ${userId}, mimetype: ${file.mimetype}`);

    // 이미지 처리: webp가 아니면 변환
    let processedBuffer: Buffer;

    if (file.mimetype === 'image/webp') {
      // 이미 webp인 경우: 크기만 조정
      logger.info('Image is already webp, resizing only');
      processedBuffer = await sharp(file.buffer)
        .resize(1024, 1024, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
    } else {
      // webp가 아닌 경우: webp로 변환 + 리사이즈
      logger.info(`Converting ${file.mimetype} to webp`);
      processedBuffer = await sharp(file.buffer)
        .resize(1024, 1024, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
    }

    // 고유한 파일명 생성
    const fileExt = 'webp';
    const fileName = `${userId}-${uuidv4()}.${fileExt}`;
    const filePath = `user-image/${fileName}`;

    logger.info(`Uploading profile image for user ${userId}: ${fileName}`);

    // Supabase Storage에 업로드 (처리된 이미지 사용)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, processedBuffer, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (uploadError) {
      logger.error('Supabase upload error:', uploadError);
      return res.status(500).json({
        message: 'Failed to upload image to storage',
        error: uploadError.message,
      });
    }

    logger.info(`Image uploaded successfully: ${uploadData.path}`);

    // Public URL 생성
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    logger.info(`Public URL generated: ${publicUrl}`);

    // 데이터베이스에 URL 저장
    const result = await client.query(
      `
      UPDATE users
      SET profile_image_url = $1
      WHERE id = $2
      RETURNING *
    `,
      [publicUrl, userId]
    );

    const user = result.rows[0];

    logger.info(`Profile image URL saved to database for user ${userId}`);

    return res.json({
      message: 'Profile image uploaded successfully',
      data: {
        imageUrl: publicUrl,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          nickname: user.nickname,
          bio: user.bio,
          profileImageUrl: user.profile_image_url,
          provider: user.provider,
          ageGroup: user.age_group,
          gender: user.gender,
          degree: user.degree,
          points: user.points,
          created_at: user.created_at,
        },
      },
    });
  } catch (error) {
    logger.error('Upload profile image error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  } finally {
    client.release();
  }
}
