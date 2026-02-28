'use client';

import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';

const translations = {
  ko: {
    title: '선물 보내기',
    selectAmount: '선물할 포인트를 선택하세요',
    points: '점',
    cancel: '취소',
    send: '보내기',
    sending: '전송 중...',
  },
  en: {
    title: 'Send a Gift',
    selectAmount: 'Select points to gift',
    points: 'pts',
    cancel: 'Cancel',
    send: 'Send',
    sending: 'Sending...',
  },
  ja: {
    title: 'ギフトを送る',
    selectAmount: '贈るポイントを選択してください',
    points: 'ポイント',
    cancel: 'キャンセル',
    send: '送信',
    sending: '送信中...',
  },
};

interface GiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: () => void;
  isSending: boolean;
  selectedAmount: number | null;
  onSelectAmount: (amount: number) => void;
}

export default function GiftModal({
  isOpen,
  onClose,
  onSend,
  isSending,
  selectedAmount,
  onSelectAmount,
}: GiftModalProps) {
  const { currentLanguage } = useGlobalSettings();
  const t = translations[currentLanguage];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
        {/* 헤더 */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">🎁 {t.title}</h2>
          <p className="text-gray-400 text-sm">{t.selectAmount}</p>
        </div>

        {/* 선물 금액 선택 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[50, 100, 200, 300].map((amount) => (
            <button
              key={amount}
              onClick={() => onSelectAmount(amount)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedAmount === amount
                  ? 'border-pink-500 bg-pink-500/20 text-pink-400'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="text-3xl mb-1">🌰</div>
              <div className="text-xl font-bold">{amount}{t.points}</div>
            </button>
          ))}
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSending}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {t.cancel}
          </button>
          <button
            onClick={onSend}
            disabled={!selectedAmount || isSending}
            className="flex-1 px-4 py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isSending ? t.sending : t.send}
          </button>
        </div>
      </div>
    </div>
  );
}
