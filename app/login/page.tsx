'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import authService from '@/services/auth.service';
import logger from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

const translations = {
  ko: {
    title: '로그인',
    subtitle: '서로말에 오신 것을 환영합니다',
    email: '이메일',
    password: '비밀번호',
    nickname: '닉네임',
    loginButton: '로그인',
    signupButton: '회원가입',
    noAccount: '계정이 없으신가요?',
    hasAccount: '이미 계정이 있으신가요?',
    signUp: '회원가입',
    login: '로그인',
    or: '또는',
    continueAsGuest: '게스트로 계속하기',
    googleLogin: 'Google로 계속하기',
    kakaoLogin: 'Kakao로 계속하기',
    lineLogin: 'LINE으로 계속하기',
    errors: {
      emailAlreadyExistsEmail: '이미 가입된 이메일입니다. 로그인해주세요.',
      emailAlreadyExistsGoogle: '이미 Google로 가입된 이메일입니다. Google 로그인을 이용해주세요.',
      emailAlreadyExistsKakao: '이미 Kakao로 가입된 이메일입니다. Kakao 로그인을 이용해주세요.',
      emailAlreadyExistsOther: '이미 {provider}로 가입된 이메일입니다. {provider} 로그인을 이용해주세요.',
      invalidCredentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
      signupFailed: '회원가입에 실패했습니다.',
      loginFailed: '로그인에 실패했습니다.',
      allFieldsRequired: '모든 필드를 입력해주세요.',
    },
  },
  en: {
    title: 'Login',
    subtitle: 'Welcome to 서로말',
    email: 'Email',
    password: 'Password',
    nickname: 'Nickname',
    loginButton: 'Login',
    signupButton: 'Sign Up',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    signUp: 'Sign Up',
    login: 'Login',
    or: 'or',
    continueAsGuest: 'Continue as Guest',
    googleLogin: 'Continue with Google',
    kakaoLogin: 'Continue with Kakao',
    lineLogin: 'Continue with LINE',
    errors: {
      emailAlreadyExistsEmail: 'Email already registered. Please login.',
      emailAlreadyExistsGoogle: 'Email already registered with Google. Please use Google login.',
      emailAlreadyExistsKakao: 'Email already registered with Kakao. Please use Kakao login.',
      emailAlreadyExistsOther: 'Email already registered with {provider}. Please use {provider} login.',
      invalidCredentials: 'Invalid email or password.',
      signupFailed: 'Sign up failed.',
      loginFailed: 'Login failed.',
      allFieldsRequired: 'Please fill in all fields.',
    },
  },
  ja: {
    title: 'ログイン',
    subtitle: '서로말へようこそ',
    email: 'メール',
    password: 'パスワード',
    nickname: 'ニックネーム',
    loginButton: 'ログイン',
    signupButton: '新規登録',
    noAccount: 'アカウントをお持ちでないですか？',
    hasAccount: 'すでにアカウントをお持ちですか？',
    signUp: '新規登録',
    login: 'ログイン',
    or: 'または',
    continueAsGuest: 'ゲストとして続ける',
    googleLogin: 'Googleで続ける',
    kakaoLogin: 'Kakaoで続ける',
    lineLogin: 'LINEで続ける',
    errors: {
      emailAlreadyExistsEmail: 'すでに登録されているメールアドレスです。ログインしてください。',
      emailAlreadyExistsGoogle: 'すでにGoogleで登録されているメールアドレスです。Googleログインをご利用ください。',
      emailAlreadyExistsKakao: 'すでにKakaoで登録されているメールアドレスです。Kakaoログインをご利用ください。',
      emailAlreadyExistsOther: 'すでに{provider}で登録されているメールアドレスです。{provider}ログインをご利用ください。',
      invalidCredentials: 'メールアドレスまたはパスワードが正しくありません。',
      signupFailed: '新規登録に失敗しました。',
      loginFailed: 'ログインに失敗しました。',
      allFieldsRequired: 'すべてのフィールドを入力してください。',
    },
  },
};

type Locale = 'ko' | 'en' | 'ja';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const [locale, setLocale] = useState<Locale>('ko');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    const lang = searchParams.get('lang') as Locale;
    if (lang && ['ko', 'en', 'ja'].includes(lang)) {
      setLocale(lang);
    }
  }, [searchParams]);

  const t = translations[locale];

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', newLocale);
    window.history.pushState({}, '', url);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        logger.info('Google login success, access token received');

        const result = await authService.socialLogin('google', tokenResponse.access_token);

        // AuthContext에 사용자 정보 저장
        login(result.data.userInfo);

        logger.info('Login successful, redirecting...');

        // 201: 신규가입 → 추가정보 입력 페이지
        // 200: 기존 로그인 → 메인 앱
        if (result.status === 201) {
          router.push(`/onboarding?lang=${locale}`);
        } else {
          router.push(`/app?lang=${locale}`);
        }
      } catch (error) {
        logger.error('Google login error:', error);
        alert('로그인에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      logger.error('Google login failed:', error);
      alert('Google 로그인에 실패했습니다.');
    },
    flow: 'implicit',
  });

  const handleKakaoLogin = () => {
    const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || '8f9c9a8fa2585db6084c6e93f07a8e0a';
    const REDIRECT_URI = `${window.location.origin}/auth/kakao/callback`;
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

    window.location.href = kakaoAuthUrl;
  };

  const handleLineLogin = () => {
    alert('LINE 로그인은 준비 중입니다.');
  };

  const handleAppleLogin = () => {
    alert('Apple 로그인은 준비 중입니다.');
  };

  const handleEmailButtonClick = () => {
    setShowEmailForm(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || (isSignup && !nickname)) {
      alert(t.errors.allFieldsRequired);
      return;
    }

    try {
      setIsLoading(true);

      let result;
      if (isSignup) {
        result = await authService.emailRegister(email, password, nickname);
        logger.info('Email signup successful');
      } else {
        result = await authService.emailLogin(email, password);
        logger.info('Email login successful');
      }

      // AuthContext에 사용자 정보 저장
      login(result.data.userInfo);

      // 201: 신규가입 → 추가정보 입력 페이지
      // 200: 기존 로그인 → 메인 앱
      if (result.status === 201) {
        router.push(`/onboarding?lang=${locale}`);
      } else {
        router.push(`/app?lang=${locale}`);
      }
    } catch (error: any) {
      logger.error('Email auth error:', error);

      // 에러 응답에서 메시지 추출
      const errorData = error?.response?.data;
      const errorCode = errorData?.error;
      const provider = errorData?.provider;

      let errorMessage = isSignup ? t.errors.signupFailed : t.errors.loginFailed;

      if (errorCode === 'EMAIL_ALREADY_EXISTS') {
        if (provider === 'email') {
          errorMessage = t.errors.emailAlreadyExistsEmail;
        } else if (provider === 'google') {
          errorMessage = t.errors.emailAlreadyExistsGoogle;
        } else if (provider === 'kakao') {
          errorMessage = t.errors.emailAlreadyExistsKakao;
        } else {
          errorMessage = t.errors.emailAlreadyExistsOther.replace(/{provider}/g, provider);
        }
      } else if (error?.response?.status === 401) {
        errorMessage = t.errors.invalidCredentials;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestContinue = () => {
    router.push(`/app?lang=${locale}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={() => handleLocaleChange('ko')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
            locale === 'ko'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
          }`}
        >
          KO
        </button>
        <button
          onClick={() => handleLocaleChange('en')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
            locale === 'en'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => handleLocaleChange('ja')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
            locale === 'ja'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
          }`}
        >
          JA
        </button>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            서로말
          </h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {t.title}
          </h2>

          {!showEmailForm ? (
            <>
              {/* Social Login Buttons */}
              <div className="space-y-3">
                {/* Google Login */}
                <button
                  onClick={() => googleLogin()}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:border-blue-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t.googleLogin}
                </button>

                {/* Kakao Login */}
                <button
                  onClick={handleKakaoLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#191919] py-3 rounded-xl font-semibold hover:bg-[#FDD835] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.8 6.7-.2.7-.6 2.5-.7 2.9-.1.5.2.5.4.4.3-.1 3.1-2.1 3.6-2.5.6.1 1.3.1 1.9.1 5.5 0 10-3.6 10-8S17.5 3 12 3z" />
                  </svg>
                  {t.kakaoLogin}
                </button>

                {/* Line Login */}
                <button
                  onClick={handleLineLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-[#00B900] text-white py-3 rounded-xl font-semibold hover:bg-[#00A000] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  {t.lineLogin}
                </button>

                {/* Apple Login */}
                <button
                  onClick={handleAppleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Apple
                </button>

                {/* Email Login Button */}
                <button
                  onClick={handleEmailButtonClick}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t.email}
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500 font-medium">{t.or}</span>
                </div>
              </div>

              {/* Guest Continue */}
              <button
                onClick={handleGuestContinue}
                disabled={isLoading}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.continueAsGuest}
              </button>
            </>
          ) : (
            <>
              {/* Email Login/Signup Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {isSignup && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.nickname}
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder={t.nickname}
                      disabled={isLoading}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder={t.email}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.password}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder={t.password}
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading
                    ? '처리 중...'
                    : isSignup
                    ? t.signupButton
                    : t.loginButton}
                </button>
              </form>

              {/* Toggle Login/Signup */}
              <p className="text-center text-sm text-gray-600 mt-4">
                {isSignup ? t.hasAccount : t.noAccount}{' '}
                <button
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-blue-600 font-semibold hover:underline"
                  disabled={isLoading}
                >
                  {isSignup ? t.login : t.signUp}
                </button>
              </p>

              {/* Back Button */}
              <button
                onClick={() => setShowEmailForm(false)}
                disabled={isLoading}
                className="w-full mt-4 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← 뒤로가기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1031534117080-6t8ghsq3bjf388sskma9lq7kuks01hbd.apps.googleusercontent.com'}>
      <LoginPageContent />
    </GoogleOAuthProvider>
  );
}
