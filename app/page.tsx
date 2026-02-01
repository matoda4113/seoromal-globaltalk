'use client';

import { useState } from 'react';
import { getTranslations, type Locale } from '@/lib/i18n';

export default function Home() {
  const [locale, setLocale] = useState<Locale>('ko');
  const t = getTranslations(locale);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">서로말 SeRoMalee4</div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocale('ko')}
            className={`px-3 py-1 rounded ${locale === 'ko' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            한국어
          </button>
          <button
            onClick={() => setLocale('ja')}
            className={`px-3 py-1 rounded ${locale === 'ja' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            日本語
          </button>
          <button className="px-4 py-2 text-blue-600 hover:text-blue-800">
            {t.hero.login}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
          {t.hero.title}
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-4">
          {t.hero.subtitle}
        </p>
        <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
          {t.hero.description}
        </p>
        <button className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg">
          {t.hero.cta}
        </button>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
          {t.features.title}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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

      {/* How it Works */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            {t.howItWorks.title}
          </h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold mb-6 text-blue-600">
                {t.howItWorks.host.title}
              </h3>
              <ol className="space-y-4">
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">1</span>
                  <span className="pt-1">{t.howItWorks.host.step1}</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">2</span>
                  <span className="pt-1">{t.howItWorks.host.step2}</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">3</span>
                  <span className="pt-1">{t.howItWorks.host.step3}</span>
                </li>
              </ol>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold mb-6 text-green-600">
                {t.howItWorks.guest.title}
              </h3>
              <ol className="space-y-4">
                <li className="flex items-start">
                  <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">1</span>
                  <span className="pt-1">{t.howItWorks.guest.step1}</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">2</span>
                  <span className="pt-1">{t.howItWorks.guest.step2}</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">3</span>
                  <span className="pt-1">{t.howItWorks.guest.step3}</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Acorn System */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-900">
            🌰 {t.acorn.title}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {t.acorn.description}
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-left bg-amber-50 p-8 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <span>{t.acorn.signup}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏰</span>
              <span>{t.acorn.free}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎙️</span>
              <span>{t.acorn.host}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✍️</span>
              <span>{t.acorn.review}</span>
            </div>
            <div className="flex items-center gap-3 md:col-span-2 justify-center">
              <span className="text-2xl">⭐</span>
              <span>{t.acorn.fiveStar}</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            {t.hero.title}
          </h2>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">
            {t.hero.cta}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="text-xl font-bold mb-2">서로말 SeRoMal</div>
          <p className="text-gray-400 mb-4">{t.footer.slogan}</p>
          <p className="text-gray-500 text-sm">
            © 2025 SeRoMal. {t.footer.rights}
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
