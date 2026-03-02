'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import LanguageSelector from '@/components/LanguageSelector';
import pointsService, { type PointHistory } from '@/services/points.service';
import logger from '@/lib/logger';
import { translatePointReason, translatePointType } from '@/types/points';

const translations = {
  ko: {
    pointsHistory: '도토리 내역',
    totalPoints: '총 도토리',
    noHistory: '도토리 내역이 없습니다',
    loading: '로딩 중...',
    loginRequired: '로그인이 필요합니다',
    goBack: '돌아가기',
  },
  en: {
    pointsHistory: 'Dotori History',
    totalPoints: 'Total Dotori',
    noHistory: 'No Dotori history',
    loading: 'Loading...',
    loginRequired: 'Login Required',
    goBack: 'Go Back',
  },
  ja: {
    pointsHistory: 'ドトリ履歴',
    totalPoints: '総ドトリ',
    noHistory: 'ドトリ履歴がありません',
    loading: '読み込み中...',
    loginRequired: 'ログインが必要です',
    goBack: '戻る',
  },
};

export default function PointsHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentLanguage } = useGlobalSettings();
  const [totalPoints, setTotalPoints] = useState(0);
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchPointsHistory();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const fetchPointsHistory = async () => {
    try {
      setIsLoading(true);
      const response = await pointsService.getPointsHistory();
      setTotalPoints(response.data.totalPoints);
      setHistory(response.data.history);
    } catch (error) {
      logger.error('Failed to fetch points history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pageT = translations[currentLanguage];


  const getTypeColor = (type: string) => {
    if (type === 'earn') return 'text-green-600';
    if (type === 'charge') return 'text-red-600';
    return 'text-gray-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 로딩 중
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{pageT.loading}</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
        <header className="px-4 py-3 flex justify-between items-center border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="text-lg sm:text-xl font-bold text-blue-600">서로말</div>
          <LanguageSelector />
        </header>

        <main className="px-4 py-6 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 140px)' }}>
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{pageT.loginRequired}</h2>
              <button
                onClick={() => router.push('/login')}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors active:scale-95"
              >
                {pageT.goBack}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 로그인한 경우
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="px-4 py-3 flex justify-between items-center border-b border-gray-200 bg-white sticky top-0 z-50">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {pageT.goBack}
        </button>
        <LanguageSelector />
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{pageT.pointsHistory}</h1>

        {/* 총 포인트 카드 */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{pageT.totalPoints}</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌰</span>
              <span className="text-3xl font-bold">{totalPoints.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 포인트 내역 리스트 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>{pageT.noHistory}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-semibold ${getTypeColor(item.type)}`}>
                        {translatePointType(item.type, currentLanguage)}
                      </span>
                      <span className={`text-lg font-bold ${getTypeColor(item.type)}`}>
                        {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}
                      </span>
                    </div>
                    {item.reason && (
                      <p className="text-sm text-gray-600 mb-1">
                        {translatePointReason(item.reason, currentLanguage)}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">{formatDate(item.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
