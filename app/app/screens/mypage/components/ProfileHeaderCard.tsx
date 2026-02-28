'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import authService from '@/services/auth.service';
import logger from '@/lib/logger';
import imageCompression from 'browser-image-compression';

const translations = {
  ko: {
    degree: '매너 온도',
    points: '도토리',
    viewHistory: '내역 보기',
    updateSuccess: '수정되었습니다',
    updateFailed: '수정에 실패했습니다',
  },
  en: {
    degree: 'Manner Temperature',
    points: 'Dotori',
    viewHistory: 'View History',
    updateSuccess: 'Updated successfully',
    updateFailed: 'Update failed',
  },
  ja: {
    degree: 'マナー温度',
    points: 'ドトリ',
    viewHistory: '履歴を見る',
    updateSuccess: '更新されました',
    updateFailed: '更新に失敗しました',
  },
};

export default function ProfileHeaderCard() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { currentLanguage } = useGlobalSettings();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[currentLanguage];

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);

      let fileToUpload: File = file;

      // WebP 변환 시도 (실패해도 계속 진행)
      try {
        // 이미지 압축 및 webp 변환 옵션
        const options = {
          maxWidthOrHeight: 1024, // 가로 또는 세로 최대 1024px
          useWebWorker: true,
          fileType: 'image/webp' as const,
        };

        logger.info('Compressing image to webp...');
        const compressedFile = await imageCompression(file, options);
        logger.info('Image compressed:', { originalSize: file.size, compressedSize: compressedFile.size });
        fileToUpload = compressedFile;
      } catch (compressionError) {
        // 변환 실패 시 원본 사용 (서버에서 변환 처리)
        logger.warn('Client-side compression failed, uploading original:', compressionError);
        logger.info('Server will handle the conversion');
      }

      // 백엔드에 업로드 (webp 또는 원본)
      const { imageUrl } = await authService.uploadProfileImage(fileToUpload);
      logger.info('Profile image uploaded:', imageUrl);

      // 사용자 정보 새로고침
      await refreshUser();
      alert(t.updateSuccess);
    } catch (error) {
      logger.error('Failed to upload profile image:', error);
      alert(t.updateFailed);
    } finally {
      setIsUploadingImage(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-xl p-6 mb-6 text-white">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white/30 overflow-hidden">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              user?.nickname?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {isUploadingImage ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-1">{user?.nickname || 'User'}</h2>
          <p className="text-sm text-white/80">{user?.email}</p>
        </div>
      </div>

      {/* 매너 온도 */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t.degree}</span>
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
          <span className="text-sm font-medium">{t.points}</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌰</span>
              <span className="text-2xl font-bold">{user?.points?.toLocaleString() || '0'}</span>
            </div>
            <button
              onClick={() => router.push('/app/points-history')}
              className="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              {t.viewHistory}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
