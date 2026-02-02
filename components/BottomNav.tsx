'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type Locale } from '@/lib/i18n';

interface BottomNavProps {
  locale: Locale;
  homeText: string;
  communityText: string;
  mypageText: string;
}

export default function BottomNav({
  locale,
  homeText,
  communityText,
  mypageText,
}: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = (path: string) => {
    const url = `${path}?lang=${locale}`;
    router.push(url);
  };

  const isActive = (path: string) => {
    if (path === '/app') {
      return pathname === '/app';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        {/* Home */}
        <button
          onClick={() => navigate('/app')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/app')
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill={isActive('/app') ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-xs font-medium">{homeText}</span>
        </button>

        {/* Community */}
        <button
          onClick={() => navigate('/app/community')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/app/community')
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill={isActive('/app/community') ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
            />
          </svg>
          <span className="text-xs font-medium">{communityText}</span>
        </button>

        {/* My Page */}
        <button
          onClick={() => navigate('/app/mypage')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/app/mypage')
              ? 'text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill={isActive('/app/mypage') ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-xs font-medium">{mypageText}</span>
        </button>
      </div>
    </nav>
  );
}
