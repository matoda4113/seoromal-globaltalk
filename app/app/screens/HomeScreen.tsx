import { useState } from 'react';
import { type Room } from '@/hooks/useSocket';
import RoomCard from '../components/RoomCard';
import FilterOption from '../components/FilterOption';
import CreateRoomModal from '../components/CreateRoomModal';
import BottomSheet from '../components/BottomSheet';
import OnlineUsersModal from '../components/OnlineUsersModal';

interface OnlineCount {
  total: number;
  authenticated: number;
  anonymous: number;
  authenticatedUsers: any[];
}

interface HomeScreenProps {
  rooms: Room[];
  onlineCount: OnlineCount;
  t: any;
  locale: 'ko' | 'en' | 'ja';
  onCreateRoom: (roomData: {
    title: string;
    topic: string;
    roomType: 'voice' | 'video';
    maxParticipants: number;
    isPrivate: boolean;
    password?: string;
  }) => void;
  onJoinRoom: (roomId: string, nickname?: string, password?: string) => void;
  currentUserId?: number | null;
}

export default function HomeScreen({
  rooms,
  onlineCount,
  t,
  locale,
  onCreateRoom,
  onJoinRoom,
  currentUserId,
}: HomeScreenProps) {
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false);
  const [isTopicSheetOpen, setIsTopicSheetOpen] = useState(false);
  const [isOnlineUsersModalOpen, setIsOnlineUsersModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);

  // 필터링된 방 목록
  const filteredRooms = rooms.filter((room) => {
    const languageMatch = languageFilter === 'all' || room.language === languageFilter;
    const topicMatch = topicFilter === 'all' || room.topic === topicFilter;
    return languageMatch && topicMatch;
  });

  // 방 입장 핸들러 (비밀방이면 비밀번호 입력)
  const handleJoinRoom = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    // 비밀방인 경우 비밀번호 입력
    if (room.isPrivate) {
      const password = prompt(
        locale === 'ko'
          ? '비밀번호를 입력하세요:'
          : locale === 'ja'
          ? 'パスワードを入力してください:'
          : 'Enter password:'
      );

      if (password === null) {
        // 취소 버튼 클릭
        return;
      }

      onJoinRoom(roomId, undefined, password);
    } else {
      // 일반 방
      onJoinRoom(roomId);
    }
  };

  return (
    <>
      {/* Title and Create Room Button */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {t.app.title}
          </h1>
          <button
            onClick={() => setIsOnlineUsersModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium hover:bg-green-100 transition-colors border border-green-200 active:scale-95"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>{onlineCount.total}</span>
          </button>
        </div>
        <button
          onClick={() => setIsCreateRoomModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md active:scale-95 min-h-[44px]"
        >
          {t.app.createRoom}
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
              {languageFilter === 'all' ? t.app.filters.language : t.app.filters[languageFilter as keyof typeof t.app.filters]}
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
              {topicFilter === 'all' ? t.app.filters.topic : t.app.filters[topicFilter as keyof typeof t.app.filters]}
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
            {t.app.noRooms}
          </h2>
          <p className="text-sm text-gray-500">{t.app.noRoomsDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              joinText={t.app.joinRoom}
              participantsText={t.app.participants}
              languageText={t.app.filters[room.language as keyof typeof t.app.filters] as string}
              topicText={t.app.filters[room.topic as keyof typeof t.app.filters] as string}
              onJoin={handleJoinRoom}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* Language Filter Bottom Sheet */}
      <BottomSheet
        isOpen={isLanguageSheetOpen}
        onClose={() => setIsLanguageSheetOpen(false)}
        title={t.app.filters.language}
      >
        <div className="space-y-2">
          <FilterOption
            label={t.app.filters.all}
            active={languageFilter === 'all'}
            onClick={() => {
              setLanguageFilter('all');
              setIsLanguageSheetOpen(false);
            }}
          />
          <FilterOption
            label={t.app.filters.korean}
            active={languageFilter === 'korean'}
            onClick={() => {
              setLanguageFilter('korean');
              setIsLanguageSheetOpen(false);
            }}
          />
          <FilterOption
            label={t.app.filters.english}
            active={languageFilter === 'english'}
            onClick={() => {
              setLanguageFilter('english');
              setIsLanguageSheetOpen(false);
            }}
          />
          <FilterOption
            label={t.app.filters.japanese}
            active={languageFilter === 'japanese'}
            onClick={() => {
              setLanguageFilter('japanese');
              setIsLanguageSheetOpen(false);
            }}
          />
        </div>
      </BottomSheet>

      {/* Topic Filter Bottom Sheet */}
      <BottomSheet
        isOpen={isTopicSheetOpen}
        onClose={() => setIsTopicSheetOpen(false)}
        title={t.app.filters.topic}
      >
        <div className="space-y-2">
          <FilterOption
            label={t.app.filters.all}
            active={topicFilter === 'all'}
            onClick={() => {
              setTopicFilter('all');
              setIsTopicSheetOpen(false);
            }}
          />
          <FilterOption
            label={t.app.filters.free}
            active={topicFilter === 'free'}
            onClick={() => {
              setTopicFilter('free');
              setIsTopicSheetOpen(false);
            }}
          />
          <FilterOption
            label={t.app.filters.romance}
            active={topicFilter === 'romance'}
            onClick={() => {
              setTopicFilter('romance');
              setIsTopicSheetOpen(false);
            }}
          />
          <FilterOption
            label={t.app.filters.hobby}
            active={topicFilter === 'hobby'}
            onClick={() => {
              setTopicFilter('hobby');
              setIsTopicSheetOpen(false);
            }}
          />
          <FilterOption
            label={t.app.filters.business}
            active={topicFilter === 'business'}
            onClick={() => {
              setTopicFilter('business');
              setIsTopicSheetOpen(false);
            }}
          />
          <FilterOption
            label={t.app.filters.travel}
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
        locale={locale}
      />

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onCreate={onCreateRoom}
        locale={locale}
      />
    </>
  );
}
