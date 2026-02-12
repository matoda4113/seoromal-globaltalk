import axios from 'axios';
import logger from '@/lib/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// axios 인스턴스 생성 (withCredentials: true로 Cookie 자동 전송)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export interface SubmitRatingRequest {
  ratedUserId: number;
  raterUserId: number;
  ratingScore: number;
  ratingComment?: string;
}

export interface SubmitRatingResponse {
  message: string;
}

class RatingsService {
  /**
   * 평가 제출
   * POST /api/ratings
   */
  async submitRating(data: SubmitRatingRequest): Promise<SubmitRatingResponse> {
    try {
      logger.info('Submitting rating...', data);
      const response = await apiClient.post<SubmitRatingResponse>('/ratings', data);
      logger.info('Rating submitted successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to submit rating:', error);
      throw error;
    }
  }
}

export default new RatingsService();
