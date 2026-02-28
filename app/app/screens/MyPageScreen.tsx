'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoggedOutMyPage from './mypage/LoggedOutMyPage';
import LoggedInMyPage from './mypage/LoggedInMyPage';

export default function MyPageScreen() {
  const { isLoading, isAuthenticated, refreshUser } = useAuth();

  // 탭 진입 시 사용자 정보 새로고침
  useEffect(() => {
    if (isAuthenticated) {
      refreshUser();
    }
  }, []);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 140px)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return <LoggedOutMyPage />;
  }

  // 로그인한 경우
  return <LoggedInMyPage />;
}
