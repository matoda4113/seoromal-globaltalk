'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getTranslations, type Locale } from '@/lib/i18n';
import { resolveLocale, setStoredLocale } from '@/lib/locale-storage';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import authService from '@/services/auth.service';
import logger from '@/lib/logger';

const translations = {
  ko: {
    loginRequired: '로그인이 필요합니다',
    loginRequiredDesc: '마이페이지를 이용하려면 로그인이 필요합니다',
    goToLogin: '로그인하기',
    continueAsGuest: '게스트로 계속하기',
    myProfile: '내 프로필',
    accountInfo: '계정 정보',
    email: '이메일',
    nickname: '닉네임',
    bio: '자기소개',
    provider: '로그인 방법',
    ageGroup: '연령대',
    gender: '성별',
    degree: '매너 온도',
    points: '도토리',
    viewHistory: '내역 보기',
    editProfile: '프로필 수정',
    editNickname: '닉네임 수정',
    logout: '로그아웃',
    male: '남성',
    female: '여성',
    notSet: '설정 안함',
    save: '저장',
    cancel: '취소',
    nicknameRequired: '닉네임을 입력해주세요',
    updateSuccess: '수정되었습니다',
    updateFailed: '수정에 실패했습니다',
  },
  en: {
    loginRequired: 'Login Required',
    loginRequiredDesc: 'You need to login to access My Page',
    goToLogin: 'Go to Login',
    continueAsGuest: 'Continue as Guest',
    myProfile: 'My Profile',
    accountInfo: 'Account Information',
    email: 'Email',
    nickname: 'Nickname',
    bio: 'Bio',
    provider: 'Login Method',
    ageGroup: 'Age Group',
    gender: 'Gender',
    degree: 'Manner Temperature',
    points: 'Dotori',
    viewHistory: 'View History',
    editProfile: 'Edit Profile',
    editNickname: 'Edit Nickname',
    logout: 'Logout',
    male: 'Male',
    female: 'Female',
    notSet: 'Not Set',
    save: 'Save',
    cancel: 'Cancel',
    nicknameRequired: 'Please enter a nickname',
    updateSuccess: 'Updated successfully',
    updateFailed: 'Update failed',
  },
  ja: {
    loginRequired: 'ログインが必要です',
    loginRequiredDesc: 'マイページを利用するにはログインが必要です',
    goToLogin: 'ログインする',
    continueAsGuest: 'ゲストとして続ける',
    myProfile: 'マイプロフィール',
    accountInfo: 'アカウント情報',
    email: 'メール',
    nickname: 'ニックネーム',
    provider: 'ログイン方法',
    ageGroup: '年齢層',
    gender: '性別',
    degree: 'マナー温度',
    points: 'ドトリ',
    viewHistory: '履歴を見る',
    editProfile: 'プロフィール編集',
    editNickname: 'ニックネーム編集',
    logout: 'ログアウト',
    male: '男性',
    female: '女性',
    notSet: '未設定',
    save: '保存',
    cancel: 'キャンセル',
    nicknameRequired: 'ニックネームを入力してください',
    updateSuccess: '更新されました',
    updateFailed: '更新に失敗しました',
  },
};

export default function MyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuth();
  const [locale, setLocale] = useState<Locale>('en');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [ageGroup, setAgeGroup] = useState<number | null>(null);
  const [gender, setGender] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const langParam = searchParams.get('lang');
    const resolvedLocale = resolveLocale(langParam);
    setLocale(resolvedLocale);
    setStoredLocale(resolvedLocale);
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setBio(user.bio || '');
      setAgeGroup(user.age_group || null);
      setGender(user.gender || '');
    }
  }, [user]);

  const t = getTranslations(locale);
  const myPageT = translations[locale];

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setStoredLocale(newLocale);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', newLocale);
    window.history.replaceState({}, '', url);
  };

  const handleGoToLogin = () => {
    router.push(`/login?lang=${locale}`);
  };

  const handleContinueAsGuest = () => {
    router.push(`/app?lang=${locale}`);
  };

  const handleLogout = async () => {
    if (confirm(locale === 'ko' ? '로그아웃하시겠습니까?' : locale === 'ja' ? 'ログアウトしますか？' : 'Do you want to logout?')) {
      await logout();
    }
  };

  const handleSaveNickname = async () => {
    if (!nickname.trim()) {
      alert(myPageT.nicknameRequired);
      return;
    }

    try {
      setIsSaving(true);
      await authService.updateNickname(nickname.trim(), undefined);
      await refreshUser();
      setIsEditingNickname(false);
      alert(myPageT.updateSuccess);
    } catch (error) {
      logger.error('Failed to update nickname:', error);
      alert(myPageT.updateFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBio = async () => {
    try {
      setIsSaving(true);
      await authService.updateNickname(undefined, bio);
      await refreshUser();
      setIsEditingBio(false);
      alert(myPageT.updateSuccess);
    } catch (error) {
      logger.error('Failed to update bio:', error);
      alert(myPageT.updateFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      await authService.updateProfile({
        age_group: ageGroup,
        gender: gender || null,
      });
      await refreshUser();
      setIsEditingProfile(false);
      alert(myPageT.updateSuccess);
    } catch (error) {
      logger.error('Failed to update profile:', error);
      alert(myPageT.updateFailed);
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
    if (!gender) return myPageT.notSet;
    return gender === 'man' ? myPageT.male : myPageT.female;
  };

  const getAgeGroupText = (ageGroup: number | null | undefined) => {
    if (!ageGroup) return myPageT.notSet;
    return `${ageGroup}${locale === 'ko' ? '대' : locale === 'ja' ? '代' : 's'}`;
  };

  const getDegreeColor = (degree: number | undefined) => {
    if (!degree) return 'text-gray-400';
    if (degree >= 40) return 'text-red-500';
    if (degree >= 37) return 'text-orange-500';
    return 'text-blue-500';
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
        <Header locale={locale} onLocaleChange={handleLocaleChange} />

        <main className="px-4 py-6 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 140px)' }}>
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">{myPageT.loginRequired}</h2>
              <p className="text-gray-600 mb-8">{myPageT.loginRequiredDesc}</p>

              <div className="space-y-3">
                <button
                  onClick={handleGoToLogin}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors active:scale-95"
                >
                  {myPageT.goToLogin}
                </button>

                <button
                  onClick={handleContinueAsGuest}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors active:scale-95"
                >
                  {myPageT.continueAsGuest}
                </button>
              </div>
            </div>
          </div>
        </main>

        <BottomNav
          locale={locale}
          homeText={t.app.nav.home}
          communityText={t.app.nav.community}
          mypageText={t.app.nav.mypage}
        />
      </div>
    );
  }

  // 로그인한 경우
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      <Header locale={locale} onLocaleChange={handleLocaleChange} />

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {/* 프로필 헤더 카드 */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-xl p-6 mb-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white/30">
              {user?.nickname?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{user?.nickname || 'User'}</h2>
              <p className="text-sm text-white/80">{user?.email}</p>
            </div>
          </div>

          {/* 매너 온도 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{myPageT.degree}</span>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.06 1.06l1.06 1.06z" />
                </svg>
                <span className="text-2xl font-bold">{user?.degree ? Number(user.degree).toFixed(1) : '36.5'}°C</span>
              </div>
            </div>
            <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${Math.min((((user?.degree ? Number(user.degree) : 36.5) - 30) / 10) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* 포인트 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{myPageT.points}</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌰</span>
                  <span className="text-2xl font-bold">{user?.points?.toLocaleString() || '0'}</span>
                </div>
                <button
                  onClick={() => router.push(`/app/points-history?lang=${locale}`)}
                  className="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  {myPageT.viewHistory}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 자기소개 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">{myPageT.bio}</h3>
            <button
              onClick={() => setIsEditingBio(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>

          <div className="text-sm text-gray-700 leading-relaxed line-clamp-3">
            {user?.bio || (
              <span className="text-gray-400 italic">{myPageT.notSet}</span>
            )}
          </div>
        </div>

        {/* 계정 정보 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{myPageT.accountInfo}</h3>

          {/* 닉네임 */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">{myPageT.nickname}</span>
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
                  {myPageT.save}
                </button>
                <button
                  onClick={() => {
                    setIsEditingNickname(false);
                    setNickname(user?.nickname || '');
                  }}
                  disabled={isSaving}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  {myPageT.cancel}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{user?.nickname || myPageT.notSet}</span>
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
            <span className="text-sm font-medium text-gray-600">{myPageT.email}</span>
            <span className="text-sm font-semibold text-gray-900">{user?.email}</span>
          </div>

          {/* 로그인 방법 */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">{myPageT.provider}</span>
            <span className="text-sm font-semibold text-gray-900">{getProviderName(user?.provider || '')}</span>
          </div>

          {/* 연령대 */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">{myPageT.ageGroup}</span>
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
              <span className="text-sm font-semibold text-gray-900">{getAgeGroupText(user?.age_group)}</span>
            )}
          </div>

          {/* 성별 */}
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-gray-600">{myPageT.gender}</span>
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
                  {myPageT.male}
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
                  {myPageT.female}
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
                  {myPageT.notSet}
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
                {myPageT.save}
              </button>
              <button
                onClick={() => {
                  setIsEditingProfile(false);
                  setAgeGroup(user?.age_group || null);
                  setGender(user?.gender || '');
                }}
                disabled={isSaving}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors active:scale-95 disabled:opacity-50"
              >
                {myPageT.cancel}
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
              {myPageT.editProfile}
            </button>
          )}
        </div>

        {/* 로그아웃 버튼 */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-100 transition-colors active:scale-95 border border-red-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {myPageT.logout}
        </button>
      </main>

      <BottomNav
        locale={locale}
        homeText={t.app.nav.home}
        communityText={t.app.nav.community}
        mypageText={t.app.nav.mypage}
      />

      {/* 자기소개 수정 모달 */}
      {isEditingBio && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{myPageT.bio}</h2>
              <button
                onClick={() => {
                  setIsEditingBio(false);
                  setBio(user?.bio || '');
                }}
                disabled={isSaving}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-160px)]">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isSaving}
                rows={12}
                maxLength={500}
                placeholder={myPageT.bio}
                autoFocus
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-gray-500">{bio.length}/500</span>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsEditingBio(false);
                  setBio(user?.bio || '');
                }}
                disabled={isSaving}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {myPageT.cancel}
              </button>
              <button
                onClick={handleSaveBio}
                disabled={isSaving}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {myPageT.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
