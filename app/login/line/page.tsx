'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import authService from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/logger';

export default function LineCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleLineCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        logger.error('LINE login error:', error, errorDescription);
        alert('LINE 로그인에 실패했습니다.');
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
        logger.info('Processing LINE login with code:', code);
        const response = await authService.socialLogin('line', code);
        // AuthContext에 사용자 정보 저장
        login(response.data.userInfo);

        logger.info('LINE login successful');

        router.push('/app');
      } catch (error: any) {
        logger.error('LINE login failed:', error);
        alert(error.response?.data?.error || 'LINE 로그인에 실패했습니다.');
        router.push('/login');
      }
    };

    handleLineCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-semibold">LINE 로그인 처리 중...</p>
      </div>
    </div>
  );
}
