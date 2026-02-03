'use client';

import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n';

interface HeaderProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  showBackButton?: boolean;
  backButtonText?: string;
  title?: string;
}

export default function Header({
  locale,
  onLocaleChange,
  showBackButton = false,
  backButtonText = '돌아가기',
  title = '서로말',
}: HeaderProps) {
  const router = useRouter();

  return (
    <header className="px-4 py-3 flex justify-between items-center border-b border-gray-200 bg-white sticky top-0 z-50">
      {showBackButton ? (
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backButtonText}
        </button>
      ) : (
        <div className="text-lg sm:text-xl font-bold text-blue-600">{title}</div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => onLocaleChange('ko')}
          className={`px-2 py-1 text-xs sm:text-sm rounded ${
            locale === 'ko' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          KO
        </button>
        <button
          onClick={() => onLocaleChange('en')}
          className={`px-2 py-1 text-xs sm:text-sm rounded ${
            locale === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => onLocaleChange('ja')}
          className={`px-2 py-1 text-xs sm:text-sm rounded ${
            locale === 'ja' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          JA
        </button>
      </div>
    </header>
  );
}
