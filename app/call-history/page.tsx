'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import callHistoryService, { CallHistoryItem } from '@/services/call-history.service';

const translations = {
  ko: {
    title: '통화 기록',
    back: '뒤로',
    noHistory: '아직 통화 기록이 없습니다',
    noHistoryDesc: '첫 통화를 시작해보세요!',
    host: '호스트',
    guest: '게스트',
    all: '전체',
    asHost: '호스트로',
    asGuest: '게스트로',
    audio: '음성',
    video: '영상',
    duration: '통화 시간',
    points: '포인트',
    earned: '획득',
    charged: '차감',
    minutes: '분',
    seconds: '초',
    totalCalls: '총 통화',
    times: '회',
    languages: {
      ko: '한국어',
      en: '영어',
      ja: '일본어',
    },
    topics: {
      free: '자유 주제',
      romance: '연애',
      hobby: '취미',
      business: '비즈니스',
      travel: '여행',
    },
    earlyExit: '조기 퇴장',
    penalty: '패널티',
    totalTime: '총 통화 시간',
    hours: '시간',
    loadMore: '더 보기',
  },
  en: {
    title: 'Call History',
    back: 'Back',
    noHistory: 'No call history yet',
    noHistoryDesc: 'Start your first call!',
    host: 'Host',
    guest: 'Guest',
    all: 'All',
    asHost: 'As Host',
    asGuest: 'As Guest',
    audio: 'Audio',
    video: 'Video',
    duration: 'Duration',
    points: 'Points',
    earned: 'Earned',
    charged: 'Charged',
    minutes: 'min',
    seconds: 'sec',
    totalCalls: 'Total Calls',
    times: '',
    languages: {
      ko: 'Korean',
      en: 'English',
      ja: 'Japanese',
    },
    topics: {
      free: 'Free Talk',
      romance: 'Romance',
      hobby: 'Hobby',
      business: 'Business',
      travel: 'Travel',
    },
    earlyExit: 'Early Exit',
    penalty: 'Penalty',
    totalTime: 'Total Time',
    hours: 'h',
    loadMore: 'Load More',
  },
  ja: {
    title: '通話履歴',
    back: '戻る',
    noHistory: 'まだ通話履歴がありません',
    noHistoryDesc: '最初の通話を始めましょう！',
    host: 'ホスト',
    guest: 'ゲスト',
    all: '全体',
    asHost: 'ホストとして',
    asGuest: 'ゲストとして',
    audio: '音声',
    video: 'ビデオ',
    duration: '通話時間',
    points: 'ポイント',
    earned: '獲得',
    charged: '消費',
    minutes: '分',
    seconds: '秒',
    totalCalls: '総通話',
    times: '回',
    languages: {
      ko: '韓国語',
      en: '英語',
      ja: '日本語',
    },
    topics: {
      free: 'フリートーク',
      romance: '恋愛',
      hobby: '趣味',
      business: 'ビジネス',
      travel: '旅行',
    },
    earlyExit: '早期退出',
    penalty: 'ペナルティ',
    totalTime: '総通話時間',
    hours: '時間',
    loadMore: 'もっと見る',
  },
};

export default function CallHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentLanguage } = useGlobalSettings();
  const t = translations[currentLanguage];
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'host' | 'guest'>('all');
  const fetchCallHistory = async (page: number = 1, append: boolean = false) => {
    if (!user) return;

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const result = await callHistoryService.getCallHistory({
        role: activeTab,
        page,
        limit: 20,
      });

      if (append) {
        setCallHistory(prev => [...prev, ...(result.data?.callHistory || [])]);
      } else {
        setCallHistory(result.data?.callHistory || []);
      }

      setTotal(result.data?.pagination?.total || 0);
      setTotalPages(result.data?.pagination?.totalPages || 0);
      setCurrentPage(result.data?.pagination?.page || 1);
      setTotalDurationSeconds(result.data?.stats?.totalDurationSeconds || 0);
    } catch (error) {
      console.error('Failed to fetch call history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 탭 변경 시 새로 불러오기
  useEffect(() => {
    fetchCallHistory(1, false);
  }, [user, activeTab]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}${t.minutes} ${secs}${t.seconds}`;
    }
    return `${secs}${t.seconds}`;
  };

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}${t.hours} ${mins}${t.minutes}`;
    }
    return `${mins}${t.minutes}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      fetchCallHistory(currentPage + 1, true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800">{t.title}</h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center text-gray-400 py-8">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t.title}
            </h1>
          </div>
          {total > 0 && (
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full">
              <span className="text-sm font-semibold text-purple-700">
                {t.totalCalls} {total}{t.times}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${
                activeTab === 'all'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 border-b-2 border-transparent hover:text-gray-700'
              }`}
            >
              {t.all}
            </button>
            <button
              onClick={() => setActiveTab('host')}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${
                activeTab === 'host'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 border-b-2 border-transparent hover:text-gray-700'
              }`}
            >
              {t.asHost}
            </button>
            <button
              onClick={() => setActiveTab('guest')}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${
                activeTab === 'guest'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 border-b-2 border-transparent hover:text-gray-700'
              }`}
            >
              {t.asGuest}
            </button>
          </div>
        </div>
      </div>

      {/* 통계 정보 */}
      {totalDurationSeconds > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-gray-700">{t.totalTime}:</span>
              <span className="text-lg font-bold text-purple-600">{formatTotalDuration(totalDurationSeconds)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 컨텐츠 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {callHistory.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-12 border border-gray-100 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">{t.noHistory}</h3>
            <p className="text-gray-500 text-sm">{t.noHistoryDesc}</p>
          </div>
        ) : (
          <div className="space-y-2">
          {callHistory.map((call) => (
            <div
              key={call.call_id}
              className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                {/* 프로필 이미지 */}
                {call.partner_profile_image ? (
                  <Image
                    src={call.partner_profile_image}
                    alt={call.partner_nickname}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {call.partner_nickname.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* 상대방 이름 */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 truncate">{call.partner_nickname}</div>
                  <div className="text-xs text-gray-500">{formatDate(call.started_at)}</div>
                </div>

                {/* 역할 뱃지 */}
                <span className={`text-xs px-2 py-1 rounded font-semibold ${
                  call.my_role === 'host' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {call.my_role === 'host' ? t.host : t.guest}
                </span>

                {/* 통화 타입 아이콘 */}
                <div className={`w-6 h-6 rounded flex items-center justify-center ${
                  call.call_type === 'video' ? 'bg-purple-100' : 'bg-blue-100'
                }`}>
                  <svg className={`w-3.5 h-3.5 ${
                    call.call_type === 'video' ? 'text-purple-600' : 'text-blue-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {call.call_type === 'video' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    )}
                  </svg>
                </div>

                {/* 통화 시간 */}
                <div className="text-sm text-gray-600 whitespace-nowrap">
                  {formatDuration(call.duration_seconds)}
                </div>

                {/* 포인트 */}
                <div className="flex items-center gap-1">
                  {call.host_early_exit && call.my_role === 'host' && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-200 text-red-800 rounded font-semibold">
                      {t.penalty}
                    </span>
                  )}
                  <span className={`text-sm font-bold ${
                    call.my_points_change > 0 ? 'text-green-600' : call.my_points_change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {call.my_points_change > 0 ? '+' : ''}{call.my_points_change}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* 더 보기 버튼 */}
          {currentPage < totalPages && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loadingMore ? 'Loading...' : t.loadMore}
              </button>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
