'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import ratingsService, { RatingDetail } from '@/services/ratings.service';
import logger from '@/lib/logger';

const translations = {
  ko: {
    title: '받은 평가',
    loading: '로딩 중...',
    noRatings: '받은 평가가 없습니다',
    noRatingsDesc: '첫 번째 통화를 시작해보세요!',
    reviews: '개의 평가',
    back: '돌아가기',
  },
  en: {
    title: 'Received Ratings',
    loading: 'Loading...',
    noRatings: 'No ratings yet',
    noRatingsDesc: 'Start your first call!',
    reviews: 'reviews',
    back: 'Back',
  },
  ja: {
    title: '受け取った評価',
    loading: '読み込み中...',
    noRatings: '評価がまだありません',
    noRatingsDesc: '最初の通話を始めましょう！',
    reviews: '個の評価',
    back: '戻る',
  },
};

export default function RatingsDetailPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentLanguage } = useGlobalSettings();
  const [ratings, setRatings] = useState<RatingDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = translations[currentLanguage];

  useEffect(() => {
    if (user?.userId) {
      fetchRatings();
    }
  }, [user?.userId]);

  const fetchRatings = async () => {
    if (!user?.userId) return;

    try {
      setIsLoading(true);
      const response = await ratingsService.getUserRatings(user.userId);
      setRatings(response.data.ratings);
      logger.info('Ratings fetched:', response.data.ratings.length);
    } catch (error) {
      logger.error('Failed to fetch ratings:', error);
      alert('평가를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return currentLanguage === 'ko' ? '오늘' : currentLanguage === 'ja' ? '今日' : 'Today';
    } else if (days === 1) {
      return currentLanguage === 'ko' ? '어제' : currentLanguage === 'ja' ? '昨日' : 'Yesterday';
    } else if (days < 7) {
      return currentLanguage === 'ko' ? `${days}일 전` : currentLanguage === 'ja' ? `${days}日前` : `${days} days ago`;
    } else {
      return date.toLocaleDateString(currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'ja' ? 'ja-JP' : 'en-US');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-sm text-white/80 mt-1">
              {ratings.length}{t.reviews}
            </p>
          </div>
        </div>

        {/* 평점 요약 */}
        {user && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mt-4">
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-6 h-6 ${
                      star <= Math.round(user.averageRating || 0) ? 'text-yellow-300' : 'text-white/30'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-3xl font-bold">{user.averageRating?.toFixed(1) || '0.0'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Ratings List */}
      <div className="p-4">
        {ratings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-lg font-bold text-gray-700 mb-2">{t.noRatings}</h2>
            <p className="text-sm text-gray-500">{t.noRatingsDesc}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ratings.map((rating) => (
              <div
                key={rating.rating_id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  {/* 프로필 이미지 */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                    {rating.rater_profile_image ? (
                      <img
                        src={rating.rater_profile_image}
                        alt={rating.rater_nickname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      rating.rater_nickname?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>

                  {/* 평가 내용 */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">
                        {rating.rater_nickname || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(rating.created_at)}
                      </span>
                    </div>

                    {/* 별점 */}
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${
                            star <= rating.rating_score ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* 코멘트 */}
                    {rating.rating_comment && (
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mt-2">
                        {rating.rating_comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
