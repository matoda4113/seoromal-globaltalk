'use client';

import { useRouter } from 'next/navigation';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';

const translations = {
  ko: {
    loginRequired: '로그인이 필요합니다',
    loginRequiredDesc: '마이페이지를 이용하려면 로그인이 필요합니다',
    goToLogin: '로그인하기',
  },
  en: {
    loginRequired: 'Login Required',
    loginRequiredDesc: 'You need to login to access My Page',
    goToLogin: 'Go to Login',
  },
  ja: {
    loginRequired: 'ログインが必要です',
    loginRequiredDesc: 'マイページを利用するにはログインが必要です',
    goToLogin: 'ログインする',
  },
};

export default function LoggedOutMyPage() {
  const router = useRouter();
  const { currentLanguage } = useGlobalSettings();
  const t = translations[currentLanguage];

  const handleGoToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 140px)' }}>
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.loginRequired}</h2>
          <p className="text-gray-600 mb-8">{t.loginRequiredDesc}</p>

          <div className="space-y-3">
            <button
              onClick={handleGoToLogin}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors active:scale-95"
            >
              {t.goToLogin}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
