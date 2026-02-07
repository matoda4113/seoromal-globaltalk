import { type Locale } from '@/lib/i18n';

interface CommunityScreenProps {
  locale: Locale;
  t: any;
}

export default function CommunityScreen({ locale, t }: CommunityScreenProps) {
  return (
    <>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
        {t.app.nav.community}
      </h1>

      {/* Placeholder */}
      <div className="text-center py-16">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-lg font-bold text-gray-700 mb-2">
          {locale === 'ko' ? '커뮤니티' : locale === 'ja' ? 'コミュニティ' : 'Community'}
        </h2>
        <p className="text-sm text-gray-500">
          {locale === 'ko' ? '곧 만나요!' : locale === 'ja' ? '近日公開！' : 'Coming Soon'}
        </p>
      </div>
    </>
  );
}
