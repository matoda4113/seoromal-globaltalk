'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/logger';

type Locale = 'ko' | 'en' | 'ja';

const translations = {
  ko: {
    title: '추가 정보 입력',
    subtitle: '서로말을 시작하기 전에 몇 가지 정보를 알려주세요',
    nickname: '닉네임',
    nicknamePlaceholder: '닉네임을 입력하세요',
    nicknameRequired: '닉네임은 필수입니다',
    gender: '성별',
    male: '남성',
    female: '여성',
    notSet: '선택 안함',
    ageGroup: '연령대',
    country: '국가',
    korea: '한국',
    japan: '일본',
    usa: '미국',
    complete: '완료',
    skip: '나중에 하기',
  },
  en: {
    title: 'Additional Information',
    subtitle: 'Please tell us a few things before starting',
    nickname: 'Nickname',
    nicknamePlaceholder: 'Enter your nickname',
    nicknameRequired: 'Nickname is required',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    notSet: 'Not Set',
    ageGroup: 'Age Group',
    country: 'Country',
    korea: 'Korea',
    japan: 'Japan',
    usa: 'USA',
    complete: 'Complete',
    skip: 'Skip for now',
  },
  ja: {
    title: '追加情報入力',
    subtitle: '始める前にいくつかの情報を教えてください',
    nickname: 'ニックネーム',
    nicknamePlaceholder: 'ニックネームを入力',
    nicknameRequired: 'ニックネームは必須です',
    gender: '性別',
    male: '男性',
    female: '女性',
    notSet: '選択しない',
    ageGroup: '年齢層',
    country: '国',
    korea: '韓国',
    japan: '日本',
    usa: 'アメリカ',
    complete: '完了',
    skip: '後で',
  },
};

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [locale, setLocale] = useState<Locale>('ko');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<string>('');
  const [ageGroup, setAgeGroup] = useState<number | null>(null);
  const [country, setCountry] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const lang = searchParams.get('lang') as Locale;
    if (lang && ['ko', 'en', 'ja'].includes(lang)) {
      setLocale(lang);
    }

    // 사용자 정보 미리 채우기
    if (user) {
      setNickname(user.nickname || '');
      setGender(user.gender || '');
      setAgeGroup(user.age_group || null);
    }
  }, [searchParams, user]);

  const t = translations[locale];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      alert(t.nicknameRequired);
      return;
    }

    try {
      setIsSubmitting(true);

      // TODO: API 호출하여 프로필 업데이트
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          nickname: nickname.trim(),
          gender: gender || null,
          age_group: ageGroup,
          country: country || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      logger.info('Profile updated successfully');
      await refreshUser();

      router.push(`/app?lang=${locale}`);
    } catch (error) {
      logger.error('Failed to update profile:', error);
      alert('프로필 업데이트에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push(`/app?lang=${locale}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 닉네임 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.nickname} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t.nicknamePlaceholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.gender}</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setGender('man')}
                className={`py-3 rounded-lg font-medium transition-all ${
                  gender === 'man'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.male}
              </button>
              <button
                type="button"
                onClick={() => setGender('woman')}
                className={`py-3 rounded-lg font-medium transition-all ${
                  gender === 'woman'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.female}
              </button>
              <button
                type="button"
                onClick={() => setGender('')}
                className={`py-3 rounded-lg font-medium transition-all ${
                  gender === ''
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.notSet}
              </button>
            </div>
          </div>

          {/* 연령대 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.ageGroup}</label>
            <div className="grid grid-cols-3 gap-3">
              {[10, 20, 30, 40, 50, 60].map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() => setAgeGroup(age)}
                  className={`py-3 rounded-lg font-medium transition-all ${
                    ageGroup === age
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {age}
                  {locale === 'ko' ? '대' : locale === 'ja' ? '代' : 's'}
                </button>
              ))}
            </div>
          </div>

          {/* 국가 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.country}</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setCountry('KR')}
                className={`py-3 rounded-lg font-medium transition-all ${
                  country === 'KR'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.korea}
              </button>
              <button
                type="button"
                onClick={() => setCountry('JP')}
                className={`py-3 rounded-lg font-medium transition-all ${
                  country === 'JP'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.japan}
              </button>
              <button
                type="button"
                onClick={() => setCountry('US')}
                className={`py-3 rounded-lg font-medium transition-all ${
                  country === 'US'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.usa}
              </button>
            </div>
          </div>

          {/* 완료 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '...' : t.complete}
          </button>

          {/* 나중에 하기 */}
          <button
            type="button"
            onClick={handleSkip}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            {t.skip}
          </button>
        </form>
      </div>
    </div>
  );
}
