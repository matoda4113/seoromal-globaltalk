import { useState, useCallback } from 'react';

export type MediaPermissionStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

interface UseMediaPermissionReturn {
  status: MediaPermissionStatus;
  error: string | null;
  requestPermission: (roomType: 'voice' | 'video') => Promise<boolean>;
  resetPermission: () => void;
}

export function useMediaPermission(): UseMediaPermissionReturn {
  const [status, setStatus] = useState<MediaPermissionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async (roomType: 'voice' | 'video'): Promise<boolean> => {
    setStatus('requesting');
    setError(null);

    try {
      // 브라우저가 미디어 API를 지원하는지 확인
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('This browser does not support media devices');
        setStatus('error');
        return false;
      }

      // 권한 요청 옵션
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: roomType === 'video',
      };

      // 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // 성공 시 스트림 정리 (실제 사용은 방 입장 시)
      stream.getTracks().forEach((track) => track.stop());

      setStatus('granted');
      return true;
    } catch (err: any) {
      console.error('Media permission error:', err);

      // 에러 타입에 따른 메시지 설정
      let errorMessage = 'Failed to get media permission';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Permission denied. Please allow microphone access in your browser settings.';
        setStatus('denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No microphone or camera found. Please connect a device.';
        setStatus('error');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Media device is already in use by another application.';
        setStatus('error');
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Media device constraints cannot be satisfied.';
        setStatus('error');
      } else if (err.name === 'TypeError') {
        errorMessage = 'Invalid media constraints.';
        setStatus('error');
      } else {
        setStatus('error');
      }

      setError(errorMessage);
      return false;
    }
  }, []);

  const resetPermission = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return {
    status,
    error,
    requestPermission,
    resetPermission,
  };
}
