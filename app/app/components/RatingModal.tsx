'use client';

import { useState } from 'react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  hostNickname: string;
}

/**
 * TODO: 호스트 평가 모달
 *
 * 사용 시나리오:
 * 1. 게스트가 10분 이상 통화 후 직접 나갈 때
 * 2. 호스트가 10분 이상 통화 후 방 폭파할 때 (게스트에게 표시)
 *
 * 평가 기능:
 * - 별점 (1-5)
 * - 코멘트 (선택사항)
 */
export default function RatingModal({ isOpen, onClose, onSubmit, hostNickname }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (rating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }
    onSubmit(rating, comment);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {hostNickname}님과의 대화 어떠셨나요?
        </h2>

        {/* 별점 */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3">별점을 선택해주세요</p>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="text-4xl transition-transform hover:scale-110"
              >
                {star <= rating ? '⭐' : '☆'}
              </button>
            ))}
          </div>
        </div>

        {/* 코멘트 (선택사항) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            코멘트 (선택사항)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="호스트에게 전할 메시지를 입력해주세요..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            건너뛰기
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            제출
          </button>
        </div>
      </div>
    </div>
  );
}
