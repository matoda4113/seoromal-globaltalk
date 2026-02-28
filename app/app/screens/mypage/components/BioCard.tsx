'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import BioEditModal from './BioEditModal';

const translations = {
  ko: {
    bio: '자기소개',
    notSet: '설정 안함',
  },
  en: {
    bio: 'Bio',
    notSet: 'Not Set',
  },
  ja: {
    bio: '自己紹介',
    notSet: '未設定',
  },
};

export default function BioCard() {
  const { user } = useAuth();
  const { currentLanguage } = useGlobalSettings();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const t = translations[currentLanguage];

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{t.bio}</h3>
          <button
            onClick={() => setIsEditingBio(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        <div className="text-sm text-gray-700 leading-relaxed line-clamp-3">
          {user?.bio || (
            <span className="text-gray-400 italic">{t.notSet}</span>
          )}
        </div>
      </div>

      <BioEditModal
        isOpen={isEditingBio}
        onClose={() => setIsEditingBio(false)}
      />
    </>
  );
}
