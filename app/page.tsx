'use client';

import { useState } from 'react';
import { getTranslations, type Locale } from '@/lib/i18n';

export default function Home() {
  const [locale, setLocale] = useState<Locale>('ko');
  const t = getTranslations(locale);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header - 모바일 최적화 */}
      <header className="px-4 py-3 flex justify-between items-center border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="text-lg sm:text-xl font-bold text-blue-600">SeRoMal</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocale('ko')}
            className={`px-2 py-1 text-xs sm:text-sm rounded ${locale === 'ko' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            KO
          </button>
          <button
            onClick={() => setLocale('en')}
            className={`px-2 py-1 text-xs sm:text-sm rounded ${locale === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            EN
          </button>
          <button
            onClick={() => setLocale('ja')}
            className={`px-2 py-1 text-xs sm:text-sm rounded ${locale === 'ja' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            JA
          </button>
        </div>
      </header>

      {/* Hero Section - 모바일 최적화 */}
      <section className="px-4 py-12 sm:py-16 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-gray-900 leading-tight">
          {t.hero.title}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 mb-3">
          {t.hero.subtitle}
        </p>
        <p className="text-sm sm:text-base text-gray-500 mb-6 max-w-md mx-auto">
          {t.hero.description}
        </p>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-full text-base font-semibold hover:bg-blue-700 transition-colors shadow-lg active:scale-95 min-h-[48px]">
          {t.hero.cta}
        </button>
        <div className="mt-4">
          <button className="text-blue-600 text-sm underline">
            {t.hero.login}
          </button>
        </div>
      </section>

      {/* Features Section - 모바일 최적화 (2열) */}
      <section className="px-4 py-12 bg-white">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-900">
          {t.features.title}
        </h2>
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          <FeatureCard
            icon="💰"
            title={t.features.free.title}
            description={t.features.free.description}
          />
          <FeatureCard
            icon="🌏"
            title={t.features.native.title}
            description={t.features.native.description}
          />
          <FeatureCard
            icon="🎙️"
            title={t.features.realtime.title}
            description={t.features.realtime.description}
          />
          <FeatureCard
            icon="⚖️"
            title={t.features.fair.title}
            description={t.features.fair.description}
          />
        </div>
      </section>

      {/* How it Works - 모바일 최적화 */}
      <section className="bg-gray-50 px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-900">
          {t.howItWorks.title}
        </h2>
        <div className="space-y-6 max-w-md mx-auto">
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-blue-600">
              {t.howItWorks.host.title}
            </h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">1</span>
                <span className="text-sm">{t.howItWorks.host.step1}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">2</span>
                <span className="text-sm">{t.howItWorks.host.step2}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">3</span>
                <span className="text-sm">{t.howItWorks.host.step3}</span>
              </li>
            </ol>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-green-600">
              {t.howItWorks.guest.title}
            </h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">1</span>
                <span className="text-sm">{t.howItWorks.guest.step1}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">2</span>
                <span className="text-sm">{t.howItWorks.guest.step2}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">3</span>
                <span className="text-sm">{t.howItWorks.guest.step3}</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Acorn System - 모바일 최적화 */}
      <section className="px-4 py-12">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">
            🌰 {t.acorn.title}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            {t.acorn.description}
          </p>
          <div className="grid grid-cols-1 gap-3 text-left bg-amber-50 p-5 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎉</span>
              <span className="text-sm">{t.acorn.signup}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">⏰</span>
              <span className="text-sm">{t.acorn.free}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">🎙️</span>
              <span className="text-sm">{t.acorn.host}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">✍️</span>
              <span className="text-sm">{t.acorn.review}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">⭐</span>
              <span className="text-sm">{t.acorn.fiveStar}</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - 모바일 최적화 */}
      <section className="bg-blue-600 text-white px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            {t.hero.title}
          </h2>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-full text-base font-semibold hover:bg-gray-100 transition-colors shadow-lg active:scale-95 min-h-[48px]">
            {t.hero.cta}
          </button>
        </div>
      </section>

      {/* Footer - 모바일 최적화 */}
      <footer className="bg-gray-900 text-white px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="text-lg font-bold mb-2">SeRoMal</div>
          <p className="text-gray-400 text-sm mb-4">{t.footer.slogan}</p>
          <p className="text-gray-500 text-xs">
            © 2025 SeRoMal. {t.footer.rights}
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="text-sm font-bold mb-1 text-gray-900">{title}</h3>
      <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
