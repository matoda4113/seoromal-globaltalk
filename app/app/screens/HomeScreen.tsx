'use client';

import { useState, useEffect } from 'react';
import { useSocket, type Room } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import RoomCard from '../components/RoomCard';
import FilterOption from '../components/FilterOption';
import CreateRoomModal from '../components/CreateRoomModal';
import BottomSheet from '../components/BottomSheet';
import OnlineUsersModal from '../components/OnlineUsersModal';
import RoomModal from '../components/RoomModal';
import RatingModal from '@/components/RatingModal';
import logger from '@/lib/logger';
import ratingsService from '@/services/ratings.service';

const translations = {
  ko: {
    title: '활성 방 목록',
    createRoom: '방 만들기',
    noRooms: '현재 활성화된 방이 없습니다',
    noRoomsDesc: '첫 번째 방을 만들어보세요!',
    joinRoom: '입장하기',
    participants: '명 참여 중',
    filters: {
      language: '언어',
      topic: '주제',
      all: '전체',
      ko: '한국어',
      en: '영어',
      ja: '일본어',
      free: '자유',
      romance: '연애',
      hobby: '취미',
      business: '비즈니스',
      travel: '여행',
    },
  },
  en: {
    title: 'Active Rooms',
    createRoom: 'Create Room',
    noRooms: 'No active rooms',
    noRoomsDesc: 'Be the first to create a room!',
    joinRoom: 'Join',
    participants: 'participants',
    filters: {
      language: 'Language',
      topic: 'Topic',
      all: 'All',
      ko: 'Korean',
      en: 'English',
      ja: 'Japanese',
      free: 'Free Talk',
      romance: 'Romance',
      hobby: 'Hobby',
      business: 'Business',
      travel: 'Travel',
    },
  },
  ja: {
    title: 'アクティブルーム',
    createRoom: 'ルーム作成',
    noRooms: '現在アクティブなルームがありません',
    noRoomsDesc: '最初のルームを作成してみましょう！',
    joinRoom: '入室する',
    participants: '人参加中',
    filters: {
      language: '言語',
      topic: 'トピック',
      all: '全体',
      ko: '韓国語',
      en: '英語',
      ja: '日本語',
      free: '自由',
      romance: '恋愛',
      hobby: '趣味',
      business: 'ビジネス',
      travel: '旅行',
    },
  },
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { currentLanguage } = useGlobalSettings();
  const {
    rooms,
    onlineCount,
    createRoom,
    currentRoom,
    leaveRoom,
    joinRoom,
    messages,
    sendMessage,
    updateRoomTitle,
    ratingModalData,
    setRatingModalData,
    guestBalance,
    giftNotification,
    refreshOnlineCount
  } = useSocket();
  const [languageFilter, setLanguageFilter] = useState<'all' | 'ko' | 'en' | 'ja'>('all');
  const [topicFilter, setTopicFilter] = useState<'all' | 'free' | 'romance' | 'hobby' | 'business' | 'travel'>('all');
  const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false);
  const [isTopicSheetOpen, setIsTopicSheetOpen] = useState(false);
  const [isOnlineUsersModalOpen, setIsOnlineUsersModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [currentRoomForModal, setCurrentRoomForModal] = useState<Room | null>(null);

  const t = translations[currentLanguage];

  // currentRoom이 변경되면 RoomModal 열기/닫기
  useEffect(() => {
    if (currentRoom) {
      setCurrentRoomForModal(currentRoom);
      setIsRoomModalOpen(true);
    } else {
      // currentRoom이 null이 되면 모달 닫기
      // history state 정리 (강제 종료 시)
      if (typeof window !== 'undefined' && window.history.state?.modal === 'room') {
        window.history.replaceState(null, '', '/app');
      }
      setIsRoomModalOpen(false);
      setCurrentRoomForModal(null);
    }
  }, [currentRoom]);

  // 필터링된 방 목록
  const filteredRooms = rooms.filter((room) => {
    const languageMatch = languageFilter === 'all' || room.language === languageFilter;
    const topicMatch = topicFilter === 'all' || room.topic === topicFilter;
    return languageMatch && topicMatch;
  });

  // 방 생성 핸들러
  const handleCreateRoom = (roomData: {
    title: string;
    topic: string;
    roomType: 'audio' | 'video';
    maxParticipants: number;
    isPrivate: boolean;
    password?: string;
  }) => {
    createRoom({
      title: roomData.title,
      language: currentLanguage,
      topic: roomData.topic,
      roomType: roomData.roomType,
      isPrivate: roomData.isPrivate,
      password: roomData.password,
    });
  };

  // 방 입장 핸들러 (비밀방이면 비밀번호 입력)
  const handleJoinRoom = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    // 비밀방인 경우 비밀번호 입력
    if (room.isPrivate) {
      const password = prompt(
        currentLanguage === 'ko'
          ? '비밀번호를 입력하세요:'
          : currentLanguage === 'ja'
          ? 'パスワードを入력してください:'
          : 'Enter password:'
      );

      if (password === null) {
        // 취소 버튼 클릭
        return;
      }

      joinRoom(roomId, undefined, password);
    } else {
      // 일반 방
      joinRoom(roomId);
    }
  };

  // 평가 제출 핸들러
  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!ratingModalData?.hostUserId || !user?.userId) {
      logger.error('❌ 평가 제출 실패: 호스트 또는 사용자 정보 없음');
      return;
    }

    try {
      logger.log(`⭐ 평가 제출: ${rating}점, 호스트 ${ratingModalData.hostUserId}`);

      await ratingsService.submitRating({
        ratedUserId: ratingModalData.hostUserId,
        raterUserId: user.userId,
        ratingScore: rating,
        ratingComment: comment || undefined,
      });

      logger.log('⭐ 평가 제출 성공');
      alert('평가가 제출되었습니다. 감사합니다!');
    } catch (error) {
      logger.error('❌ 평가 제출 실패:', error);
      alert('평가 제출에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <>
      {/* Title and Create Room Button */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {t.title}
          </h1>
          <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
            </svg>
            <span>{filteredRooms.length}</span>
          </div>
        </div>
        <button
          onClick={() => setIsCreateRoomModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md active:scale-95 min-h-[44px]"
        >
          {t.createRoom}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-3">
        {/* Language Filter Button */}
        <button
          onClick={() => setIsLanguageSheetOpen(true)}
          className="flex-1 flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-blue-500 transition-colors min-h-[48px]"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              {languageFilter === 'all' ? t.filters.language : t.filters[languageFilter as keyof typeof t.filters]}
            </span>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Topic Filter Button */}
        <button
          onClick={() => setIsTopicSheetOpen(true)}
          className="flex-1 flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-blue-500 transition-colors min-h-[48px]"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              {topicFilter === 'all' ? t.filters.topic : t.filters[topicFilter as keyof typeof t.filters]}
            </span>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Room List */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-lg font-bold text-gray-700 mb-2">
            {t.noRooms}
          </h2>
          <p className="text-sm text-gray-500">{t.noRoomsDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onJoin={handleJoinRoom}
              currentUserId={user?.userId}
            />
          ))}
        </div>
      )}

      {/* Language Filter Bottom Sheet */}
      <BottomSheet
        isOpen={isLanguageSheetOpen}
        onClose={() => setIsLanguageSheetOpen(false)}
        title={t.filters.language}
      >
        <div className="space-y-2">
          <FilterOption
            label={t.filters.all}
            active={languageFilter === 'all'}
            onClick={() => {
              setLanguageFilter('all');
              setIsLanguageSheetOpen(false);
            }}
          />
          <FilterOption
            label={t.filters.ko}
            active={languageFilter === 'ko'}
            onClick={() => {
              setLanguageFilter('ko');
              setIsLanguageSheetOpen(false);
            }}
          />
          <FilterOption
            label={t.filters.en}
            active={languageFilter === 'en'}
            onClick={() => {
              setLanguageFilter('en');
              setIsLanguageSheetOpen(false);
            }}
          />
          <FilterOption
            label={t.filters.ja}
            active={languageFilter === 'ja'}
            onClick={() => {
              setLanguageFilter('ja');
              setIsLanguageSheetOpen(false);
            }}
          />
        </div>
      </BottomSheet>

      {/* Topic Filter Bottom Sheet */}
      <BottomSheet
        isOpen={isTopicSheetOpen}
        onClose={() => setIsTopicSheetOpen(false)}
        title={t.filters.topic}
      >
        <div className="space-y-2">
          <FilterOption
            label={t.filters.all}
            active={topicFilter === 'all'}
            onClick={() => {
              setTopicFilter('all');
              setIsTopicSheetOpen(false);
            }}
          />
          <FilterOption
            label={t.filters.free}
            active={topicFilter === 'free'}
            onClick={() => {
              setTopicFilter('free');
              setIsTopicSheetOpen(false);
            }}
          />
          <FilterOption
            label={t.filters.romance}
            active={topicFilter === 'romance'}
            onClick={() => {
              setTopicFilter('romance');
              setIsTopicSheetOpen(false);
            }}
          />
          <FilterOption
            label={t.filters.hobby}
            active={topicFilter === 'hobby'}
            onClick={() => {
              setTopicFilter('hobby');
              setIsTopicSheetOpen(false);
            }}
          />
          <FilterOption
            label={t.filters.business}
            active={topicFilter === 'business'}
            onClick={() => {
              setTopicFilter('business');
              setIsTopicSheetOpen(false);
            }}
          />
          <FilterOption
            label={t.filters.travel}
            active={topicFilter === 'travel'}
            onClick={() => {
              setTopicFilter('travel');
              setIsTopicSheetOpen(false);
            }}
          />
        </div>
      </BottomSheet>

      {/* Online Users Modal */}
      <OnlineUsersModal
        isOpen={isOnlineUsersModalOpen}
        onClose={() => setIsOnlineUsersModalOpen(false)}
        authenticatedUsers={onlineCount.authenticatedUsers || []}
        anonymousCount={onlineCount.anonymous || 0}
        hasMore={onlineCount.hasMore}
        currentPage={onlineCount.page}
        onRefresh={refreshOnlineCount}
      />

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onCreate={handleCreateRoom}
      />

      {/* Room Modal (전체 화면) */}
      {currentRoomForModal && (
        <RoomModal
          isOpen={isRoomModalOpen}
          onClose={() => {
            setIsRoomModalOpen(false);
            setCurrentRoomForModal(null);
          }}
          onLeave={leaveRoom}
          room={currentRoomForModal}
          messages={messages}
          onSendMessage={sendMessage}
          onUpdateRoomTitle={updateRoomTitle}
          guestBalance={guestBalance}
          giftNotification={giftNotification}
        />
      )}

      {/* Rating Modal (호스트 평가) */}
      {ratingModalData?.show && ratingModalData.hostUserId && (
        <RatingModal
          hostUserId={ratingModalData.hostUserId}
          onClose={() => setRatingModalData(null)}
          onSubmit={handleRatingSubmit}
          message={ratingModalData.message}
        />
      )}

      {/* 일반 알림 모달 (평가 없이 메시지만 표시) */}
      {ratingModalData?.show && !ratingModalData.hostUserId && ratingModalData.message && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-white text-lg font-semibold mb-4">알림</h3>
            <p className="text-gray-300 mb-6">{ratingModalData.message}</p>
            <button
              onClick={() => setRatingModalData(null)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
