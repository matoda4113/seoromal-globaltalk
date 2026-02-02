'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getTranslations, type Locale } from '@/lib/i18n';
import { resolveLocale, setStoredLocale } from '@/lib/locale-storage';
import BottomNav from '@/components/BottomNav';

export default function CommunityPage() {
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const langParam = searchParams.get('lang');
    const resolvedLocale = resolveLocale(langParam);
    setLocale(resolvedLocale);
    setStoredLocale(resolvedLocale);
  }, [searchParams]);

  const t = getTranslations(locale);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setStoredLocale(newLocale);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', newLocale);
    window.history.pushState({}, '', url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      {/* Header */}
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

      {/* Main Content */}
      <main className="px-4 py-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
          {t.app.nav.community}
        </h1>

        {/* Placeholder */}
        <div className="text-center py-16">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-lg font-bold text-gray-700 mb-2">
            Coming Soon
          </h2>
          <p className="text-sm text-gray-500">
            Community features will be available soon!
          </p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        locale={locale}
        homeText={t.app.nav.home}
        communityText={t.app.nav.community}
        mypageText={t.app.nav.mypage}
      />
    </div>
  );
}
