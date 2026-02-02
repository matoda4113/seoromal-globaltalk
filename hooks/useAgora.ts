'use client';

import { useEffect, useState, useCallback } from 'react';
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;

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
    if (typeof window === 'undefined') return;

    const getMicrophones = async () => {
      try {
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        const devices = await AgoraRTC.getMicrophones();
        setMicrophones(devices);
        if (devices.length > 0 && selectedMicId === 'default') {
          setSelectedMicId(devices[0].deviceId);
        }
      } catch (error) {
        console.error('Failed to get microphones:', error);
      }
    };

    getMicrophones();
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
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

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
            console.log('⚠️ Subscribe failed, retrying in 500ms...');
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
                console.log('✅ Subscribe retry successful');
              } catch (retryError) {
                console.error('❌ Subscribe retry failed:', retryError);
              }
            }, 500);
          } else {
            console.error('❌ Subscribe error:', error);
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

    init();

    return () => {
      // cleanup - 완전히 정리
      if (agoraClientRef) {
        console.log('🧹 useAgora cleanup: leaving channel and removing client');

        // 채널에서 나가기 (비동기로 처리하되 에러 무시)
        const currentState = agoraClientRef.connectionState;
        if (currentState === 'CONNECTED' || currentState === 'CONNECTING') {
          agoraClientRef.leave().catch((e) => {
            // WS_ABORT 에러는 정상적인 cleanup 과정에서 발생할 수 있으므로 무시
            if (e.code !== 'WS_ABORT') {
              console.warn('Leave failed in cleanup:', e);
            }
          });
        }

        // 이벤트 리스너 제거
        agoraClientRef.removeAllListeners();
      }
    };
  }, []);

  // 채널 참가
  const joinChannel = useCallback(async () => {
    console.log(`🔍 joinChannel called: client=${!!client}, channelName=${channelName}, connectionState=${client?.connectionState}`);

    if (!client || !channelName) {
      console.log('⚠️ Cannot join: client or channelName missing');
      return;
    }
    if (client.connectionState === 'CONNECTING' || client.connectionState === 'CONNECTED') {
      console.log('⚠️ Already connecting or connected, skipping join');
      return;
    }

    try {
      // userId가 있으면 그것을 UID로 사용, 없으면 Agora가 자동 생성
      const uid = await client.join(APP_ID, channelName, null, userId || null);
      console.log('✅ Joined channel:', channelName, 'uid:', uid, userId ? '(custom)' : '(auto)');

      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        microphoneId: selectedMicId !== 'default' ? selectedMicId : undefined,
      });
      setLocalAudioTrack(audioTrack);

      await client.publish([audioTrack]);
      console.log('🎤 Published local audio');

      setIsJoined(true);
    } catch (error: any) {
      console.error('❌ Failed to join channel:', error);
      if (error.name === 'NotAllowedError' || error.code === 'PERMISSION_DENIED') {
        alert('마이크 권한이 거부되었습니다.');
      } else if (error.code !== 'INVALID_OPERATION') {
        console.error('Join error:', error.code, error.message);
      }
    }
  }, [client, channelName, selectedMicId, userId]);

  // 채널 나가기
  const leaveChannel = useCallback(async () => {
    if (!client) return;

    try {
      console.log('🎤 Leaving Agora channel...');

      // 1. 먼저 unpublish
      if (localAudioTrack && client.connectionState === 'CONNECTED') {
        try {
          await client.unpublish([localAudioTrack]);
        } catch (e) {
          console.warn('Unpublish failed:', e);
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

      console.log('✅ Successfully left channel');
    } catch (error) {
      console.error('❌ Failed to leave channel:', error);
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
      console.error('Failed to change microphone:', error);
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
