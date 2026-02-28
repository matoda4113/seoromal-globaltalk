'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import ProfileHeaderCard from './components/ProfileHeaderCard';
import BioCard from './components/BioCard';
import AccountInfoCard from './components/AccountInfoCard';

const translations = {
  ko: {
    logout: '로그아웃',
    logoutConfirm: '로그아웃하시겠습니까?',
  },
  en: {
    logout: 'Logout',
    logoutConfirm: 'Do you want to logout?',
  },
  ja: {
    logout: 'ログアウト',
    logoutConfirm: 'ログアウトしますか？',
  },
};

export default function LoggedInMyPage() {
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
