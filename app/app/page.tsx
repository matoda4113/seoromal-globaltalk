'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Locale } from '@/lib/i18n';
import { resolveLocale, setStoredLocale } from '@/lib/locale-storage';
import BottomNav from '@/components/BottomNav';
import BottomSheet from '@/components/BottomSheet';
import { useSocket, type Room } from '@/hooks/useSocket';
import OnlineUsersModal from '@/components/OnlineUsersModal';

export default function AppPage() {
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<Locale>('en');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false);
  const [isTopicSheetOpen, setIsTopicSheetOpen] = useState(false);
  const [isOnlineUsersModalOpen, setIsOnlineUsersModalOpen] = useState(false);

  // Socket 연결 및 방 목록 가져오기
  const { rooms, isConnected, onlineCount } = useSocket();

  useEffect(() => {
    const langParam = searchParams.get('lang');
    const resolvedLocale = resolveLocale(langParam);
    setLocale(resolvedLocale);
    setStoredLocale(resolvedLocale);
  }, [searchParams]);

  const t = getTranslations(locale);

  // 필터링된 방 목록
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const languageMatch = languageFilter === 'all' || room.language === languageFilter;
      const topicMatch = topicFilter === 'all' || room.topic === topicFilter;
      return languageMatch && topicMatch;
    });
  }, [rooms, languageFilter, topicFilter]);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setStoredLocale(newLocale);
    // URL 파라미터 업데이트
    const url = new URL(window.location.href);
    url.searchParams.set('lang', newLocale);
    window.history.pushState({}, '', url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      {/* Header */}
      <header className="px-4 py-3 flex justify-between items-center border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="text-lg sm:text-xl font-bold text-blue-600">서로말</div>
          {/* 온라인 사용자 수 */}
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{onlineCount.total} online</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLocaleChange('ko')}
            className={`px-2 py-1 text-xs sm:text-sm rounded ${locale === 'ko' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            KO
          </button>
          <button
            onClick={() => handleLocaleChange('en')}
            className={`px-2 py-1 text-xs sm:text-sm rounded ${locale === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            EN
          </button>
          <button
            onClick={() => handleLocaleChange('ja')}
            className={`px-2 py-1 text-xs sm:text-sm rounded ${locale === 'ja' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            JA
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
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
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md active:scale-95 min-h-[44px]">
            {t.app.createRoom}
          </button>
        </div>

        {/* Filters - 한 줄 버튼 */}
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
              />
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        locale={locale}
        homeText={t.app.nav.home}
        communityText={t.app.nav.community}
        mypageText={t.app.nav.mypage}
      />

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
    </div>
  );
}

function FilterOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg transition-colors min-h-[48px] flex items-center justify-between ${
        active
          ? 'bg-blue-50 text-blue-700 font-semibold'
          : 'bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span>{label}</span>
      {active && (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}

function RoomCard({
  room,
  joinText,
  participantsText,
  languageText,
  topicText,
}: {
  room: Room;
  joinText: string;
  participantsText: string;
  languageText: string;
  topicText: string;
}) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
      {/* Room Title */}
      <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-1">
        {room.title}
      </h3>

      {/* Host Info */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {room.hostNickname[0].toUpperCase()}
        </div>
        <div>
          <p className="text-xs text-gray-500">Host</p>
          <p className="text-sm font-semibold text-gray-700">{room.hostNickname}</p>
        </div>
      </div>

      {/* Tags (Language & Topic) */}
      <div className="mb-3 flex gap-2">
        <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
          {languageText}
        </span>
        <span className="inline-block bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
          {topicText}
        </span>
      </div>

      {/* Bottom Section */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-600">
          {room.participants.length}/{room.maxParticipants} {participantsText}
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors active:scale-95 min-h-[40px]">
          {joinText}
        </button>
      </div>
    </div>
  );
}
