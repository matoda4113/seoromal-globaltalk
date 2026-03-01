import apiClient from '@/lib/apiClient';
import logger from '@/lib/logger';

interface SendGiftRequest {
  recipientUserId: number;
  amount: number;
}

interface SendGiftResponse {
  message: string;
  newBalance: number;
}

class GiftService {
  /**
   * 선물 보내기
   */
  async sendGift(data: SendGiftRequest): Promise<SendGiftResponse> {
    try {
      logger.log('🎁 선물 전송 요청:', data);
      const response = await apiClient.post<SendGiftResponse>('/api/gift', data);
      logger.log('🎁 선물 전송 성공:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('❌ 선물 전송 실패:', error);
      throw new Error(error.response?.data?.error || '선물 전송에 실패했습니다.');
    }
  }
}

export default new GiftService();
