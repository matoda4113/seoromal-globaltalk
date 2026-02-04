'use client';

import { useState } from 'react';
import { type Locale } from '@/lib/i18n';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (roomData: {
    title: string;
    topic: string;
    roomType: 'voice' | 'video';
    maxParticipants: number;
    isPrivate: boolean;
    password?: string;
  }) => void;
  locale: Locale;
}

const translations = {
  ko: {
    title: '방 만들기',
    roomTitle: '방 제목',
    roomTitlePlaceholder: '방 제목을 입력하세요',
    topic: '주제',
    roomType: '방 타입',
    voice: '음성',
    video: '화상',
    visibility: '공개 설정',
    public: '공개',
    private: '비공개',
    password: '비밀번호',
    passwordPlaceholder: '비밀번호를 입력하세요',
    cancel: '취소',
    create: '방 만들기',
    required: '필수 항목입니다',
    passwordRequired: '비공개 방은 비밀번호가 필요합니다',
    topics: {
      free: '자유',
      romance: '연애',
      hobby: '취미',
      business: '비즈니스',
      travel: '여행',
    },
  },
  en: {
    title: 'Create Room',
    roomTitle: 'Room Title',
    roomTitlePlaceholder: 'Enter room title',
    topic: 'Topic',
    roomType: 'Room Type',
    voice: 'Voice',
    video: 'Video',
    visibility: 'Visibility',
    public: 'Public',
    private: 'Private',
    password: 'Password',
    passwordPlaceholder: 'Enter password',
    cancel: 'Cancel',
    create: 'Create Room',
    required: 'This field is required',
    passwordRequired: 'Private rooms require a password',
    topics: {
      free: 'Free Talk',
      romance: 'Romance',
      hobby: 'Hobby',
      business: 'Business',
      travel: 'Travel',
    },
  },
  ja: {
    title: 'ルーム作成',
    roomTitle: 'ルーム名',
    roomTitlePlaceholder: 'ルーム名を入力',
    topic: 'トピック',
    roomType: 'ルームタイプ',
    voice: '音声',
    video: 'ビデオ',
    visibility: '公開設定',
    public: '公開',
    private: '非公開',
    password: 'パスワード',
    passwordPlaceholder: 'パスワードを入力',
    cancel: 'キャンセル',
    create: 'ルーム作成',
    required: '必須項目です',
    passwordRequired: '非公開ルームにはパスワードが必要です',
    topics: {
      free: '自由',
      romance: '恋愛',
      hobby: '趣味',
      business: 'ビジネス',
      travel: '旅行',
    },
  },
};

export default function CreateRoomModal({
  isOpen,
  onClose,
  onCreate,
  locale,
}: CreateRoomModalProps) {
  const [roomTitle, setRoomTitle] = useState('');
  const [topic, setTopic] = useState<'free' | 'romance' | 'hobby' | 'business' | 'travel'>('free');
  const [roomType, setRoomType] = useState<'voice' | 'video'>('voice');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const t = translations[locale];

  const handleSubmit = () => {
    const newErrors: { [key: string]: string } = {};

    // 방 제목 검증
    if (!roomTitle.trim()) {
      newErrors.roomTitle = t.required;
    }

    // 비공개 방인 경우 비밀번호 검증
    if (isPrivate && !password.trim()) {
      newErrors.password = t.passwordRequired;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 방 생성 (참여인원 2명 고정)
    onCreate({
      title: roomTitle.trim(),
      topic: topic.trim(),
      roomType,
      maxParticipants: 2,
      isPrivate,
      password: isPrivate ? password.trim() : undefined,
    });

    // 폼 초기화
    handleClose();
  };

  const handleClose = () => {
    setRoomTitle('');
    setTopic('free');
    setRoomType('voice');
    setIsPrivate(false);
    setPassword('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 바디 */}
        <div className="p-6 space-y-5">
          {/* 방 제목 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.roomTitle} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={roomTitle}
              onChange={(e) => {
                setRoomTitle(e.target.value);
                if (errors.roomTitle) {
                  setErrors({ ...errors, roomTitle: '' });
                }
              }}
              placeholder={t.roomTitlePlaceholder}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.roomTitle ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={50}
            />
            {errors.roomTitle && (
              <p className="mt-1 text-sm text-red-500">{errors.roomTitle}</p>
            )}
          </div>

          {/* 주제 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.topic}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTopic('free')}
                className={`py-2.5 px-3 rounded-lg font-medium transition-colors text-sm ${
                  topic === 'free'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.topics.free}
              </button>
              <button
                type="button"
                onClick={() => setTopic('romance')}
                className={`py-2.5 px-3 rounded-lg font-medium transition-colors text-sm ${
                  topic === 'romance'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.topics.romance}
              </button>
              <button
                type="button"
                onClick={() => setTopic('hobby')}
                className={`py-2.5 px-3 rounded-lg font-medium transition-colors text-sm ${
                  topic === 'hobby'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.topics.hobby}
              </button>
              <button
                type="button"
                onClick={() => setTopic('business')}
                className={`py-2.5 px-3 rounded-lg font-medium transition-colors text-sm ${
                  topic === 'business'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.topics.business}
              </button>
              <button
                type="button"
                onClick={() => setTopic('travel')}
                className={`py-2.5 px-3 rounded-lg font-medium transition-colors text-sm col-span-2 ${
                  topic === 'travel'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.topics.travel}
              </button>
            </div>
          </div>

          {/* 방 타입 (음성/화상) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.roomType}
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRoomType('voice')}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  roomType === 'voice'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                {t.voice}
              </button>
              <button
                type="button"
                onClick={() => setRoomType('video')}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  roomType === 'video'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t.video}
              </button>
            </div>
          </div>

          {/* 공개/비공개 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.visibility}
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsPrivate(false);
                  setPassword('');
                  if (errors.password) {
                    setErrors({ ...errors, password: '' });
                  }
                }}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  !isPrivate
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.public}
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  isPrivate
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.private}
              </button>
            </div>
          </div>

          {/* 비밀번호 (비공개일 때만) */}
          {isPrivate && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.password} <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors({ ...errors, password: '' });
                  }
                }}
                placeholder={t.passwordPlaceholder}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={20}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors active:scale-95"
          >
            {t.create}
          </button>
        </div>
      </div>
    </div>
  );
}
