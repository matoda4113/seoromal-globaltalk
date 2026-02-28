'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import authService from '@/services/auth.service';
import logger from '@/lib/logger';

interface BioEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const translations = {
  ko: {
    bio: '자기소개',
    save: '저장',
    cancel: '취소',
    placeholder: '자기소개를 입력하세요',
    updateSuccess: '수정되었습니다',
    updateFailed: '수정에 실패했습니다',
  },
  en: {
    bio: 'Bio',
    save: 'Save',
    cancel: 'Cancel',
    placeholder: 'Enter your bio',
    updateSuccess: 'Updated successfully',
    updateFailed: 'Update failed',
  },
  ja: {
    bio: '自己紹介',
    save: '保存',
    cancel: 'キャンセル',
    placeholder: '自己紹介を入力してください',
    updateSuccess: '更新されました',
    updateFailed: '更新に失敗しました',
  },
};

export default function BioEditModal({
  isOpen,
  onClose,
}: BioEditModalProps) {
  const { user, refreshUser } = useAuth();
  const { currentLanguage } = useGlobalSettings();
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const t = translations[currentLanguage];

  // 모달이 열릴 때 user의 bio를 가져옴
  useEffect(() => {
    if (isOpen && user) {
      setBio(user.bio || '');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleClose = () => {
    setBio(user?.bio || '');
    onClose();
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await authService.updateNickname(undefined, bio);
      await refreshUser();
      alert(t.updateSuccess);
      onClose();
    } catch (error) {
      logger.error('Failed to update bio:', error);
      alert(t.updateFailed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{t.bio}</h2>
          <button
            onClick={handleClose}
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
            placeholder={t.placeholder}
            autoFocus
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-gray-500">{bio.length}/500</span>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
