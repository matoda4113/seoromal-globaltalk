'use client';

import { useEffect, useState, useCallback } from 'react';
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
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

export function useAgora(channelName: string | null, userId?: number, callType: 'audio' | 'video' = 'audio') {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('default');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('default');
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

  // 카메라 목록 가져오기
  useEffect(() => {
    if (typeof window === 'undefined' || !AgoraRTC) return;

    const getCameras = async () => {
      try {
        const devices = await AgoraRTC!.getCameras();
        setCameras(devices);
        if (devices.length > 0 && selectedCameraId === 'default') {
          setSelectedCameraId(devices[0].deviceId);
        }
      } catch (error) {
        logger.error('Failed to get cameras:', error);
      }
    };

    // Wait for AgoraRTC to load
    const checkInterval = setInterval(() => {
      if (AgoraRTC) {
        clearInterval(checkInterval);
        getCameras();
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [selectedCameraId]);

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

      const agoraClient = AgoraRTC.createClient({
        mode: 'rtc',
        codec: 'vp8',
        // 저지연 최적화 설정
        role: 'host' // 모든 사용자를 host로 설정하여 지연 최소화
      });
      agoraClientRef = agoraClient; // cleanup에서 참조하기 위해 저장
      setClient(agoraClient);

      agoraClient.on('user-published', async (user, mediaType) => {
        try {
          await agoraClient.subscribe(user, mediaType);
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
          // video는 DOM 요소에 수동으로 play할 예정이므로 여기서는 처리 안 함
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

      // 연결 상태 변경 모니터링 (네트워크 끊김 등)
      agoraClient.on('connection-state-change', (curState, prevState, reason) => {
        logger.log(`🔌 Agora connection state: ${prevState} → ${curState} (reason: ${reason})`);

        // 연결이 끊어진 경우
        if (curState === 'DISCONNECTED') {
          logger.warn('⚠️ Agora connection lost - clearing remote users');
          setRemoteUsers([]);
          setIsJoined(false);
        }

        // 재연결 실패한 경우
        if (curState === 'DISCONNECTED' && reason === 'LEAVE') {
          logger.log('✅ Successfully left Agora channel');
        }
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

  // 로컬 비디오만 시작 (채널 접속 없이)
  const startLocalVideo = useCallback(async () => {
    if (!AgoraRTC) {
      logger.log('⚠️ Cannot start video: AgoraRTC not loaded yet');
      return;
    }
    if (localVideoTrack) {
      logger.log('⚠️ Local video already started');
      return;
    }

    try {
      const videoTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: '720p_2', // HD (1280x720)
        cameraId: selectedCameraId !== 'default' ? selectedCameraId : undefined,
        optimizationMode: 'motion', // 움직임 최적화 (저지연)
      });
      setLocalVideoTrack(videoTrack);
      logger.log('📹 Created local video track (preview only) - HD quality with low latency');
    } catch (error: any) {
      logger.error('❌ Failed to create video track:', error);
      if (error.name === 'NotAllowedError' || error.code === 'PERMISSION_DENIED') {
        alert('카메라 권한이 거부되었습니다.');
      }
    }
  }, [localVideoTrack]);

  // 채널 참가 (토큰 파라미터 추가)
  const joinChannel = useCallback(async (token?: string | null) => {
    logger.log(`🔍 joinChannel called: client=${!!client}, channelName=${channelName}, token=${!!token}, callType=${callType}, connectionState=${client?.connectionState}`);

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

      // 오디오 트랙 생성
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        microphoneId: selectedMicId !== 'default' ? selectedMicId : undefined,
        AEC: true, // 반향 제거
        ANS: true, // 노이즈 억제
        AGC: true, // 자동 게인 조절
      });
      setLocalAudioTrack(audioTrack);

      const tracksToPublish: (IMicrophoneAudioTrack | ICameraVideoTrack)[] = [audioTrack];

      // 비디오 모드인 경우
      if (callType === 'video') {
        // 이미 생성된 비디오 트랙이 있으면 사용, 없으면 새로 생성
        let videoTrack = localVideoTrack;
        if (!videoTrack) {
          videoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: '720p_2', // HD (1280x720)
            cameraId: selectedCameraId !== 'default' ? selectedCameraId : undefined,
            optimizationMode: 'motion', // 움직임 최적화 (저지연)
          });
          setLocalVideoTrack(videoTrack);
          logger.log('📹 Created local video track - HD quality with low latency');
        } else {
          logger.log('📹 Using existing local video track');
        }
        tracksToPublish.push(videoTrack);
      }

      await client.publish(tracksToPublish);
      logger.log(`🎤 Published local ${callType === 'video' ? 'audio & video' : 'audio'}`);

      // 네트워크 품질에 따른 자동 품질 조절 (저지연 우선)
      // join 후에만 설정 가능
      try {
        await client.setStreamFallbackOption(2, 2); // 네트워크 안 좋을 때 비디오 품질 낮춤
        logger.log('✅ Stream fallback option set for low latency');
      } catch (error) {
        logger.warn('Failed to set stream fallback option:', error);
      }

      setIsJoined(true);
    } catch (error: any) {
      logger.error('❌ Failed to join channel:', error);
      if (error.name === 'NotAllowedError' || error.code === 'PERMISSION_DENIED') {
        alert(callType === 'video' ? '카메라/마이크 권한이 거부되었습니다.' : '마이크 권한이 거부되었습니다.');
      } else if (error.code !== 'INVALID_OPERATION') {
        logger.error('Join error:', error.code, error.message);
      }
    }
  }, [client, channelName, selectedMicId, userId, callType, localVideoTrack]);

  // 채널 나가기
  const leaveChannel = useCallback(async (keepVideo?: boolean) => {
    const shouldKeepVideo = keepVideo ?? false;
    if (!client) return;

    try {
      logger.log('🎤 Leaving Agora channel...', shouldKeepVideo ? '(keeping local video)' : '');

      // 1. 먼저 unpublish
      const tracksToUnpublish = [];
      if (localAudioTrack) tracksToUnpublish.push(localAudioTrack);
      if (localVideoTrack && !shouldKeepVideo) tracksToUnpublish.push(localVideoTrack);

      if (tracksToUnpublish.length > 0 && client.connectionState === 'CONNECTED') {
        try {
          await client.unpublish(tracksToUnpublish);
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

      // 3. Local video track 정리 (shouldKeepVideo가 false일 때만)
      if (localVideoTrack && !shouldKeepVideo) {
        localVideoTrack.stop();
        localVideoTrack.close();
        setLocalVideoTrack(null);
      }

      // 4. Remote users 완전히 정리
      remoteUsers.forEach((user) => {
        if (user.audioTrack) {
          user.audioTrack.stop();
          const mediaStreamTrack = user.audioTrack.getMediaStreamTrack();
          if (mediaStreamTrack) {
            mediaStreamTrack.stop();
          }
        }
        if (user.videoTrack) {
          user.videoTrack.stop();
          const mediaStreamTrack = user.videoTrack.getMediaStreamTrack();
          if (mediaStreamTrack) {
            mediaStreamTrack.stop();
          }
        }
      });

      // 5. 채널 나가기
      if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
        await client.leave();
      }

      // 6. 상태 초기화
      setIsJoined(false);
      setRemoteUsers([]);
      setIsMuted(false);
      if (!shouldKeepVideo) {
        setIsVideoOff(false);
      }
      setLocalVolume(0);
      setRemoteVolume(0);

      logger.log('✅ Successfully left channel');
    } catch (error) {
      logger.error('❌ Failed to leave channel:', error);
    }
  }, [client, localAudioTrack, localVideoTrack, remoteUsers]);

  // 음소거 토글
  const toggleMute = async () => {
    if (!localAudioTrack) return;
    const newMutedState = !isMuted;
    await localAudioTrack.setEnabled(!newMutedState);
    setIsMuted(newMutedState);
  };

  // 비디오 토글
  const toggleVideo = async () => {
    if (!localVideoTrack) return;
    const newVideoOffState = !isVideoOff;
    await localVideoTrack.setEnabled(!newVideoOffState);
    setIsVideoOff(newVideoOffState);
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

  // 카메라 변경
  const changeCamera = async (deviceId: string) => {
    if (!AgoraRTC) {
      logger.log('⚠️ Cannot change camera: AgoraRTC not loaded yet');
      return;
    }

    if (!localVideoTrack) {
      setSelectedCameraId(deviceId);
      return;
    }

    try {
      logger.log('📹 Changing camera to:', deviceId);

      // 1. 기존 트랙 정리
      const wasPublished = isJoined && client?.connectionState === 'CONNECTED';

      if (wasPublished && client) {
        await client.unpublish(localVideoTrack);
        logger.log('📹 Unpublished old video track');
      }

      localVideoTrack.stop();
      localVideoTrack.close();

      // 2. 새 트랙 생성
      const newVideoTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: '720p_2', // HD (1280x720)
        cameraId: deviceId,
        optimizationMode: 'motion', // 움직임 최적화 (저지연)
      });

      setLocalVideoTrack(newVideoTrack);
      setSelectedCameraId(deviceId);

      // 3. 통화 중이었다면 새 트랙 publish
      if (wasPublished && client) {
        await client.publish(newVideoTrack);
        logger.log('📹 Published new video track');
      }

      logger.log('✅ Camera changed successfully to:', deviceId);
    } catch (error) {
      logger.error('Failed to change camera:', error);
      alert('카메라 변경에 실패했습니다.');
    }
  };

  return {
    client,
    localAudioTrack,
    localVideoTrack,
    remoteUsers,
    isJoined,
    isMuted,
    isVideoOff,
    microphones,
    selectedMicId,
    cameras,
    selectedCameraId,
    localVolume,
    remoteVolume,
    startLocalVideo,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleVideo,
    changeMicrophone,
    changeCamera,
  };
}
