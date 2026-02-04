import express from 'express';
import { uploadProfileImage, uploadSingle } from '../controllers/upload.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * POST /upload/profile-image
 * 프로필 이미지 업로드
 * - 인증 필요
 * - multipart/form-data 형식
 * - field name: 'image'
 */
router.post('/profile-image', authenticate, uploadSingle, uploadProfileImage);

export default router;
