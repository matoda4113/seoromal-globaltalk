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

export interface RatingDetail {
  rating_id: number;
  rating_score: number;
  rating_comment: string | null;
  created_at: string;
  rater_user_id: number;
  rater_nickname: string;
  rater_profile_image: string | null;
}

export interface GetUserRatingsResponse {
  data: {
    ratings: RatingDetail[];
    total: number;
  };
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

  /**
   * 특정 사용자가 받은 평가 상세 조회
   * GET /api/ratings/:userId
   */
  async getUserRatings(userId: number): Promise<GetUserRatingsResponse> {
    try {
      logger.info('Fetching user ratings...', userId);
      const response = await apiClient.get<GetUserRatingsResponse>(`/ratings/${userId}`);
      logger.info('User ratings fetched successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch user ratings:', error);
      throw error;
    }
  }
}

export default new RatingsService();
