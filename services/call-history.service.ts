import apiClient from '@/lib/apiClient';
import logger from '@/lib/logger';

export interface CallHistoryItem {
  call_id: number;
  room_id: string;
  call_type: 'audio' | 'video';
  language: 'ko' | 'en' | 'ja';
  topic: 'free' | 'romance' | 'hobby' | 'business' | 'travel';
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  host_points_earned: number;
  guest_points_charged: number;
  host_early_exit: boolean;
  host_penalty_points: number;
  guest_too_short: boolean;
  end_reason: string;
  partner_user_id: number;
  partner_nickname: string;
  partner_profile_image: string | null;
  my_role: 'host' | 'guest';
  my_points_change: number;
}

export interface CallHistoryResponse {
  message: string;
  data: {
    callHistory: CallHistoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    stats: {
      totalDurationSeconds: number;
    };
  };
}

export interface GetCallHistoryParams {
  role?: 'all' | 'host' | 'guest';
  page?: number;
  limit?: number;
}

class CallHistoryService {
  /**
   * 통화 기록 조회
   * GET /api/call-history?role=all|host|guest&page=1&limit=20
   */
  async getCallHistory(params?: GetCallHistoryParams): Promise<CallHistoryResponse> {
    try {
      logger.info('Fetching call history...', params);
      const response = await apiClient.get<CallHistoryResponse>('/api/call-history', {
        params: {
          role: params?.role || 'all',
          page: params?.page || 1,
          limit: params?.limit || 20,
        },
      });
      logger.info('Call history fetched successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch call history:', error);
      throw error;
    }
  }

  /**
   * 통화 기록 상세 조회
   * GET /api/call-history/:callId
   */
  async getCallHistoryDetail(callId: number): Promise<{ message: string; callHistory: CallHistoryItem }> {
    try {
      logger.info(`Fetching call history detail for callId: ${callId}...`);
      const response = await apiClient.get<{ message: string; callHistory: CallHistoryItem }>(
        `/api/call-history/${callId}`
      );
      logger.info('Call history detail fetched successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch call history detail:', error);
      throw error;
    }
  }
}

export default new CallHistoryService();
