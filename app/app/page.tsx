'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocketContext } from '@/contexts/SocketContext';
import HomeScreen from './screens/HomeScreen';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import LanguageSelector from '@/components/LanguageSelector';
import OnlineUsersModal from './components/OnlineUsersModal';

export default function AppPage() {
  const router = useRouter();
  const { currentLanguage } = useGlobalSettings();
  const [showOnlineModal, setShowOnlineModal] = useState(false);

  // Socket 연결 (온라인 카운트 표시용)
  const { isConnected, onlineCount, refreshOnlineCount } = useSocketContext();

  return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Header */}
        <header
            className="px-4 py-3 flex justify-between items-center border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="text-lg sm:text-xl font-bold text-blue-600">서로말</div>
            {/* 온라인 사용자 수 - 클릭 가능 */}
            <button
              onClick={() => setShowOnlineModal(true)}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors px-2 py-1 rounded-full hover:bg-blue-50"
            >
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{onlineCount.total} online</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector/>
            {/* 마이페이지 버튼 */}
            <button
              onClick={() => router.push('/mypage')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 py-6">
          <HomeScreen/>
        </main>

        {/* Online Users Modal */}
        <OnlineUsersModal
          isOpen={showOnlineModal}
          onClose={() => setShowOnlineModal(false)}
          authenticatedUsers={onlineCount.authenticatedUsers || []}
          anonymousCount={onlineCount.anonymous || 0}
          hasMore={onlineCount.hasMore}
          currentPage={onlineCount.page}
          onRefresh={refreshOnlineCount}
        />

      </div>
  );
}
