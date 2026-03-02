'use client';

import { useRouter } from 'next/navigation';
import MyPageScreen from '../app/screens/MyPageScreen';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';

const translations = {
  ko: { title: '마이페이지' },
  en: { title: 'My Page' },
  ja: { title: 'マイページ' }
};

export default function MyPage() {
  const router = useRouter();
  const { currentLanguage } = useGlobalSettings();
  const t = translations[currentLanguage];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-3 border-b border-gray-200 bg-white sticky top-0 z-50">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t.title}</h1>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <MyPageScreen />
      </main>
    </div>
  );
}
