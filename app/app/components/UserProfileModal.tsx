'use client';

import { useState, useEffect } from 'react';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import ratingsService, { RatingDetail } from '@/services/ratings.service';
import logger from '@/lib/logger';

const translations = {
  ko: {
    close: '닫기',
    degree: '매너 온도',
    rating: '평점',
    reviews: '개의 평가',
    viewReviews: '후기 상세보기',
    noReviews: '아직 받은 평가가 없습니다',
    loading: '로딩 중...',
  },
  en: {
    close: 'Close',
    degree: 'Manner Temperature',
    rating: 'Rating',
    reviews: 'reviews',
    viewReviews: 'View Reviews',
    noReviews: 'No reviews yet',
    loading: 'Loading...',
  },
  ja: {
    close: '閉じる',
    degree: 'マナー温度',
    rating: '評価',
    reviews: '個の評価',
    viewReviews: '詳細を見る',
    noReviews: 'まだ評価がありません',
    loading: '読み込み中...',
  },
};

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  nickname: string;
  profileImageUrl?: string | null;
  bio?: string | null;
  degree?: number;
  averageRating?: number;
  totalRatings?: number;
  ageGroup?: number | null;
  gender?: string | null;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  userId,
  nickname,
  profileImageUrl,
  bio,
  degree,
  averageRating,
  totalRatings,
  ageGroup,
  gender,
}: UserProfileModalProps) {
  const { currentLanguage } = useGlobalSettings();
  const t = translations[currentLanguage];
  const [showReviews, setShowReviews] = useState(false);
  const [ratings, setRatings] = useState<RatingDetail[]>([]);
  const [isLoadingRatings, setIsLoadingRatings] = useState(false);

  // 모달이 닫힐 때 후기 목록 닫기
  useEffect(() => {
    if (!isOpen) {
      setShowReviews(false);
      setRatings([]);
    }
  }, [isOpen]);

  // 후기 불러오기
  const handleViewReviews = async () => {
    if (showReviews) {
      setShowReviews(false);
      return;
    }

    try {
      setIsLoadingRatings(true);
      const response = await ratingsService.getUserRatings(userId);
      setRatings(response.data.ratings);
      setShowReviews(true);
      logger.info('User ratings loaded:', response.data.ratings.length);
    } catch (error) {
      logger.error('Failed to load user ratings:', error);
      alert('후기를 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingRatings(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-t-2xl">
          <div className="flex flex-col items-center">
            {/* Profile Image */}
            <div className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden mb-4">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                nickname.charAt(0).toUpperCase()
              )}
            </div>

            {/* Nickname */}
            <h2 className="text-2xl font-bold text-white mb-4">{nickname}</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {/* Degree */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3">
                <div className="flex items-center justify-center gap-1 text-white mb-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.06 1.06l1.06 1.06z" />
                  </svg>
                  <span className="text-xs">{t.degree}</span>
                </div>
                <p className="text-white text-center font-bold text-lg">
                  {degree ? Number(degree).toFixed(1) : '36.5'}°C
                </p>
              </div>

              {/* Rating */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3">
                <div className="flex items-center justify-center gap-1 text-white mb-1">
                  <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs">{t.rating}</span>
                </div>
                <p className="text-white text-center font-bold text-lg">
                  {averageRating?.toFixed(1) || '0.0'}
                </p>
                <p className="text-white/70 text-center text-xs">
                  {totalRatings || 0}{t.reviews}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Bio */}
          {bio && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">자기소개</h3>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4 leading-relaxed whitespace-pre-wrap">
                {bio}
              </p>
            </div>
          )}

          {/* Additional Info */}
          <div className="space-y-3 mb-6">
            {ageGroup && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 w-20">나이대:</span>
                <span className="text-gray-900 font-medium">{ageGroup}대</span>
              </div>
            )}
            {gender && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 w-20">성별:</span>
                <span className="text-gray-900 font-medium">
                  {gender === 'male' ? '남성' : gender === 'female' ? '여성' : '기타'}
                </span>
              </div>
            )}
          </div>

          {/* View Reviews Button */}
          <button
            onClick={handleViewReviews}
            disabled={isLoadingRatings}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 mb-4"
          >
            {isLoadingRatings ? t.loading : showReviews ? '후기 닫기' : t.viewReviews}
          </button>

          {/* Reviews List */}
          {showReviews && (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {ratings.length === 0 ? (
                <p className="text-center text-gray-500 py-8">{t.noReviews}</p>
              ) : (
                ratings.map((rating) => (
                  <div
                    key={rating.rating_id}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      {/* Rater Profile */}
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
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

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900 text-sm">
                            {rating.rater_nickname || 'Anonymous'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(rating.created_at)}
                          </span>
                        </div>

                        {/* Stars */}
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

                        {/* Comment */}
                        {rating.rating_comment && (
                          <p className="text-sm text-gray-700">{rating.rating_comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors mt-4"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
