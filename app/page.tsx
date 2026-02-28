'use client';

import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import LanguageSelector from '@/components/LanguageSelector';

const translations = {
  ko: {
    hero: {
      title: '서로 말하고, 서로 배우다',
      subtitle: '음성/화상 기반 글로벌 언어교환 플랫폼',
      description: '원하는 언어를 배우고 싶은 사람들이 서로 가르치고 배우는 공간입니다.',
      cta: '지금 시작하기',
      login: '로그인',
    },
    features: {
      title: '왜 서로말인가요?',
      free: {
        title: '무료 언어교환',
        description: '도토리 포인트 시스템으로 비용 부담 없이 원어민과 대화하세요',
      },
      native: {
        title: '원어민과 직접 연결',
        description: '실제 원어민과 1:1로 대화하며 살아있는 언어를 배우세요',
      },
      realtime: {
        title: '실시간 대화',
        description: '음성 또는 화상으로 실제 회화 능력을 향상시키세요',
      },
      fair: {
        title: '공정한 시스템',
        description: '호스트는 도토리를 얻고, 게스트는 도토리를 사용하는 호혜적 구조',
      },
    },
    howItWorks: {
      title: '이용 방법',
      host: {
        title: '호스트로 참여',
        step1: '방 만들기',
        step2: '게스트 대기',
        step3: '대화하고 도토리 획득',
      },
      guest: {
        title: '게스트로 참여',
        step1: '원하는 방 찾기',
        step2: '입장하기 (1 도토리 필요)',
        step3: '대화하고 평가 남기기',
      },
    },
    acorn: {
      title: '도토리 시스템',
      description: '서로말은 도토리 포인트로 공정한 언어교환을 실현합니다',
      signup: '회원가입 시 50개',
      free: '4시간마다 10개 무료',
      host: '호스트 활동 시 분당 1개',
      review: '리뷰 작성 시 1개',
      fiveStar: '⭐⭐⭐⭐⭐ 받으면 3개',
    },
    footer: {
      slogan: '서로 말하고, 서로 배우다',
      rights: '모든 권리 보유',
    },
  },
  en: {
    hero: {
      title: 'Talk Together, Learn Together',
      subtitle: 'Global Language Exchange Platform',
      description: 'A space where people who want to learn languages teach and learn from each other.',
      cta: 'Get Started',
      login: 'Login',
    },
    features: {
      title: 'Why SeRoMal?',
      free: {
        title: 'Free Language Exchange',
        description: 'Chat with native speakers at no cost using our acorn point system',
      },
      native: {
        title: 'Direct Native Connection',
        description: 'Learn living languages through 1:1 conversations with real native speakers',
      },
      realtime: {
        title: 'Real-time Conversations',
        description: 'Improve your speaking skills through voice or video calls',
      },
      fair: {
        title: 'Fair System',
        description: 'Mutual benefit structure where hosts earn acorns and guests use them',
      },
    },
    howItWorks: {
      title: 'How It Works',
      host: {
        title: 'Join as Host',
        step1: 'Create a room',
        step2: 'Wait for guests',
        step3: 'Chat and earn acorns',
      },
      guest: {
        title: 'Join as Guest',
        step1: 'Find a room',
        step2: 'Enter (1 acorn required)',
        step3: 'Chat and leave a review',
      },
    },
    acorn: {
      title: 'Acorn System',
      description: 'SeRoMal enables fair language exchange with acorn points',
      signup: '50 on signup',
      free: '10 free every 4 hours',
      host: '1 per minute as host',
      review: '1 for writing reviews',
      fiveStar: '3 for receiving ⭐⭐⭐⭐⭐',
    },
    footer: {
      slogan: 'Talk Together, Learn Together',
      rights: 'All Rights Reserved',
    },
  },
  ja: {
    hero: {
      title: 'お互いに話し、お互いに学ぶ',
      subtitle: '音声/ビデオベースのグローバル言語交換プラットフォーム',
      description: '学びたい言語がある人々がお互いに教え合い、学び合う場所です。',
      cta: '今すぐ始める',
      login: 'ログイン',
    },
    features: {
      title: 'なぜSeRoMalなのか？',
      free: {
        title: '無料言語交換',
        description: 'どんぐりポイントシステムで費用負担なくネイティブと会話できます',
      },
      native: {
        title: 'ネイティブと直接つながる',
        description: '実際のネイティブと1:1で会話し、生きた言語を学びましょう',
      },
      realtime: {
        title: 'リアルタイム会話',
        description: '音声またはビデオで実際の会話能力を向上させましょう',
      },
      fair: {
        title: '公正なシステム',
        description: 'ホストはどんぐりを獲得し、ゲストはどんぐりを使用する互恵的構造',
      },
    },
    howItWorks: {
      title: '利用方法',
      host: {
        title: 'ホストとして参加',
        step1: 'ルームを作成',
        step2: 'ゲストを待つ',
        step3: '会話してどんぐりを獲得',
      },
      guest: {
        title: 'ゲストとして参加',
        step1: '希望のルームを探す',
        step2: '入室する（1どんぐり必要）',
        step3: '会話して評価を残す',
      },
    },
    acorn: {
      title: 'どんぐりシステム',
      description: 'SeRoMalはどんぐりポイントで公正な言語交換を実現します',
      signup: '会員登録時に50個',
      free: '4時間ごとに10個無料',
      host: 'ホスト活動時に分当たり1個',
      review: 'レビュー作成時に1個',
      fiveStar: '⭐⭐⭐⭐⭐をもらうと3個',
    },
    footer: {
      slogan: 'お互いに話し、お互いに学ぶ',
      rights: 'All Rights Reserved',
    },
  },
};

export default function Home() {
  const { currentLanguage } = useGlobalSettings();
  const t = translations[currentLanguage];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header - 모바일 최적화 */}
      <header className="px-4 py-3 flex justify-between items-center border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="text-lg sm:text-xl font-bold text-blue-600">서로말</div>
        <LanguageSelector />
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
        <button
          onClick={() => {
            window.location.href = '/app';
          }}
          className="bg-blue-600 text-white px-8 py-3 rounded-full text-base font-semibold hover:bg-blue-700 transition-colors shadow-lg active:scale-95 min-h-[48px]"
        >
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
          <button
            onClick={() => {
              window.location.href = '/app';
            }}
            className="bg-white text-blue-600 px-8 py-3 rounded-full text-base font-semibold hover:bg-gray-100 transition-colors shadow-lg active:scale-95 min-h-[48px]"
          >
            {t.hero.cta}
          </button>
        </div>
      </section>

      {/* Footer - 모바일 최적화 */}
      <footer className="bg-gray-900 text-white px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="text-lg font-bold mb-2">서로말</div>
          <p className="text-gray-400 text-sm mb-4">{t.footer.slogan}</p>
          <p className="text-gray-500 text-xs">
            © 2026 서로말. {t.footer.rights}
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
