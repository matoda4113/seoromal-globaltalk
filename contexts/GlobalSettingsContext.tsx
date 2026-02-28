'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale } from '@/types/locale';

interface GlobalSettingsContextType {
  currentLanguage: Locale;
  setLanguage: (language: Locale) => void;
}

const GlobalSettingsContext = createContext<GlobalSettingsContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'seoromal_language';
const DEFAULT_LANGUAGE: Locale = 'ko';

export function GlobalSettingsProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Locale>(DEFAULT_LANGUAGE);

  // 초기화: 로컬스토리지에서 언어 불러오기
  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Locale;
    if (savedLanguage && ['ko', 'en', 'ja'].includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  // 언어 변경 함수
  const setLanguage = (language: Locale) => {
    setCurrentLanguage(language);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  };

  return (
    <GlobalSettingsContext.Provider
      value={{
        currentLanguage,
        setLanguage,
      }}
    >
      {children}
    </GlobalSettingsContext.Provider>
  );
}

export function useGlobalSettings() {
  const context = useContext(GlobalSettingsContext);
  if (context === undefined) {
    throw new Error('useGlobalSettings must be used within a GlobalSettingsProvider');
  }
  return context;
}
