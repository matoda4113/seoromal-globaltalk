'use client';

import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import { Locale } from '@/types/locale';

export default function LanguageSelector() {
  const { currentLanguage, setLanguage } = useGlobalSettings();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLanguage('ko')}
        className={`px-2 py-1 text-xs sm:text-sm rounded ${
          currentLanguage === 'ko'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        KO
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 text-xs sm:text-sm rounded ${
          currentLanguage === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('ja')}
        className={`px-2 py-1 text-xs sm:text-sm rounded ${
          currentLanguage === 'ja'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        JA
      </button>
    </div>
  );
}
