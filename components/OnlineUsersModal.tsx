interface AuthenticatedUser {
  userId: number;
  nickname: string;
  age_group?: number | null;
  gender?: string | null;
}

interface OnlineUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  authenticatedUsers: AuthenticatedUser[];
  anonymousCount: number;
  locale: 'ko' | 'en' | 'ja';
}

const translations = {
  ko: {
    title: '온라인 사용자',
    authenticatedUsers: '로그인 사용자',
    anonymousUsers: '익명 사용자',
    count: '명',
    noUsers: '온라인 사용자가 없습니다',
    close: '닫기',
  },
  en: {
    title: 'Online Users',
    authenticatedUsers: 'Logged In Users',
    anonymousUsers: 'Anonymous Users',
    count: 'users',
    noUsers: 'No online users',
    close: 'Close',
  },
  ja: {
    title: 'オンラインユーザー',
    authenticatedUsers: 'ログインユーザー',
    anonymousUsers: '匿名ユーザー',
    count: '人',
    noUsers: 'オンラインユーザーがいません',
    close: '閉じる',
  },
};

export default function OnlineUsersModal({
  isOpen,
  onClose,
  authenticatedUsers = [],
  anonymousCount = 0,
  locale,
}: OnlineUsersModalProps) {
  const t = translations[locale];

  if (!isOpen) return null;

  const getAgeGroupText = (age_group?: number | null) => {
    if (!age_group) return '';
    if (locale === 'ko') return `${age_group}대`;
    if (locale === 'ja') return `${age_group}代`;
    return `${age_group}s`;
  };

  const getGenderText = (gender?: string | null) => {
    if (!gender) return '';
    if (locale === 'ko') return gender === 'male' ? '남' : '여';
    if (locale === 'ja') return gender === 'male' ? '男' : '女';
    return gender === 'male' ? 'M' : 'F';
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-140px)]">
          {authenticatedUsers.length === 0 && anonymousCount === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">👥</div>
              <p className="text-gray-500">{t.noUsers}</p>
            </div>
          ) : (
            <>
              {/* Authenticated Users */}
              {authenticatedUsers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    {t.authenticatedUsers} ({authenticatedUsers.length})
                  </h3>
                  <div className="space-y-2">
                    {authenticatedUsers.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {user.nickname[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{user.nickname}</p>
                          {(user.age_group || user.gender) && (
                            <p className="text-xs text-gray-600">
                              {[getAgeGroupText(user.age_group), getGenderText(user.gender)]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Anonymous Users */}
              {anonymousCount > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                    {t.anonymousUsers}
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                          ?
                        </div>
                        <span className="text-gray-700 font-medium">{t.anonymousUsers}</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">
                        {anonymousCount} <span className="text-sm font-normal text-gray-600">{t.count}</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors active:scale-95"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
