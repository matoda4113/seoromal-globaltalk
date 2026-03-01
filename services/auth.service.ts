import apiClient from '@/lib/apiClient';
import logger from '@/lib/logger';
import { User } from '@/types/user';

// API 응답 타입 정의
export interface AuthResponse {
  message: string;
  data: {
    userInfo: User;
  };
  status?: number; // HTTP 상태 코드 (201: 신규가입, 200: 기존 로그인)
}

// 모든 로그인/회원가입 응답에 동일하게 사용
export type SocialLoginResponse = AuthResponse;
export type EmailRegisterResponse = AuthResponse;
export type EmailLoginResponse = AuthResponse;

class AuthService {
  /**
   * 소셜 로그인 (Google, Kakao, LINE, Apple)
   * @param provider - OAuth provider ('google' | 'kakao' | 'line' | 'apple')
   * @param token - OAuth access token, ID token, 또는 authorization code
   * @returns 로그인 결과 (userInfo만 포함, 토큰은 httpOnly Cookie로 자동 저장됨)
   */
  async socialLogin(
    provider: 'google' | 'kakao' | 'line' | 'apple',
    token: string
  ): Promise<SocialLoginResponse> {
    try {
      logger.info(`Logging in with ${provider}...`);
      const response = await apiClient.post<SocialLoginResponse>('/api/auth/social-login', {
        provider,
        token,
      });

      logger.info(`${provider} login successful:`, response.data.data.userInfo.email);

      // HTTP 상태 코드를 응답에 포함
      return {
        ...response.data,
        status: response.status,
      };
    } catch (error) {
      logger.error(`${provider} login failed:`, error);
      throw error;
    }
  }

  /**
   * 이메일 로그인
   * @param email - 이메일
   * @param password - 비밀번호
   * @returns 로그인 결과 (userInfo만 포함, 토큰은 httpOnly Cookie로 자동 저장됨)
   */
  async emailLogin(email: string, password: string): Promise<EmailLoginResponse> {
    try {
      logger.info('Logging in with email:', email);
      const response = await apiClient.post<EmailLoginResponse>('/api/auth/email-login', {
        email,
        password,
      });

      logger.info('Email login successful:', response.data.data.userInfo.email);

      // HTTP 상태 코드를 응답에 포함
      return {
        ...response.data,
        status: response.status,
      };
    } catch (error) {
      logger.error('Email login failed:', error);
      throw error;
    }
  }

  /**
   * 이메일 회원가입
   * @param email - 이메일
   * @param password - 비밀번호
   * @param nickname - 닉네임
   * @returns 회원가입 결과
   */
  async emailRegister(
    email: string,
    password: string,
    nickname: string
  ): Promise<EmailRegisterResponse> {
    try {
      logger.info('Registering with email:', email);
      const response = await apiClient.post<EmailRegisterResponse>('/api/auth/email-register', {
        email,
        password,
        nickname,
      });

      logger.info('Email registration successful:', response.data.data.userInfo.email);

      // HTTP 상태 코드를 응답에 포함 (회원가입은 항상 201)
      return {
        ...response.data,
        status: response.status,
      };
    } catch (error) {
      logger.error('Email registration failed:', error);
      throw error;
    }
  }

  /**
   * 현재 로그인한 사용자 정보 가져오기 (Cookie의 accessToken 사용)
   */
  async getCurrentUser(): Promise<SocialLoginResponse> {
    try {
      const response = await apiClient.get<SocialLoginResponse>('/api/auth/me');
      return response.data;
    } catch (error: any) {
      // 401은 로그인 안 한 상태 (정상)
      if (error.response?.status === 401) {
        throw error;
      }
      logger.error('Failed to fetch current user:', error);
      throw error;
    }
  }

  /**
   * 로그아웃
   * - 서버에서 Cookie 삭제
   */
  async logout(): Promise<void> {
    try {
      logger.info('Logging out...');
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      logger.error('Logout error:', error);
    }
  }

  /**
   * 닉네임 변경
   */
  async updateNickname(nickname?: string, bio?: string): Promise<AuthResponse> {
    const response = await apiClient.put<AuthResponse>('/api/auth/update-nickname', {
      nickname,
      bio,
    });
    return response.data;
  }

  /**
   * 프로필 정보 변경 (age_group, gender)
   */
  async updateProfile(data: {
    age_group?: number | null;
    gender?: string | null;
  }): Promise<AuthResponse> {
    const response = await apiClient.put<AuthResponse>('/api/auth/update-profile', data);
    return response.data;
  }

  /**
   * 회원 탈퇴
   * - 개인정보 익명화 처리
   * - 연관 데이터 보존 (call_history, points, ratings)
   */
  async deleteAccount(): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>('/api/auth/delete-account');
    return response.data;
  }

  /**
   * 로그인 상태 확인
   */
  async isLoggedIn(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  /**
   * 프로필 이미지 업로드
   * @param file - webp 형식의 이미지 파일
   * @returns 업로드된 이미지 URL과 업데이트된 사용자 정보
   */
  async uploadProfileImage(file: File): Promise<{ imageUrl: string; userInfo: User }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post<{
      message: string;
      data: { imageUrl: string; userInfo: User };
    }>('/api/upload/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }
}

export default new AuthService();
