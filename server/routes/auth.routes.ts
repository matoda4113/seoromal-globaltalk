import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * 소셜 로그인 (Google, Kakao, LINE, Apple)
 * POST /auth/social-login
 * Body: { provider: 'google' | 'kakao' | 'line' | 'apple', token: string }
 */
router.post('/social-login', authController.socialLogin);

/**
 * 이메일 회원가입
 * POST /auth/email-register
 * Body: { email: string, password: string, nickname: string }
 */
router.post('/email-register', authController.emailRegister);

/**
 * 이메일 로그인
 * POST /auth/email-login
 * Body: { email: string, password: string }
 */
router.post('/email-login', authController.emailLogin);

/**
 * 현재 사용자 정보 조회
 * GET /auth/me
 * Header: Cookie (accessToken)
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * Refresh Token으로 Access Token 재발급
 * POST /auth/refresh
 * Header: Cookie (refreshToken)
 */
router.post('/refresh', authController.refreshAccessToken);

/**
 * 로그아웃
 * POST /auth/logout
 * Header: Cookie (accessToken)
 */
router.post('/logout', authController.logout);

/**
 * 닉네임 변경
 * PUT /auth/update-nickname
 * Body: { nickname: string }
 * Header: Cookie (accessToken)
 */
router.put('/update-nickname', authenticate, authController.updateNickname);

/**
 * 프로필 정보 변경
 * PUT /auth/update-profile
 * Body: { age_group?: number | null, gender?: string | null }
 * Header: Cookie (accessToken)
 */
router.put('/update-profile', authenticate, authController.updateProfile);

/**
 * 회원 탈퇴
 * DELETE /auth/delete-account
 * Header: Cookie (accessToken)
 */
router.delete('/delete-account', authenticate, authController.deleteAccount);

export default router;
