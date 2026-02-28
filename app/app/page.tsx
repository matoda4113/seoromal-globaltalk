'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import BottomNav, { type TabType } from '@/components/BottomNav';
import { useSocket } from '@/hooks/useSocket';
import HomeScreen from './screens/HomeScreen';
import CommunityScreen from './screens/CommunityScreen';
import MyPageScreen from './screens/MyPageScreen';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import LanguageSelector from '@/components/LanguageSelector';

const translations = {
  ko: {
    nav: {
      home: '홈',
      community: '커뮤니티',
      mypage: '마이페이지',
    },
  },
  en: {
    nav: {
      home: 'Home',
      community: 'Community',
      mypage: 'My Page',
    },
  },
  ja: {
    nav: {
      home: 'ホーム',
      community: 'コミュニティ',
      mypage: 'マイページ',
    },
  },
};

export default function AppPage() {
  const searchParams = useSearchParams();
  const { currentLanguage } = useGlobalSettings();
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Socket 연결 (온라인 카운트 표시용)
  const { isConnected, onlineCount } = useSocket();

  useEffect(() => {
    // URL 쿼리 파라미터에서 tab 읽기
    const tabParam = searchParams.get('tab');
    if (tabParam && (tabParam === 'home' || tabParam === 'community' || tabParam === 'mypage')) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  const t = translations[currentLanguage];

  return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
        {/* Header */}
        <header
            className="px-4 py-3 flex justify-between items-center border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="text-lg sm:text-xl font-bold text-blue-600">서로말</div>
            {/* 온라인 사용자 수 */}
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{onlineCount.total} online</span>
            </div>
          </div>
          <LanguageSelector/>
        </header>

        {/* Main Content */}
        <main className="px-4 py-6">
          {activeTab === 'home' && <HomeScreen/>}

          {activeTab === 'community' && <CommunityScreen/>}

          {activeTab === 'mypage' && <MyPageScreen/>}
        </main>


        {/* Bottom Navigation */}
        <BottomNav
            homeText={t.nav.home}
            communityText={t.nav.community}
            mypageText={t.nav.mypage}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        />

      </div>
  );
}
