'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService from '@/services/auth.service';
import logger from '@/lib/logger';
import { getSocket } from '@/lib/socket';
import { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 페이지 로드 시 사용자 정보 가져오기
  useEffect(() => {
    refreshUser();
  }, []);

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const response = await authService.getCurrentUser();

      // 응답 구조 확인
      if (response?.data?.userInfo) {
        const userInfo = response.data.userInfo;
        setUser(userInfo);
        logger.info('User authenticated', userInfo);

        // Socket.io에 인증 정보 전달
        const socket = getSocket();
        socket.emit('authenticate', userInfo);
        logger.info('Socket authenticated with user:', userInfo);
      } else {
        logger.warn('Invalid response structure from getCurrentUser', response);
        setUser(null);
      }
    } catch (error: any) {
      // 401/404 에러는 로그아웃 상태로 처리 (정상)
      if (error?.response?.status === 401 || error?.response?.status === 404) {
        logger.info('User not authenticated');
      } else {
        logger.error('Failed to get current user:', error);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    logger.info('User logged in', userData);

    // Socket.io에 인증 정보 전달
    const socket = getSocket();
    socket.emit('authenticate', userData);
    logger.info('Socket authenticated with user:', userData);
  };

  const logout = async () => {
    try {
      // 서버에 로그아웃 요청 (쿠키 삭제)
      await authService.logout();
      setUser(null);
      logger.info('User logged out');
    } catch (error) {
      logger.error('Logout failed:', error);
      setUser(null);
    } finally {
      // 페이지 새로고침
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
