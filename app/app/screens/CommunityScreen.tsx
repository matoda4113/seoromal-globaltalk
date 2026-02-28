'use client';

import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';

const translations = {
  ko: {
    title: '커뮤니티',
    comingSoon: '곧 만나요!',
  },
  en: {
    title: 'Community',
    comingSoon: 'Coming Soon',
  },
  ja: {
    title: 'コミュニティ',
    comingSoon: '近日公開！',
  },
};

export default function CommunityScreen() {
  const { currentLanguage } = useGlobalSettings();
  const t = translations[currentLanguage];

  return (
    <>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
        {t.title}
      </h1>

      {/* Placeholder */}
      <div className="text-center py-16">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-lg font-bold text-gray-700 mb-2">
          {t.title}
        </h2>
        <p className="text-sm text-gray-500">
          {t.comingSoon}
        </p>
      </div>
    </>
  );
}
