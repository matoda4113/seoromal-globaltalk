'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import authService from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/logger';

export default function KakaoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleKakaoCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        logger.error('Kakao login error:', error);
        alert('카카오 로그인에 실패했습니다.');
        router.push('/login');
        return;
      }

      if (!code) {
        logger.error('No authorization code received');
        alert('인증 코드를 받지 못했습니다.');
        router.push('/login');
        return;
      }

      try {
        logger.info('Processing Kakao login with code:', code);
        const response = await authService.socialLogin('kakao', code);
        // AuthContext에 사용자 정보 저장
        login(response.data.userInfo);


        logger.info('Kakao login successful');

        router.push('/app');
      } catch (error: any) {
        logger.error('Kakao login failed:', error);
        alert(error.response?.data?.error || '카카오 로그인에 실패했습니다.');
        router.push('/login');
      }
    };

    handleKakaoCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-semibold">카카오 로그인 처리 중...</p>
      </div>
    </div>
  );
}
