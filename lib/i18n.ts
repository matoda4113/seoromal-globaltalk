export const locales = ['ko', 'en', 'ja'] as const;
export type Locale = typeof locales[number];

export const translations = {
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
};

export function getTranslations(locale: Locale) {
  return translations[locale] || translations.en;
}
