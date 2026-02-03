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

export interface PointHistory {
  id: number;
  amount: number;
  type: string;
  reason: string | null;
  reference_type: string | null;
  reference_id: number | null;
  created_at: string;
}

export interface PointsHistoryResponse {
  message: string;
  data: {
    totalPoints: number;
    history: PointHistory[];
  };
}

class PointsService {
  /**
   * 포인트 내역 조회
   * GET /points/history
   */
  async getPointsHistory(): Promise<PointsHistoryResponse> {
    try {
      logger.info('Fetching points history...');
      const response = await apiClient.get<PointsHistoryResponse>('/points/history');
      logger.info('Points history fetched successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch points history:', error);
      throw error;
    }
  }
}

export default new PointsService();
