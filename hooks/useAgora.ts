'use client';

import { useEffect, useState, useCallback } from 'react';
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import logger from "@/lib/logger";

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;

// Dynamic import for Agora SDK (only on client side)
let AgoraRTC: typeof import('agora-rtc-sdk-ng').default | null = null;
if (typeof window !== 'undefined') {
  import('agora-rtc-sdk-ng').then((module) => {
    AgoraRTC = module.default;
  });
}

export function useAgora(channelName: string | null, userId?: number) {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('default');
  const [localVolume, setLocalVolume] = useState(0);
  const [remoteVolume, setRemoteVolume] = useState(0);

  // 마이크 목록 가져오기
  useEffect(() => {
    if (typeof window === 'undefined' || !AgoraRTC) return;

    const getMicrophones = async () => {
      try {
        const devices = await AgoraRTC!.getMicrophones();
        setMicrophones(devices);
        if (devices.length > 0 && selectedMicId === 'default') {
          setSelectedMicId(devices[0].deviceId);
        }
      } catch (error) {
        logger.error('Failed to get microphones:', error);
      }
    };

    // Wait for AgoraRTC to load
    const checkInterval = setInterval(() => {
      if (AgoraRTC) {
        clearInterval(checkInterval);
        getMicrophones();
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [selectedMicId]);

  // 볼륨 레벨 모니터링
  useEffect(() => {
    if (!client || !isJoined) return;

    const volumeInterval = setInterval(() => {
      if (localAudioTrack) {
        setLocalVolume(localAudioTrack.getVolumeLevel());
      }
      if (remoteUsers.length > 0 && remoteUsers[0]?.audioTrack) {
        setRemoteVolume(remoteUsers[0].audioTrack.getVolumeLevel());
      } else {
        setRemoteVolume(0);
      }
    }, 100);

    return () => clearInterval(volumeInterval);
  }, [client, isJoined, localAudioTrack, remoteUsers]);

  // 클라이언트 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let agoraClientRef: IAgoraRTCClient | null = null;

    const init = async () => {
      // Wait for AgoraRTC to load
      if (!AgoraRTC) {
        logger.log('⏳ Waiting for AgoraRTC to load...');
        return;
      }

      // 로그 레벨 설정: 0=DEBUG, 1=INFO, 2=WARNING, 3=ERROR, 4=NONE
      AgoraRTC.setLogLevel(3); // ERROR만 출력

      // 통계 수집 비활성화 (CORS 에러 방지)
      AgoraRTC.disableLogUpload();

      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      agoraClientRef = agoraClient; // cleanup에서 참조하기 위해 저장
      setClient(agoraClient);

      agoraClient.on('user-published', async (user, mediaType) => {
        try {
          await agoraClient.subscribe(user, mediaType);
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
          setRemoteUsers((prev) => {
            const filtered = prev.filter((u) => u.uid !== user.uid);
            return [...filtered, user];
          });
        } catch (error: any) {
          // 구독 실패 시 재시도
          if (error.code === 2021) {
            logger.log('⚠️ Subscribe failed, retrying in 500ms...');
            setTimeout(async () => {
              try {
                await agoraClient.subscribe(user, mediaType);
                if (mediaType === 'audio') {
                  user.audioTrack?.play();
                }
                setRemoteUsers((prev) => {
                  const filtered = prev.filter((u) => u.uid !== user.uid);
                  return [...filtered, user];
                });
                logger.log('✅ Subscribe retry successful');
              } catch (retryError) {
                logger.error('❌ Subscribe retry failed:', retryError);
              }
            }, 500);
          } else {
            logger.error('❌ Subscribe error:', error);
          }
        }
      });

      agoraClient.on('user-unpublished', (user, mediaType) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      agoraClient.on('user-left', (user) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });
    };

    // Wait for AgoraRTC to load before initializing
    const checkInterval = setInterval(() => {
      if (AgoraRTC) {
        clearInterval(checkInterval);
        init();
      }
    }, 100);

    return () => {
      clearInterval(checkInterval);
      // cleanup - 완전히 정리
      if (agoraClientRef) {
        logger.log('🧹 useAgora cleanup: leaving channel and removing client');

        // 채널에서 나가기 (비동기로 처리하되 에러 무시)
        const currentState = agoraClientRef.connectionState;
        if (currentState === 'CONNECTED' || currentState === 'CONNECTING') {
          agoraClientRef.leave().catch((e) => {
            // WS_ABORT 에러는 정상적인 cleanup 과정에서 발생할 수 있으므로 무시
            if (e.code !== 'WS_ABORT') {
              logger.warn('Leave failed in cleanup:', e);
            }
          });
        }

        // 이벤트 리스너 제거
        agoraClientRef.removeAllListeners();
      }
    };
  }, []);

  // 채널 참가 (토큰 파라미터 추가)
  const joinChannel = useCallback(async (token?: string | null) => {
    logger.log(`🔍 joinChannel called: client=${!!client}, channelName=${channelName}, token=${!!token}, connectionState=${client?.connectionState}`);

    if (!AgoraRTC) {
      logger.log('⚠️ Cannot join: AgoraRTC not loaded yet');
      return;
    }
    if (!client || !channelName) {
      logger.log('⚠️ Cannot join: client or channelName missing');
      return;
    }
    if (client.connectionState === 'CONNECTING' || client.connectionState === 'CONNECTED') {
      logger.log('⚠️ Already connecting or connected, skipping join');
      return;
    }

    try {
      // userId가 있으면 그것을 UID로 사용, 없으면 Agora가 자동 생성
      // 토큰이 있으면 사용, 없으면 null (테스트 모드)
      const uid = await client.join(APP_ID, channelName, token || null, userId || null);
      logger.log('✅ Joined channel:', channelName, 'uid:', uid, userId ? '(custom)' : '(auto)', 'with token:', !!token);

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        microphoneId: selectedMicId !== 'default' ? selectedMicId : undefined,
      });
      setLocalAudioTrack(audioTrack);

      await client.publish([audioTrack]);
      logger.log('🎤 Published local audio');

      setIsJoined(true);
    } catch (error: any) {
      logger.error('❌ Failed to join channel:', error);
      if (error.name === 'NotAllowedError' || error.code === 'PERMISSION_DENIED') {
        alert('마이크 권한이 거부되었습니다.');
      } else if (error.code !== 'INVALID_OPERATION') {
        logger.error('Join error:', error.code, error.message);
      }
    }
  }, [client, channelName, selectedMicId, userId]);

  // 채널 나가기
  const leaveChannel = useCallback(async () => {
    if (!client) return;

    try {
      logger.log('🎤 Leaving Agora channel...');

      // 1. 먼저 unpublish
      if (localAudioTrack && client.connectionState === 'CONNECTED') {
        try {
          await client.unpublish([localAudioTrack]);
        } catch (e) {
          logger.warn('Unpublish failed:', e);
        }
      }

      // 2. Local audio track 정리
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }

      // 3. Remote users 완전히 정리
      remoteUsers.forEach((user) => {
        if (user.audioTrack) {
          user.audioTrack.stop();
          // MediaStreamTrack도 완전히 중지
          const mediaStreamTrack = user.audioTrack.getMediaStreamTrack();
          if (mediaStreamTrack) {
            mediaStreamTrack.stop();
          }
        }
      });

      // 4. 채널 나가기
      if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
        await client.leave();
      }

      // 5. 상태 초기화
      setIsJoined(false);
      setRemoteUsers([]);
      setIsMuted(false);
      setLocalVolume(0);
      setRemoteVolume(0);

      logger.log('✅ Successfully left channel');
    } catch (error) {
      logger.error('❌ Failed to leave channel:', error);
    }
  }, [client, localAudioTrack, remoteUsers]);

  // 음소거 토글
  const toggleMute = async () => {
    if (!localAudioTrack) return;
    const newMutedState = !isMuted;
    await localAudioTrack.setEnabled(!newMutedState);
    setIsMuted(newMutedState);
  };

  // 마이크 변경
  const changeMicrophone = async (deviceId: string) => {
    if (!localAudioTrack) {
      setSelectedMicId(deviceId);
      return;
    }
    try {
      await localAudioTrack.setDevice(deviceId);
      setSelectedMicId(deviceId);
    } catch (error) {
      logger.error('Failed to change microphone:', error);
    }
  };

  return {
    client,
    localAudioTrack,
    remoteUsers,
    isJoined,
    isMuted,
    microphones,
    selectedMicId,
    localVolume,
    remoteVolume,
    joinChannel,
    leaveChannel,
    toggleMute,
    changeMicrophone,
  };
}
