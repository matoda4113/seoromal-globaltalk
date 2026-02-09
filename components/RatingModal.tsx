'use client';

import { useState } from 'react';
import logger from '@/lib/logger';

interface RatingModalProps {
  hostUserId: number;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

export default function RatingModal({ hostUserId, onClose, onSubmit }: RatingModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  const handleSubmit = () => {
    if (rating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }

    logger.log(`⭐ 호스트 평가: ${rating}점, 코멘트: ${comment}`);
    onSubmit(rating, comment);
    onClose();
  };

  const handleSkip = () => {
    logger.log('⭐ 평가 건너뛰기');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
        {/* 헤더 */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">호스트 평가</h2>
          <p className="text-gray-400 text-sm">통화가 어떠셨나요? 호스트를 평가해주세요.</p>
        </div>

        {/* 별점 선택 */}
        <div className="mb-6">
          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="transition-transform hover:scale-110"
              >
                <svg
                  className={`w-12 h-12 ${
                    star <= (hoveredStar || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-600 fill-gray-600'
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400">
            {rating === 0 && '별점을 선택해주세요'}
            {rating === 1 && '😞 매우 불만족'}
            {rating === 2 && '😕 불만족'}
            {rating === 3 && '😐 보통'}
            {rating === 4 && '😊 만족'}
            {rating === 5 && '😍 매우 만족'}
          </p>
        </div>

        {/* 코멘트 입력 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            코멘트 (선택사항)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="호스트에게 전하고 싶은 말을 남겨주세요..."
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            rows={4}
            maxLength={500}
          />
          <p className="text-right text-xs text-gray-500 mt-1">{comment.length}/500</p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            건너뛰기
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            평가 제출
          </button>
        </div>
      </div>
    </div>
  );
}
