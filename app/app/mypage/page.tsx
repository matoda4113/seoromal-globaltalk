'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getTranslations, type Locale } from '@/lib/i18n';
import { resolveLocale, setStoredLocale } from '@/lib/locale-storage';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';

const translations = {
  ko: {
    loginRequired: '로그인이 필요합니다',
    loginRequiredDesc: '마이페이지를 이용하려면 로그인이 필요합니다',
    goToLogin: '로그인하기',
    continueAsGuest: '게스트로 계속하기',
    myProfile: '내 프로필',
    accountInfo: '계정 정보',
    email: '이메일',
    nickname: '닉네임',
    provider: '로그인 방법',
    ageGroup: '연령대',
    gender: '성별',
    editProfile: '프로필 수정',
    logout: '로그아웃',
    male: '남성',
    female: '여성',
    notSet: '설정 안함',
  },
  en: {
    loginRequired: 'Login Required',
    loginRequiredDesc: 'You need to login to access My Page',
    goToLogin: 'Go to Login',
    continueAsGuest: 'Continue as Guest',
    myProfile: 'My Profile',
    accountInfo: 'Account Information',
    email: 'Email',
    nickname: 'Nickname',
    provider: 'Login Method',
    ageGroup: 'Age Group',
    gender: 'Gender',
    editProfile: 'Edit Profile',
    logout: 'Logout',
    male: 'Male',
    female: 'Female',
    notSet: 'Not Set',
  },
  ja: {
    loginRequired: 'ログインが必要です',
    loginRequiredDesc: 'マイページを利用するにはログインが必要です',
    goToLogin: 'ログインする',
    continueAsGuest: 'ゲストとして続ける',
    myProfile: 'マイプロフィール',
    accountInfo: 'アカウント情報',
    email: 'メール',
    nickname: 'ニックネーム',
    provider: 'ログイン方法',
    ageGroup: '年齢層',
    gender: '性別',
    editProfile: 'プロフィール編集',
    logout: 'ログアウト',
    male: '男性',
    female: '女性',
    notSet: '未設定',
  },
};

export default function MyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const langParam = searchParams.get('lang');
    const resolvedLocale = resolveLocale(langParam);
    setLocale(resolvedLocale);
    setStoredLocale(resolvedLocale);
  }, [searchParams]);

  const t = getTranslations(locale);
  const myPageT = translations[locale];

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setStoredLocale(newLocale);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', newLocale);
    window.history.pushState({}, '', url);
  };

  const handleGoToLogin = () => {
    router.push(`/login?lang=${locale}`);
  };

  const handleContinueAsGuest = () => {
    router.push(`/app?lang=${locale}`);
  };

  const handleLogout = async () => {
    if (confirm(locale === 'ko' ? '로그아웃하시겠습니까?' : locale === 'ja' ? 'ログアウトしますか？' : 'Do you want to logout?')) {
      await logout(); // 서버에서 쿠키 삭제 후 자동으로 새로고침됨
    }
  };

  const getProviderName = (provider: string) => {
    const names: { [key: string]: string } = {
      google: 'Google',
      kakao: 'Kakao',
      line: 'LINE',
      apple: 'Apple',
      email: 'Email',
    };
    return names[provider] || provider;
  };

  const getGenderText = (gender: string | null | undefined) => {
    if (!gender) return myPageT.notSet;
    return gender === 'man' ? myPageT.male : myPageT.female;
  };

  const getAgeGroupText = (ageGroup: number | null | undefined) => {
    if (!ageGroup) return myPageT.notSet;
    return `${ageGroup}${locale === 'ko' ? '대' : locale === 'ja' ? '代' : 's'}`;
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
        <header className="px-4 py-3 flex justify-between items-center border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="text-lg sm:text-xl font-bold text-blue-600">서로말</div>
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

        <main className="px-4 py-6 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 140px)' }}>
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">{myPageT.loginRequired}</h2>
              <p className="text-gray-600 mb-8">{myPageT.loginRequiredDesc}</p>

              <div className="space-y-3">
                <button
                  onClick={handleGoToLogin}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors active:scale-95"
                >
                  {myPageT.goToLogin}
                </button>

                <button
                  onClick={handleContinueAsGuest}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors active:scale-95"
                >
                  {myPageT.continueAsGuest}
                </button>
              </div>
            </div>
          </div>
        </main>

        <BottomNav
          locale={locale}
          homeText={t.app.nav.home}
          communityText={t.app.nav.community}
          mypageText={t.app.nav.mypage}
        />
      </div>
    );
  }

  // 로그인한 경우 (TODO: 실제 마이페이지 구현)
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      <header className="px-4 py-3 flex justify-between items-center border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="text-lg sm:text-xl font-bold text-blue-600">서로말</div>
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

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {user?.nickname?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{user?.nickname || 'User'}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          {/* 프로필 정보 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">{myPageT.provider}</span>
              <span className="text-sm font-semibold text-gray-900">{getProviderName(user?.provider || '')}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">{myPageT.ageGroup}</span>
              <span className="text-sm font-semibold text-gray-900">{getAgeGroupText(user?.age_group)}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">{myPageT.gender}</span>
              <span className="text-sm font-semibold text-gray-900">{getGenderText(user?.gender)}</span>
            </div>
          </div>

          {/* 프로필 수정 버튼 */}
          <button
            onClick={() => alert('프로필 수정 기능은 준비 중입니다.')}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors active:scale-95"
          >
            {myPageT.editProfile}
          </button>
        </div>

        {/* 로그아웃 버튼 */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-100 transition-colors active:scale-95 border border-red-200"
        >
          {myPageT.logout}
        </button>
      </main>

      <BottomNav
        locale={locale}
        homeText={t.app.nav.home}
        communityText={t.app.nav.community}
        mypageText={t.app.nav.mypage}
      />
    </div>
  );
}
