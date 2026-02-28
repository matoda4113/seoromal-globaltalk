'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import authService from '@/services/auth.service';
import { getCountryName } from '@/lib/countries';

const translations = {
  ko: {
    accountInfo: '계정 정보',
    email: '이메일',
    nickname: '닉네임',
    provider: '로그인 방법',
    country: '국가',
    ageGroup: '연령대',
    gender: '성별',
    male: '남성',
    female: '여성',
    notSet: '설정 안함',
    save: '저장',
    cancel: '취소',
    editProfile: '프로필 수정',
    updateSuccess: '수정되었습니다',
    updateFailed: '수정에 실패했습니다',
    nicknameRequired: '닉네임을 입력해주세요',
  },
  en: {
    accountInfo: 'Account Information',
    email: 'Email',
    nickname: 'Nickname',
    provider: 'Login Method',
    country: 'Country',
    ageGroup: 'Age Group',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    notSet: 'Not Set',
    save: 'Save',
    cancel: 'Cancel',
    editProfile: 'Edit Profile',
    updateSuccess: 'Updated successfully',
    updateFailed: 'Update failed',
    nicknameRequired: 'Please enter a nickname',
  },
  ja: {
    accountInfo: 'アカウント情報',
    email: 'メール',
    nickname: 'ニックネーム',
    provider: 'ログイン方法',
    country: '国',
    ageGroup: '年齢層',
    gender: '性別',
    male: '男性',
    female: '女性',
    notSet: '未設定',
    save: '保存',
    cancel: 'キャンセル',
    editProfile: 'プロフィール編集',
    updateSuccess: '更新されました',
    updateFailed: '更新に失敗しました',
    nicknameRequired: 'ニックネームを入力してください',
  },
};

export default function AccountInfoCard() {
  const { user, refreshUser } = useAuth();
  const { currentLanguage } = useGlobalSettings();
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nickname, setNickname] = useState('');
  const [ageGroup, setAgeGroup] = useState<number | null>(null);
  const [gender, setGender] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const t = translations[currentLanguage];

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setAgeGroup(user.ageGroup || null);
      setGender(user.gender || '');
    }
  }, [user]);

  const handleSaveNickname = async () => {
    if (!nickname.trim()) {
      alert(t.nicknameRequired);
      return;
    }

    setIsSaving(true);
    try {
      await authService.updateNickname(nickname.trim(), undefined);
      await refreshUser();
      setIsEditingNickname(false);
      alert(t.updateSuccess);
    } catch (error) {
      alert(t.updateFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await authService.updateProfile({
        age_group: ageGroup,
        gender: gender || null,
      });
      await refreshUser();
      setIsEditingProfile(false);
      alert(t.updateSuccess);
    } catch (error) {
      alert(t.updateFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const getProviderName = (provider: string) => {
    const names: { [key: string]: string } = {
      google: 'Google',
      kakao: 'Kakao',
      line: 'LINE',
      apple: 'Apple',
      email: 'Email',
    };
    return names[provider] || provider;
  };

  const getGenderText = (gender: string | null | undefined) => {
    if (!gender) return t.notSet;
    return gender === 'man' ? t.male : t.female;
  };

  const getAgeGroupText = (ageGroup: number | null | undefined) => {
    if (!ageGroup) return t.notSet;
    return `${ageGroup}${currentLanguage === 'ko' ? '대' : currentLanguage === 'ja' ? '代' : 's'}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{t.accountInfo}</h3>

      {/* 닉네임 */}
      <div className="flex items-center justify-between py-3 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-600">{t.nickname}</span>
        {isEditingNickname ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSaving}
            />
            <button
              onClick={handleSaveNickname}
              disabled={isSaving}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {t.save}
            </button>
            <button
              onClick={() => {
                setIsEditingNickname(false);
                setNickname(user?.nickname || '');
              }}
              disabled={isSaving}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              {t.cancel}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{user?.nickname || t.notSet}</span>
            <button
              onClick={() => setIsEditingNickname(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* 이메일 */}
      <div className="flex items-center justify-between py-3 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-600">{t.email}</span>
        <span className="text-sm font-semibold text-gray-900">{user?.email}</span>
      </div>

      {/* 로그인 방법 */}
      <div className="flex items-center justify-between py-3 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-600">{t.provider}</span>
        <span className="text-sm font-semibold text-gray-900">{getProviderName(user?.provider || '')}</span>
      </div>

      {/* 국가 */}
      <div className="flex items-center justify-between py-3 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-600">{t.country}</span>
        <span className="text-sm font-semibold text-gray-900">{getCountryName(user?.country, currentLanguage, t.notSet)}</span>
      </div>

      {/* 연령대 */}
      <div className="flex items-center justify-between py-3 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-600">{t.ageGroup}</span>
        {isEditingProfile ? (
          <div className="flex gap-2">
            {[10, 20, 30, 40, 50, 60].map((age) => (
              <button
                key={age}
                onClick={() => setAgeGroup(age)}
                className={`px-3 py-1 text-sm rounded-lg transition-all ${
                  ageGroup === age
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={isSaving}
              >
                {age}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-sm font-semibold text-gray-900">{getAgeGroupText(user?.ageGroup)}</span>
        )}
      </div>

      {/* 성별 */}
      <div className="flex items-center justify-between py-3">
        <span className="text-sm font-medium text-gray-600">{t.gender}</span>
        {isEditingProfile ? (
          <div className="flex gap-2">
            <button
              onClick={() => setGender('man')}
              className={`px-3 py-1 text-sm rounded-lg transition-all ${
                gender === 'man'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isSaving}
            >
              {t.male}
            </button>
            <button
              onClick={() => setGender('woman')}
              className={`px-3 py-1 text-sm rounded-lg transition-all ${
                gender === 'woman'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isSaving}
            >
              {t.female}
            </button>
            <button
              onClick={() => setGender('')}
              className={`px-3 py-1 text-sm rounded-lg transition-all ${
                gender === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isSaving}
            >
              {t.notSet}
            </button>
          </div>
        ) : (
          <span className="text-sm font-semibold text-gray-900">{getGenderText(user?.gender)}</span>
        )}
      </div>

      {/* 프로필 수정 버튼 */}
      {isEditingProfile ? (
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors active:scale-95 disabled:opacity-50"
          >
            {t.save}
          </button>
          <button
            onClick={() => {
              setIsEditingProfile(false);
              setAgeGroup(user?.ageGroup || null);
              setGender(user?.gender || '');
            }}
            disabled={isSaving}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors active:scale-95 disabled:opacity-50"
          >
            {t.cancel}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsEditingProfile(true)}
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors active:scale-95 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          {t.editProfile}
        </button>
      )}
    </div>
  );
}
