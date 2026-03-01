import apiClient from '@/lib/apiClient';
import logger from '@/lib/logger';

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
      const response = await apiClient.get<PointsHistoryResponse>('/api/points/history');
      logger.info('Points history fetched successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch points history:', error);
      throw error;
    }
  }
}

export default new PointsService();
