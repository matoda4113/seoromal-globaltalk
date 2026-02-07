'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Locale } from '@/lib/i18n';
import { resolveLocale, setStoredLocale } from '@/lib/locale-storage';
import BottomNav, { type TabType } from '@/components/BottomNav';
import { useSocket, type Room } from '@/hooks/useSocket';
import RoomModal from './components/RoomModal';
import HomeScreen from './screens/HomeScreen';
import CommunityScreen from './screens/CommunityScreen';
import MyPageScreen from './screens/MyPageScreen';
import { useAuth } from '@/contexts/AuthContext';

export default function AppPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [locale, setLocale] = useState<Locale>('en');
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [currentRoomForModal, setCurrentRoomForModal] = useState<Room | null>(null);

  // Socket 연결 및 방 목록 가져오기
  const { rooms, isConnected, onlineCount, createRoom, currentRoom, leaveRoom, joinRoom, messages, sendMessage } = useSocket();

  useEffect(() => {
    const langParam = searchParams.get('lang');
    const resolvedLocale = resolveLocale(langParam);
    setLocale(resolvedLocale);
    setStoredLocale(resolvedLocale);

    // URL 쿼리 파라미터에서 tab 읽기
    const tabParam = searchParams.get('tab');
    if (tabParam && (tabParam === 'home' || tabParam === 'community' || tabParam === 'mypage')) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

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

  const t = getTranslations(locale);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setStoredLocale(newLocale);
    // URL 파라미터 업데이트
    const url = new URL(window.location.href);
    url.searchParams.set('lang', newLocale);
    window.history.pushState({}, '', url);
  };

  const handleCreateRoom = (roomData: {
    title: string;
    topic: string;
    roomType: 'voice' | 'video';
    maxParticipants: number;
    isPrivate: boolean;
    password?: string;
  }) => {
    // 사용자의 locale을 language로 매핑
    const languageMap: { [key: string]: string } = {
      ko: 'korean',
      en: 'english',
      ja: 'japanese',
    };

    createRoom({
      title: roomData.title,
      language: languageMap[locale] || 'english',
      topic: roomData.topic,
      roomType: roomData.roomType,
      isPrivate: roomData.isPrivate,
      password: roomData.password,
    });
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
        {activeTab === 'home' && (
          <HomeScreen
            rooms={rooms}
            onlineCount={onlineCount}
            t={t}
            locale={locale}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={joinRoom}
            currentUserId={user?.userId}
          />
        )}

        {activeTab === 'community' && <CommunityScreen locale={locale} t={t} />}

        {activeTab === 'mypage' && <MyPageScreen locale={locale} />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        locale={locale}
        homeText={t.app.nav.home}
        communityText={t.app.nav.community}
        mypageText={t.app.nav.mypage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
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
          locale={locale}
          messages={messages}
          onSendMessage={sendMessage}
        />
      )}
    </div>
  );
}
