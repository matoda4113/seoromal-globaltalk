'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import { useRouter } from 'next/navigation';
import ProfileHeaderCard from './components/ProfileHeaderCard';
import BioCard from './components/BioCard';
import AccountInfoCard from './components/AccountInfoCard';

const translations = {
  ko: {
    logout: '로그아웃',
    logoutConfirm: '로그아웃하시겠습니까?',
    callHistory: '통화 기록',
  },
  en: {
    logout: 'Logout',
    logoutConfirm: 'Do you want to logout?',
    callHistory: 'Call History',
  },
  ja: {
    logout: 'ログアウト',
    logoutConfirm: 'ログアウトしますか？',
    callHistory: '通話履歴',
  },
};

export default function LoggedInMyPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { currentLanguage } = useGlobalSettings();
  const t = translations[currentLanguage];

  const handleLogout = () => {
    if (confirm(t.logoutConfirm)) {
      logout();
    }
  };

  return (
    <>
      {/* 프로필 헤더 카드 */}
      <ProfileHeaderCard />

      {/* 자기소개 카드 */}
      <BioCard />

      {/* 계정 정보 카드 */}
      <AccountInfoCard />

      {/* 통화 기록 버튼 */}
      <button
        onClick={() => router.push('/call-history')}
        className="w-full bg-gradient-to-r from-purple-50 to-pink-50 text-gray-800 py-3 rounded-xl font-semibold hover:from-purple-100 hover:to-pink-100 transition-all active:scale-95 border border-purple-200 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {t.callHistory}
      </button>

      {/* 로그아웃 버튼 */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-100 transition-colors active:scale-95 border border-red-200 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {t.logout}
      </button>
    </>
  );
}
