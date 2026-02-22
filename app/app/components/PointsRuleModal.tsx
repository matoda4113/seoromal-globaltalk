interface PointsRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: 'ko' | 'en' | 'ja';
  roomType?: 'audio' | 'video';
}

const translations = {
  ko: {
    title: '포인트 룰 안내',
    audioMode: '오디오 모드',
    videoMode: '비디오 모드',
    baseCharge: '기본 요금',
    perMinuteCharge: '분당 요금',
    minimumTime: '최소 시간',
    audioBaseCharge: '10 도토리',
    audioPerMinute: '1 도토리/분',
    videoBaseCharge: '40 도토리',
    videoPerMinute: '4 도토리/분',
    minimumTimeDesc: '10분 (10분 미만 퇴장 시에도 기본 요금 적용)',
    hostRules: '호스트 규칙',
    hostRule1: '최소 10분간 응대해야 합니다.',
    hostRule2: '10분 미만 퇴장 시 패널티가 부과됩니다.',
    hostRule3: '게스트가 없는 경우 언제든지 퇴장 가능합니다.',
    guestRules: '게스트 규칙',
    guestRule1: '15초 이내에 퇴장하면 요금이 발생하지 않습니다.',
    guestRule2: '입장 시 기본 요금이 바로 차감됩니다.',
    guestRule3: '1분마다 추가 요금이 자동 차감됩니다.',
    guestRule4: '잔액이 부족하면 자동으로 퇴장됩니다.',
    guestRule5: '10분 미만 퇴장 시에도 기본 요금은 환불되지 않습니다.',
    guestRule6: '10분 이내에 방장이 먼저 나가는 경우 포인트를 차감하지 않습니다.',
    giftSystem: '선물 시스템',
    giftDesc1: '게스트는 호스트에게 도토리를 선물할 수 있습니다.',
    giftDesc2: '선물한 도토리는 호스트의 잔액으로 적립됩니다.',
    ratingSystem: '평점 시스템',
    ratingDesc1: '10분 이상 대화 후 평점을 남기면 도토리를 받을 수 있습니다.',
    ratingDesc2: '좋은 평점을 유지하면 더 많은 사람들이 방에 입장합니다.',
    close: '닫기',
  },
  en: {
    title: 'Points Rules Guide',
    audioMode: 'Audio Mode',
    videoMode: 'Video Mode',
    baseCharge: 'Base Charge',
    perMinuteCharge: 'Per Minute',
    minimumTime: 'Minimum Time',
    audioBaseCharge: '10 Acorns',
    audioPerMinute: '1 Acorn/min',
    videoBaseCharge: '40 Acorns',
    videoPerMinute: '4 Acorns/min',
    minimumTimeDesc: '10 minutes (Base charge applies even if leaving before 10 min)',
    hostRules: 'Host Rules',
    hostRule1: 'Must attend for at least 10 minutes.',
    hostRule2: 'Penalty applied if leaving before 10 minutes.',
    hostRule3: 'Can leave anytime if no guest is present.',
    guestRules: 'Guest Rules',
    guestRule1: 'No charge if you leave within 15 seconds.',
    guestRule2: 'Base charge is deducted immediately upon entry.',
    guestRule3: 'Additional charge is deducted every minute.',
    guestRule4: 'Automatically removed if balance runs out.',
    guestRule5: 'Base charge is not refunded even if leaving before 10 min.',
    guestRule6: 'No charge if the host leaves first within 10 minutes.',
    giftSystem: 'Gift System',
    giftDesc1: 'Guests can send acorns to hosts as gifts.',
    giftDesc2: 'Gifted acorns are added to the host\'s balance.',
    ratingSystem: 'Rating System',
    ratingDesc1: 'Earn acorns by leaving a rating after 10+ min conversation.',
    ratingDesc2: 'Good ratings attract more people to your room.',
    close: 'Close',
  },
  ja: {
    title: 'ポイントルールガイド',
    audioMode: 'オーディオモード',
    videoMode: 'ビデオモード',
    baseCharge: '基本料金',
    perMinuteCharge: '分あたり',
    minimumTime: '最小時間',
    audioBaseCharge: '10どんぐり',
    audioPerMinute: '1どんぐり/分',
    videoBaseCharge: '40どんぐり',
    videoPerMinute: '4どんぐり/分',
    minimumTimeDesc: '10分（10分未満で退出しても基本料金が適用されます）',
    hostRules: 'ホストルール',
    hostRule1: '最低10分間は対応する必要があります。',
    hostRule2: '10分未満で退出するとペナルティが課されます。',
    hostRule3: 'ゲストがいない場合はいつでも退出できます。',
    guestRules: 'ゲストルール',
    guestRule1: '15秒以内に退出すれば料金は発生しません。',
    guestRule2: '入室時に基本料金がすぐに差し引かれます。',
    guestRule3: '1分ごとに追加料金が自動的に差し引かれます。',
    guestRule4: '残高が不足すると自動的に退出されます。',
    guestRule5: '10分未満で退出しても基本料金は返金されません。',
    guestRule6: '10分以内にホストが先に退出した場合、ポイントは差し引かれません。',
    giftSystem: 'ギフトシステム',
    giftDesc1: 'ゲストはホストにどんぐりをプレゼントできます。',
    giftDesc2: 'プレゼントしたどんぐりはホストの残高に追加されます。',
    ratingSystem: '評価システム',
    ratingDesc1: '10分以上の会話後に評価を残すとどんぐりがもらえます。',
    ratingDesc2: '良い評価を維持すると、より多くの人が部屋に入室します。',
    close: '閉じる',
  },
};

export default function PointsRuleModal({ isOpen, onClose, locale, roomType }: PointsRuleModalProps) {
  const t = translations[locale];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">{t.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Pricing Table */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">💰</span>
              {t.baseCharge} & {t.perMinuteCharge}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Audio Mode */}
              <div className={`bg-white rounded-lg p-4 border-2 ${roomType === 'audio' ? 'border-blue-500 shadow-lg' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  <h4 className="font-bold text-gray-800">{t.audioMode}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.baseCharge}:</span>
                    <span className="font-bold text-blue-600">{t.audioBaseCharge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.perMinuteCharge}:</span>
                    <span className="font-bold text-blue-600">{t.audioPerMinute}</span>
                  </div>
                </div>
              </div>

              {/* Video Mode */}
              <div className={`bg-white rounded-lg p-4 border-2 ${roomType === 'video' ? 'border-purple-500 shadow-lg' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  <h4 className="font-bold text-gray-800">{t.videoMode}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.baseCharge}:</span>
                    <span className="font-bold text-purple-600">{t.videoBaseCharge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.perMinuteCharge}:</span>
                    <span className="font-bold text-purple-600">{t.videoPerMinute}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-xl">⏱️</span>
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{t.minimumTime}</div>
                  <div className="text-xs text-gray-600 mt-1">{t.minimumTimeDesc}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Host Rules */}
          <div className="bg-green-50 rounded-xl p-5 border border-green-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">👑</span>
              {t.hostRules}
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>{t.hostRule1}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>{t.hostRule2}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>{t.hostRule3}</span>
              </li>
            </ul>
          </div>

          {/* Guest Rules */}
          <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">👤</span>
              {t.guestRules}
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-orange-600 mt-0.5">✓</span>
                <span>{t.guestRule1}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-orange-600 mt-0.5">✓</span>
                <span>{t.guestRule2}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-orange-600 mt-0.5">✓</span>
                <span>{t.guestRule3}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-orange-600 mt-0.5">✓</span>
                <span>{t.guestRule4}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-orange-600 mt-0.5">✓</span>
                <span>{t.guestRule5}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-orange-600 mt-0.5">✓</span>
                <span>{t.guestRule6}</span>
              </li>
            </ul>
          </div>

          {/* Gift System */}
          <div className="bg-pink-50 rounded-xl p-5 border border-pink-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">🎁</span>
              {t.giftSystem}
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-pink-600 mt-0.5">✓</span>
                <span>{t.giftDesc1}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-pink-600 mt-0.5">✓</span>
                <span>{t.giftDesc2}</span>
              </li>
            </ul>
          </div>

          {/* Rating System */}
          <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              {t.ratingSystem}
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-purple-600 mt-0.5">✓</span>
                <span>{t.ratingDesc1}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-purple-600 mt-0.5">✓</span>
                <span>{t.ratingDesc2}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
