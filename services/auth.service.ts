import axios from 'axios';
import logger from '@/lib/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// axios 인스턴스 생성 (withCredentials: true로 Cookie 자동 전송)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // httpOnly Cookie 자동 전송
});

// Refresh token으로 재시도 중인지 추적
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response Interceptor: 403 에러(토큰 만료) 시 자동으로 토큰 갱신
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 403 에러(토큰 만료)이고, 재시도하지 않은 요청이며, refresh 엔드포인트가 아닌 경우
    if (
      error.response?.status === 403 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // 이미 refresh 중이면 대기열에 추가
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh Token으로 새 Access Token 발급
        await apiClient.post('/auth/refresh');
        logger.info('Access token refreshed successfully');

        processQueue(null);
        isRefreshing = false;

        // 원래 요청 재시도
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;
        logger.error('Token refresh failed:', refreshError);

        // Refresh token도 만료된 경우 - 로그아웃 처리
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  email: string;
  name?: string;
  nickname?: string;
  provider: string;
  points: number;
  age_group?: number | null;
  gender?: string | null;
  created_at: string;
  rating_avg?: number;
  rating_count?: number;
  degree?: number;
}

export interface SocialLoginResponse {
  message: string;
  data: {
    userInfo: {
      userId: number;
      email: string;
      name?: string;
      nickname?: string;
      provider: string;
      points: number;
      age_group?: number | null;
      gender?: string | null;
      country?: string | null;
    };
  };
  status?: number; // HTTP 상태 코드 (201: 신규가입, 200: 기존 로그인)
}

export interface EmailRegisterResponse {
  message: string;
  data: {
    userInfo: {
      userId: number;
      email: string;
      nickname: string;
      provider: string;
      points: number;
      age_group?: number | null;
      gender?: string | null;
    };
  };
  status?: number; // HTTP 상태 코드 (201: 신규가입)
}

export interface EmailLoginResponse {
  message: string;
  data: {
    userInfo: {
      userId: number;
      email: string;
      nickname?: string;
      provider: string;
      points: number;
      age_group?: number | null;
      gender?: string | null;
    };
  };
  status?: number; // HTTP 상태 코드 (201: 신규가입, 200: 기존 로그인)
}

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
      const response = await apiClient.post<SocialLoginResponse>('/auth/social-login', {
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
      const response = await apiClient.post<EmailLoginResponse>('/auth/email-login', {
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
      const response = await apiClient.post<EmailRegisterResponse>('/auth/email-register', {
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
      const response = await apiClient.get<SocialLoginResponse>('/auth/me');
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
      await apiClient.post('/auth/logout');
    } catch (error) {
      logger.error('Logout error:', error);
    }
  }

  /**
   * 닉네임 변경
   */
  async updateNickname(nickname: string): Promise<User> {
    const response = await apiClient.put<{ user: User }>('/auth/update-nickname', {
      nickname,
    });
    return response.data.user;
  }

  /**
   * 프로필 정보 변경 (age_group, gender)
   */
  async updateProfile(data: {
    age_group?: number | null;
    gender?: string | null;
  }): Promise<User> {
    const response = await apiClient.put<{ user: User }>('/auth/update-profile', data);
    return response.data.user;
  }

  /**
   * 회원 탈퇴
   * - 개인정보 익명화 처리
   * - 연관 데이터 보존 (call_history, points, ratings)
   */
  async deleteAccount(): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>('/auth/delete-account');
    return response.data;
  }

  /**
   * 로그인 상태 확인
   */
  async isLoggedIn(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}

export default new AuthService();
