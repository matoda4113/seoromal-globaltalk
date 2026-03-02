'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import authService from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/logger';

export default function AppleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleAppleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        logger.error('Apple login error:', error);
        alert('Apple 로그인에 실패했습니다.');
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
        logger.info('Processing Apple login with code:', code);
        const response = await authService.socialLogin('apple', code);
        // AuthContext에 사용자 정보 저장
        login(response.data.userInfo);

        logger.info('Apple login successful');

        router.push('/app');
      } catch (error: any) {
        logger.error('Apple login failed:', error);
        alert(error.response?.data?.error || 'Apple 로그인에 실패했습니다.');
        router.push('/login');
      }
    };

    handleAppleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-semibold">Apple 로그인 처리 중...</p>
      </div>
    </div>
  );
}
