'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Room, ChatMessage } from '@/hooks/useSocket';
import { getSocket } from '@/lib/socket';
import logger from "@/lib/logger";
import { useAuth } from '@/contexts/AuthContext';
import { useAgora } from '@/hooks/useAgora';
import giftService from '@/services/gift.service';
import PointsRuleModal from './PointsRuleModal';
import AudioCallView from './AudioCallView';
import VideoCallView from './VideoCallView';
import GiftModal from './GiftModal';
import ChatMessageList from './ChatMessageList';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeave: (roomId: string) => void;
  room: Room;
  messages: ChatMessage[];
  onSendMessage: (roomId: string, message: string, type?: 'text' | 'stt') => void;
  onUpdateRoomTitle?: (roomId: string, newTitle: string) => void;
  guestBalance?: number;
  giftNotification?: { senderNickname: string; amount: number } | null;
}

const translations = {
  ko: {
    leave: '나가기',
    mute: '음소거',
    unmute: '음소거 해제',
    video: '비디오',
    endCall: '통화 종료',
    speaker: '스피커',
    connecting: '연결 중...',
    waitingForOther: '상대방을 기다리는 중...',
    remainingTime: '남은 시간',
    minutes: '분',
    hours: '시간',
    balance: '잔액',
    points: '점',
    sendGift: '선물하기',
    cancel: '취소',
    giftSent: '선물을 보냈습니다!',
    giftFailed: '선물 전송에 실패했습니다.',
    lowPointsWarning: '⚠️ 포인트가 부족합니다! 충전하지 않으면 곧 통화가 종료됩니다.',
    giftReceivedToast: '님이 도토리를 선물했습니다!',
    confirmLeave: '나가시겠습니까?',
    confirmLeaveWithGuest: '방을 나가면 대화가 종료됩니다. 나가시겠습니까?',
    confirmLeaveWithRating: '나가시겠습니까?\n방을 나간 이후에 평점을 남기시면 도토리를 받을 수 있습니다!',
    confirmLeaveWithPenalty: '10분 미만이어도 최소 통화 시간이 적용되어 패널티가 부여됩니다.',
    confirmHostPenalty: '최소 10분간 응대해야 합니다. 지금 나가시면 패널티가 부과됩니다.',
    confirmLeaveWithPoints: '10분 미만이어도 최소 도토리 10개가 차감됩니다.',
    reallyLeave: '정말 나가시겠습니까?',
    confirm: '확인',
    warning: '경고',
    chatTabAll: '전체',
    chatTabVoice: 'STT',
    chatTabText: '텍스트',
    screenShare: '화면 공유',
    stopScreenShare: '공유 중지',
    editTitle: '제목 수정',
    saveTitle: '저장',
    cancelEdit: '취소',
    networkDisconnected: '네트워크 연결 끊김',
    networkDisconnectedMessage: '네트워크 연결이 끊어졌습니다.\n페이지를 새로고침합니다.',
    messagePlaceholder: '메시지 입력...',
    send: '전송',
    inCall: '통화 중',
    waitingForGuest: '게스트 대기 중...',
    connecting: '연결 중...',
  },
  en: {
    leave: 'Leave',
    mute: 'Mute',
    unmute: 'Unmute',
    video: 'Video',
    endCall: 'End Call',
    speaker: 'Speaker',
    connecting: 'Connecting...',
    waitingForOther: 'Waiting for the other person...',
    remainingTime: 'Time Left',
    minutes: 'min',
    hours: 'hr',
    balance: 'Balance',
    points: 'pts',
    sendGift: 'Send Gift',
    cancel: 'Cancel',
    giftSent: 'Gift sent successfully!',
    giftFailed: 'Failed to send gift.',
    lowPointsWarning: '⚠️ Low points! Please recharge or the call will end soon.',
    giftReceivedToast: 'sent you acorns!',
    confirmLeave: 'Do you want to leave?',
    confirmLeaveWithGuest: 'Leaving will end the conversation. Do you want to leave?',
    confirmLeaveWithRating: 'Do you want to leave?\nAfter leaving the room, you can earn acorns by rating!',
    confirmLeaveWithPenalty: 'Even if under 10 minutes, minimum call time penalty will be applied.',
    confirmHostPenalty: 'You must attend for at least 10 minutes. Leaving now will result in a penalty.',
    confirmLeaveWithPoints: 'Even if under 10 minutes, a minimum of 10 acorns will be deducted.',
    reallyLeave: 'Are you sure you want to leave?',
    confirm: 'Confirm',
    warning: 'Warning',
    chatTabAll: 'All',
    chatTabVoice: 'STT',
    chatTabText: 'Text',
    screenShare: 'Share Screen',
    stopScreenShare: 'Stop Sharing',
    editTitle: 'Edit Title',
    saveTitle: 'Save',
    cancelEdit: 'Cancel',
    networkDisconnected: 'Network Disconnected',
    networkDisconnectedMessage: 'Network connection lost.\nRefreshing the page.',
    messagePlaceholder: 'Type a message...',
    send: 'Send',
    inCall: 'In Call',
    waitingForGuest: 'Waiting for guest...',
    connecting: 'Connecting...',
  },
  ja: {
    leave: '退出',
    mute: 'ミュート',
    unmute: 'ミュート解除',
    video: 'ビデオ',
    endCall: '通話終了',
    speaker: 'スピーカー',
    connecting: '接続中...',
    waitingForOther: '相手を待っています...',
    remainingTime: '残り時間',
    minutes: '分',
    hours: '時間',
    balance: '残高',
    points: 'pt',
    sendGift: 'ギフトを送る',
    cancel: 'キャンセル',
    giftSent: 'ギフトを送信しました！',
    giftFailed: 'ギフトの送信に失敗しました。',
    lowPointsWarning: '⚠️ ポイント不足！チャージしないと通話が終了します。',
    giftReceivedToast: 'さんからどんぐりが届きました！',
    confirmLeave: '退出しますか？',
    confirmLeaveWithGuest: '退出すると会話が終了します。退出しますか？',
    confirmLeaveWithRating: '退出しますか？\nルームを出た後に評価を残すとどんぐりが獲得できます！',
    confirmLeaveWithPenalty: '10分未満でも最低通話時間が適用されペナルティが課されます。',
    confirmHostPenalty: '最低10分間は対応する必要があります。今退出するとペナルティが課されます。',
    confirmLeaveWithPoints: '10分未満でも最低どんぐり10個が差し引かれます。',
    reallyLeave: '本当に退出しますか？',
    confirm: '確認',
    warning: '警告',
    chatTabAll: '全て',
    chatTabVoice: 'STT',
    chatTabText: 'テキスト',
    screenShare: '画面共有',
    stopScreenShare: '共有停止',
    editTitle: 'タイトル編集',
    saveTitle: '保存',
    cancelEdit: 'キャンセル',
    networkDisconnected: 'ネットワーク接続切断',
    networkDisconnectedMessage: 'ネットワーク接続が切断されました。\nページを更新します。',
    messagePlaceholder: 'メッセージを入力...',
    send: '送信',
    inCall: '通話中',
    waitingForGuest: 'ゲスト待機中...',
    connecting: '接続中...',
  },
};

export default function RoomModal({ isOpen, onClose, onLeave, room, messages, onSendMessage, onUpdateRoomTitle, guestBalance, giftNotification }: RoomModalProps) {
  const { currentLanguage } = useGlobalSettings();
  const t = translations[currentLanguage];
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(room.title);
  const { user } = useAuth();
  const [callDuration, setCallDuration] = useState(0);
  const [messageInput, setMessageInput] = useState('');
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [selectedGiftAmount, setSelectedGiftAmount] = useState<number | null>(null);
  const [isSendingGift, setIsSendingGift] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{ message: string; warning?: string } | null>(null);
  const [isPointsRuleModalOpen, setIsPointsRuleModalOpen] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // 현재 사용자가 게스트인지 확인
  const isGuest = user?.userId !== room.hostId;

  // 게스트 남은 통화 시간 계산 (분 단위)
  const remainingMinutes = (() => {
    if (!isGuest || guestBalance === undefined) return undefined;

    const pointsPerMinute = room.callType === 'audio' ? 1 : 4;

    // 이미 사용한 시간 (초 → 분 올림)
    const usedMinutes = room.sessionStartedAt ? Math.ceil(callDuration / 60) : 0;

    // 이미 소비될 포인트 (통화 종료 시 정산 예정)
    const usedPoints = usedMinutes * pointsPerMinute;

    // 실제 남은 포인트
    const actualRemainingPoints = guestBalance - usedPoints;

    // 남은 통화 가능 시간 (분)
    const remaining = Math.floor(actualRemainingPoints / pointsPerMinute);

    return Math.max(0, remaining); // 음수면 0으로
  })();

  // Agora 연결
  const {
    client,
    isJoined,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    startLocalVideo,
    joinChannel,
    leaveChannel,
    localVolume,
    remoteVolume,
    localVideoTrack,
    remoteUsers,
    microphones,
    selectedMicId,
    cameras,
    selectedCameraId,
    changeMicrophone,
    changeCamera,
  } = useAgora(room.id, user?.userId, room.callType);

  // ref로 최신 함수 참조 유지
  const onLeaveRef = useRef(onLeave);
  const onCloseRef = useRef(onClose);
  const historyPushedRef = useRef(false);
  const isClosingRef = useRef(false); // 프로그램적으로 닫는 중인지 추적

  // 비디오 재생을 위한 ref
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  // 화면 공유 상태
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenTrackRef = useRef<any>(null);

  useEffect(() => {
    onLeaveRef.current = onLeave;
    onCloseRef.current = onClose;
  }, [onLeave, onClose]);

  // History API - 뒤로가기 처리 (모달이 열릴 때 한 번만 실행)
  useEffect(() => {
    if (!isOpen) {
      // 모달이 닫힐 때 history state가 room인 상태로 남아있으면 정리
      if (historyPushedRef.current && window.history.state?.modal === 'room') {
        // popstate 핸들러가 실행되지 않도록 플래그 설정
        isClosingRef.current = true;
        window.history.back();
      }
      historyPushedRef.current = false;
      return;
    }
    if (historyPushedRef.current) {
      logger.log('⏭️ History already pushed, skipping');
      return;
    }

    window.history.pushState({ modal: 'room', roomId: room.id }, '', `/app?room=${room.id}`);

    historyPushedRef.current = true;
  }, [isOpen, room.id]);

  // Popstate 이벤트 리스너는 별도 useEffect로 관리
  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = (event: PopStateEvent) => {
      // 브라우저 뒤로가기 했을 때
      logger.log('⬅️ Popstate event triggered:', event.state);
      logger.log('⬅️ Current history state:', window.history.state);

      // 프로그램적으로 닫는 중이면 무시 (handleClose에서 이미 onLeave 호출함)
      if (isClosingRef.current) {
        logger.log('⏭️ Skipping popstate handler - already closing programmatically');
        isClosingRef.current = false; // 플래그 리셋
        return;
      }

      // room 모달이 아닌 상태로 돌아갔다면 모달 닫기 (실제 뒤로가기 버튼)
      if (!event.state || event.state.modal !== 'room') {
        logger.log('⬅️ Closing modal via back button');
        onLeaveRef.current(room.id);
        onCloseRef.current();
      }
    };

    logger.log('✅ Popstate listener added');
    window.addEventListener('popstate', handlePopState);

    return () => {
      logger.log('🗑️ Removing popstate listener');
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, room.id]);

  // 통화 시간 카운터 (세션이 시작된 경우에만)
  useEffect(() => {
    if (isOpen && room.sessionStartedAt) {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      // sessionStartedAt이 없으면 카운터 초기화
      setCallDuration(0);
    }
  }, [isOpen, room.sessionStartedAt]);

  // 비디오 모드일 때 로컬 비디오 시작 (미리보기)
  useEffect(() => {
    if (isOpen && room.callType === 'video' && !localVideoTrack) {
      logger.log('📹 Starting local video preview');
      startLocalVideo();
    }
  }, [isOpen, room.callType, localVideoTrack, startLocalVideo]);

  // 로컬 비디오 재생
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
      logger.log('📹 Local video playing');
    }
  }, [localVideoTrack]);

  // 리모트 비디오 재생
  useEffect(() => {
    if (remoteUsers.length > 0 && remoteUsers[0].videoTrack && remoteVideoRef.current) {
      remoteUsers[0].videoTrack.play(remoteVideoRef.current);
      logger.log('📹 Remote video playing');
    }
  }, [remoteUsers]);

  // 게스트 포인트 부족 시 자동 퇴장 타이머
  const autoKickTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 게스트가 아니거나 남은 시간 정보가 없으면 타이머 설정 안 함
    if (!isGuest || remainingMinutes === undefined || !isOpen) {
      if (autoKickTimerRef.current) {
        clearTimeout(autoKickTimerRef.current);
        autoKickTimerRef.current = null;
      }
      return;
    }

    // 남은 시간이 0 이하면 즉시 퇴장
    if (remainingMinutes <= 0) {
      logger.warn('⚠️ 포인트 부족으로 즉시 퇴장');
      // 기존 타이머 제거 (중복 호출 방지)
      if (autoKickTimerRef.current) {
        clearTimeout(autoKickTimerRef.current);
        autoKickTimerRef.current = null;
      }
      handleClose();
      return;
    }

    // 기존 타이머 제거
    if (autoKickTimerRef.current) {
      clearTimeout(autoKickTimerRef.current);
    }

    // 남은 시간 계산 (밀리초)
    const remainingMs = remainingMinutes * 60 * 1000;

    logger.info(`⏰ 자동 퇴장 타이머 재설정: ${remainingMinutes}분 후`);

    // 포인트 부족 시 자동 퇴장
    autoKickTimerRef.current = setTimeout(() => {
      logger.warn('⚠️ 포인트 부족으로 자동 퇴장');
      handleClose();
    }, remainingMs);

    return () => {
      if (autoKickTimerRef.current) {
        clearTimeout(autoKickTimerRef.current);
        autoKickTimerRef.current = null;
      }
    };
  }, [remainingMinutes, isGuest, isOpen]);

  // 통화 시간 포맷 (00:00)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 채팅 토글
  const [isChatVisible, setIsChatVisible] = useState(true);

  // 채팅 기록 지우기 (로컬만)
  const [localMessages, setLocalMessages] = useState<typeof messages>([]);
  const [clearedAtIndex, setClearedAtIndex] = useState(-1);

  // 메시지 동기화
  useEffect(() => {
    if (clearedAtIndex === -1) {
      // 지우기 전: 모든 메시지 표시
      setLocalMessages(messages);
    } else {
      // 지운 후: 지운 시점 이후의 새 메시지만 표시
      const newMessages = messages.slice(clearedAtIndex);
      setLocalMessages(newMessages);
    }
  }, [messages, clearedAtIndex]);

  const clearChatHistory = () => {
    const confirm = window.confirm('채팅 기록을 지우시겠습니까? (본인 화면에서만 삭제됩니다)');
    if (confirm) {
      setClearedAtIndex(messages.length); // 현재 메시지 개수를 기록
      setLocalMessages([]);
    }
  };

  // 메시지 전송
  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendMessage(room.id, messageInput.trim());
      setMessageInput('');
    }
  };


  // ref로 최신 값 추적
  const roomRef = useRef(room);
  const isJoinedRef = useRef(isJoined);

  useEffect(() => {
    roomRef.current = room;
    isJoinedRef.current = isJoined;
  }, [room, isJoined]);

  // 호스트만 0.1초마다 참가자 수 체크해서 Agora 자동 join/leave (비용 절약)
  // 게스트는 입장 시 바로 연결, 퇴장 시 바로 해제
  useEffect(() => {
    if (!client) return;

    const currentParticipant = room.participants.find(p => p.userId === user?.userId);
    const isHost = currentParticipant?.isHost;

    // 게스트인 경우: 바로 Agora 연결
    if (!isHost) {
      if (!isJoined) {
        logger.log('👥 게스트 입장 → Agora 연결');
        void joinChannel(null);
      }
      return; // 게스트는 인터벌 불필요
    }

    // 호스트인 경우: 인터벌로 체크
    logger.log('🔄 호스트 Agora auto join/leave interval 시작');

    const checkInterval = setInterval(() => {
      const participantCount = roomRef.current.participants.length;
      const joined = isJoinedRef.current;

      if (joined && participantCount === 1) {
        // 혼자 남음 → 끊기 (비용 절약)
        // 비디오 모드는 로컬 비디오 유지
        logger.log('👤 호스트 혼자 남음 → Agora 연결 해제');
        void leaveChannel(room.callType === 'video');
      } else if (!joined && participantCount >= 2) {
        // 접속 안 되어있는데 2명 이상 → 접속
        logger.log('👥 게스트 입장 → 호스트 Agora 연결 시작');
        void joinChannel(null);
      }
    }, 100);

    return () => {
      logger.log('🛑 호스트 Agora auto join/leave interval 정리');
      clearInterval(checkInterval);  // 인터벌 정리
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  // RoomModal 언마운트 시 Agora 채널 나가기
  useEffect(() => {
    return () => {
      logger.log('🧹 RoomModal unmounting, leaving Agora channel');
      void leaveChannel();
    };
    // eslint-disable-line react-hooks/exhaustive-deps
  }, []);

  // 브라우저 닫기/새로고침 시 Agora 연결 해제 (비용 절약)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isJoined) {
        logger.log('⚠️ Browser closing/refreshing - leaving Agora channel');
        // 동기적으로 연결 해제 (비동기는 브라우저 종료 시 실행 안 됨)
        if (client && (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING')) {
          // Navigator.sendBeacon으로 서버에 알림도 고려할 수 있지만
          // Agora는 일정 시간 후 자동으로 끊으므로 client.leave()만 호출
          try {
            // @ts-ignore - leave()를 동기적으로 처리할 수 없지만 시도는 함
            client.leave();
          } catch (error) {
            // 무시
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isJoined, client]);

  // Socket 연결 끊김 감지
  useEffect(() => {
    if (!isOpen) return;

    const socket = getSocket();

    const handleSocketDisconnect = () => {
      logger.log('🔌 Socket disconnected - network issue');
      setShowDisconnectModal(true);
    };

    socket.on('disconnect', handleSocketDisconnect);

    return () => {
      socket.off('disconnect', handleSocketDisconnect);
    };
  }, [isOpen]);

  // 화면 공유 토글
  const toggleScreenShare = useCallback(async () => {
    if (!client || !isJoined) {
      logger.warn('⚠️ Cannot share screen: not connected');
      return;
    }

    try {
      // 화면 공유 중이면 중지하고 카메라로 전환
      if (isScreenSharing && screenTrackRef.current) {
        logger.log('🛑 Stopping screen share, switching to camera');

        const screenTrack = screenTrackRef.current;

        // 즉시 상태 변경 (UI 반응 빠르게)
        setIsScreenSharing(false);

        // 카메라 트랙이 있으면 즉시 publish (unpublish와 병렬)
        if (localVideoTrack) {
          // 동시에 실행 (더 빠름)
          await Promise.all([
            client.unpublish(screenTrack),
            client.publish(localVideoTrack)
          ]);
          logger.log('📹 Switched back to camera');
        } else {
          await client.unpublish(screenTrack);
        }

        // 화면 공유 트랙 정리
        screenTrack.close();
        screenTrackRef.current = null;
      }
      // 화면 공유 시작
      else {
        logger.log('🖥️ Starting screen share');

        // Agora SDK 동적 import
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

        // 화면 공유 트랙 생성
        const screenTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: '720p_2', // 720p (빠른 전환)
          optimizationMode: 'motion', // 저지연 우선
        }, 'disable'); // 오디오는 마이크 사용하므로 비활성화

        // 카메라 unpublish와 화면 공유 publish 동시 실행 (더 빠름)
        if (localVideoTrack) {
          await Promise.all([
            client.unpublish(localVideoTrack),
            client.publish(screenTrack)
          ]);
          logger.log('🖥️ Switched to screen share');
        } else {
          await client.publish(screenTrack);
        }

        screenTrackRef.current = screenTrack;

        // 화면 공유 중단 시 (사용자가 "공유 중지" 버튼 클릭)
        screenTrack.on('track-ended', async () => {
          logger.log('🛑 Screen share stopped by user');

          // 즉시 상태 변경 (UI 반응 빠르게)
          setIsScreenSharing(false);

          // 카메라로 복귀 (동시 실행)
          if (localVideoTrack) {
            await Promise.all([
              client.unpublish(screenTrack),
              client.publish(localVideoTrack)
            ]);
            logger.log('📹 Switched back to camera');
          } else {
            await client.unpublish(screenTrack);
          }

          screenTrack.close();
          screenTrackRef.current = null;
        });

        setIsScreenSharing(true);
        logger.log('✅ Screen sharing started');
      }
    } catch (error: any) {
      logger.error('❌ Screen share error:', error);

      if (error.name === 'NotAllowedError' || error.code === 'PERMISSION_DENIED') {
        alert('화면 공유 권한이 거부되었습니다.');
      } else if (error.name === 'NotReadableError') {
        alert('화면 공유를 시작할 수 없습니다. 다른 애플리케이션이 사용 중일 수 있습니다.');
      } else {
        alert('화면 공유 중 오류가 발생했습니다.');
      }

      // 에러 발생 시 상태 초기화
      if (screenTrackRef.current) {
        screenTrackRef.current.close();
        screenTrackRef.current = null;
      }
      setIsScreenSharing(false);
    }
  }, [client, isJoined, isScreenSharing, localVideoTrack]);

  // room.title이 변경되면 editedTitle도 업데이트
  useEffect(() => {
    setEditedTitle(room.title);
  }, [room.title]);

  // 방장이 방 제목 저장
  const handleSaveTitle = () => {
    if (!onUpdateRoomTitle) return;

    const trimmedTitle = editedTitle.trim();
    if (!trimmedTitle) {
      alert('방 제목을 입력해주세요.');
      return;
    }

    if (trimmedTitle.length > 50) {
      alert('방 제목은 50자 이내로 입력해주세요.');
      return;
    }

    onUpdateRoomTitle(room.id, trimmedTitle);
    setIsEditingTitle(false);
  };

  // 방 제목 수정 취소
  const handleCancelEditTitle = () => {
    setEditedTitle(room.title);
    setIsEditingTitle(false);
  };

  const handleClose = () => {
    logger.log('🚪 handleClose called, current state:', window.history.state);

    // 현재 사용자가 호스트인지 확인
    const currentParticipant = room.participants.find(p => p.userId === user?.userId);
    const isHost = currentParticipant?.isHost;

    const sessionDuration = room.sessionStartedAt
      ? Math.floor((Date.now() - new Date(room.sessionStartedAt).getTime()) / 1000)
      : 0;
    const isLessThan15Seconds = sessionDuration > 0 && sessionDuration < 15; // 15초 미만
    const isTenMinutesOrMore = sessionDuration >= 600; // 10분 = 600초

    if (isHost) {
      // 호스트인 경우 - 조건 체크
      const hasGuest = room.participants.length > 1;

      // 15초 미만이거나 게스트가 없으면 경고 없이 바로 나가기
      if (isLessThan15Seconds || !hasGuest) {
        logger.log('👤 15초 미만이거나 혼자 있음 - 경고 없이 방 나가기');
        // 경고 없이 바로 진행
      } else {
        // 게스트가 있을 때만 경고 (커스텀 모달)
        if (isTenMinutesOrMore) {
          // 10분 이상 통화한 경우 - 패널티 없음, 평점 유도
          setConfirmModalData({ message: t.confirmLeaveWithRating });
        } else {
          // 10분 미만 통화 중 나가는 경우 - 패널티 있음 (호스트는 의무 강조)
          setConfirmModalData({
            message: t.reallyLeave,
            warning: t.confirmHostPenalty
          });
        }
        return; // 모달이 처리할 때까지 대기
      }
    } else {
      // 게스트인 경우
      if (room.sessionStartedAt) {
        // 15초 미만이면 경고 없이 바로 나가기
        if (isLessThan15Seconds) {
          logger.log('👤 15초 미만 - 경고 없이 방 나가기');
          // 경고 없이 바로 진행
        } else {
          // 15초 이상인 경우 확인 메시지 표시 (커스텀 모달)
          if (isTenMinutesOrMore) {
            // 10분 이상 통화한 경우 - 평점 유도
            setConfirmModalData({ message: t.confirmLeaveWithRating });
          } else {
            // 10분 미만 통화 중 나가는 경우 - 도토리 차감 경고
            const minPoints = room.callType === 'audio' ? 10 : 40;
            const warningText = currentLanguage === 'ko'
              ? `10분 미만이어도 최소 도토리 ${minPoints}개가 차감됩니다.`
              : currentLanguage === 'ja'
              ? `10分未満でも最低どんぐり${minPoints}個が差し引かれます。`
              : `Even if under 10 minutes, a minimum of ${minPoints} acorns will be deducted.`;

            setConfirmModalData({
              message: t.reallyLeave,
              warning: warningText
            });
          }
          return; // 모달이 처리할 때까지 대기
        }
      } else {
        // 세션 시작 전에 나가는 경우 - 간단한 확인
        setConfirmModalData({ message: t.confirmLeave });
        return; // 모달이 처리할 때까지 대기
      }
    }

    // 플래그 설정: 프로그램적으로 닫는 중
    isClosingRef.current = true;

    // 서버에 방 나가기 알림
    onLeave(room.id);

    // URL 정리 및 모달 닫기
    // pushState로 추가한 히스토리가 있으면 back으로 제거
    if (window.history.state?.modal === 'room') {
      logger.log('⬅️ Calling history.back()');
      window.history.back();
    } else {
      // 히스토리가 없으면 URL만 정리하고 모달 닫기
      logger.log('🔄 Replacing state and closing modal');
      window.history.replaceState(null, '', '/app');
      onClose();
      isClosingRef.current = false; // 플래그 리셋
    }
  };

  const confirmLeave = () => {
    setConfirmModalData(null);

    // 플래그 설정: 프로그램적으로 닫는 중
    isClosingRef.current = true;

    // 서버에 방 나가기 알림
    onLeave(room.id);

    // URL 정리 및 모달 닫기
    if (window.history.state?.modal === 'room') {
      logger.log('⬅️ Calling history.back()');
      window.history.back();
    } else {
      logger.log('🔄 Replacing state and closing modal');
      window.history.replaceState(null, '', '/app');
      onClose();
      isClosingRef.current = false;
    }
  };

  // 선물하기 핸들러
  const handleSendGift = async () => {
    if (!selectedGiftAmount) {
      alert(currentLanguage === 'ko' ? '선물할 금액을 선택해주세요.' : currentLanguage === 'ja' ? 'ギフト金額を選択してください。' : 'Please select a gift amount.');
      return;
    }

    const recipient = room.participants.find((p) => p.userId !== user?.userId);
    if (!recipient || !recipient.userId) {
      alert(currentLanguage === 'ko' ? '상대방을 찾을 수 없습니다.' : currentLanguage === 'ja' ? '相手が見つかりません。' : 'Recipient not found.');
      return;
    }

    try {
      setIsSendingGift(true);
      await giftService.sendGift({
        recipientUserId: recipient.userId,
        amount: selectedGiftAmount,
      });
      alert(t.giftSent);
      setIsGiftModalOpen(false);
      setSelectedGiftAmount(null);
    } catch (error: any) {
      logger.error('선물 전송 실패:', error);
      alert(error.message || t.giftFailed);
    } finally {
      setIsSendingGift(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* 선물 수신 토스트 알림 */}
      {giftNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] animate-bounce">
          <div className="bg-pink-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
            <span className="text-3xl">🎁</span>
            <div>
              <p className="font-bold text-lg">{giftNotification.senderNickname}{t.giftReceivedToast}</p>
              <p className="text-sm">🌰 +{giftNotification.amount}개</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={handleClose}
          className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>{t.leave}</span>
        </button>
        <div className="flex flex-col items-center flex-1 mx-4">

          {/* Room Title */}
          {isEditingTitle && !isGuest ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle()}
                className="bg-gray-700 text-white px-3 py-1 rounded text-sm max-w-[200px]"
                maxLength={50}
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
              >
                {t.saveTitle}
              </button>
              <button
                onClick={handleCancelEditTitle}
                className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700"
              >
                {t.cancelEdit}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-white font-semibold text-lg">{room.title}</h1>
              {!isGuest && (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title={t.editTitle}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          )}
          {/* Connection Status */}
          {(() => {
            const currentParticipant = room.participants.find(p => p.userId === user?.userId);
            const isHost = currentParticipant?.isHost;
            const participantCount = room.participants.length;

            if (isJoined) {
              return <p className="text-green-400 text-xs mt-1">🎤 {t.inCall}</p>;
            } else if (isHost && participantCount === 1) {
              return <p className="text-yellow-400 text-xs mt-1">⏳ {t.waitingForGuest}</p>;
            } else if (participantCount >= 2) {
              return <p className="text-blue-400 text-xs mt-1 animate-pulse">🔄 {t.connecting}</p>;
            }
            return null;
          })()}
        </div>
        {/* Call Duration Timer & Remaining Time */}
        <div className="w-24 text-right">
          {room.sessionStartedAt && (
            <p className="text-white font-mono text-sm">{formatDuration(callDuration)}</p>
          )}
          {/* 게스트 남은 시간 표시 */}
          {isGuest && remainingMinutes !== undefined && (
            <div className="mt-1">
              <p className="text-xs text-gray-400">{t.remainingTime}</p>
              <p className={`font-mono text-xs font-semibold ${
                remainingMinutes < 5 ? 'text-red-400' :
                remainingMinutes < 10 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                ~{remainingMinutes >= 60
                  ? `${Math.floor(remainingMinutes / 60)}${t.hours} ${remainingMinutes % 60}${t.minutes}`
                  : `${remainingMinutes}${t.minutes}`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 포인트 부족 경고 배너 (1분 이하) */}
      {isGuest && remainingMinutes !== undefined && remainingMinutes <= 1 && (
        <div className="bg-red-600 text-white px-4 py-3 text-center font-medium text-sm animate-pulse">
          {t.lowPointsWarning}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 relative">
        {room.callType === 'audio' ? (
          <AudioCallView
            room={room}
            localVolume={localVolume}
            remoteVolume={remoteVolume}
            microphones={microphones}
            selectedMicId={selectedMicId}
            changeMicrophone={changeMicrophone}
          />
        ) : (
          <VideoCallView
            room={room}
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            localVideoTrack={localVideoTrack}
            remoteUsers={remoteUsers}
            microphones={microphones}
            cameras={cameras}
            selectedMicId={selectedMicId}
            selectedCameraId={selectedCameraId}
            changeMicrophone={changeMicrophone}
            changeCamera={changeCamera}
            isScreenSharing={isScreenSharing}
            toggleScreenShare={toggleScreenShare}
            screenShareLabel={isScreenSharing ? t.stopScreenShare : t.screenShare}
          />
        )}

        {/* Chat Messages Overlay */}
        {isChatVisible && (
          <ChatMessageList
            messages={localMessages}
            currentUserId={user?.userId}
            onClearHistory={clearChatHistory}
            t={t}
          />
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-gray-800 px-4 py-4">
        {/* Message Input (only visible when chat is visible) */}
        {isChatVisible && (
          <div className="mb-3 max-w-2xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={t.messagePlaceholder}
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {t.send}
              </button>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="grid grid-cols-3 items-center px-4">
          {/* Left Side Controls */}
          <div className="flex items-center gap-2 justify-start">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              disabled={!isJoined}
              className={`p-3 rounded-full transition-colors relative ${
                isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              } ${!isJoined ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                {isMuted ? (
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                )}
              </svg>
              {/* 볼륨 인디케이터 */}
              {isJoined && !isMuted && localVolume > 0.1 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </button>

            {/* Chat Toggle Button */}
            <button
              onClick={() => setIsChatVisible(!isChatVisible)}
              className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors relative"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              {/* 채팅 숨김 표시 */}
              {!isChatVisible && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
            </button>
          </div>

          {/* Center - End Call Button */}
          <div className="flex justify-center">
            <button
              onClick={handleClose}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </button>
          </div>

          {/* Right Side - Empty for balance */}
          <div></div>
        </div>
      </div>

      {/* 선물하기 모달 */}
      <GiftModal
        isOpen={isGiftModalOpen}
        onClose={() => {
          setIsGiftModalOpen(false);
          setSelectedGiftAmount(null);
        }}
        onSend={handleSendGift}
        isSending={isSendingGift}
        selectedAmount={selectedGiftAmount}
        onSelectAmount={setSelectedGiftAmount}
      />

      {/* 나가기 확인 모달 */}
      {confirmModalData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            {/* 경고가 있으면 경고 아이콘 표시 */}
            {confirmModalData.warning && (
              <div className="mb-4 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-3">
                  <span className="text-4xl">⚠️</span>
                </div>
                <h3 className="text-lg font-bold text-red-600">{t.warning}</h3>
              </div>
            )}

            {/* 경고 메시지 */}
            {confirmModalData.warning && (
              <p className="text-sm text-red-600 font-medium text-center mb-4 bg-red-50 p-3 rounded-lg">
                {confirmModalData.warning}
              </p>
            )}

            {/* 확인 메시지 */}
            <p className="text-base text-gray-800 text-center mb-6 font-medium">
              {confirmModalData.message}
            </p>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModalData(null)}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={confirmLeave}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Right Buttons */}
      <div className="absolute bottom-6 right-6 flex items-center gap-3 z-40">
        {/* 선물하기 버튼 */}
        {room.sessionStartedAt && (
          <button
            onClick={() => setIsGiftModalOpen(true)}
            className="w-12 h-12 md:w-14 md:h-14 bg-pink-600 hover:bg-pink-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
            aria-label="Send Gift"
          >
            <span className="text-2xl md:text-3xl">🎁</span>
          </button>
        )}

        {/* Points Rule Help Button */}
        <button
          onClick={() => setIsPointsRuleModalOpen(true)}
          className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
          aria-label="Points Rules"
        >
          <svg className="w-6 h-6 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Points Rule Modal */}
      <PointsRuleModal
        isOpen={isPointsRuleModalOpen}
        onClose={() => setIsPointsRuleModalOpen(false)}
        roomType={room.callType}
      />

      {/* 네트워크 연결 끊김 모달 */}
      {showDisconnectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="mb-4 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-3">
                <span className="text-4xl">🔌</span>
              </div>
              <h3 className="text-lg font-bold text-red-600">{t.networkDisconnected}</h3>
            </div>

            <p className="text-base text-gray-800 text-center mb-6 font-medium whitespace-pre-line">
              {t.networkDisconnectedMessage}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              {t.confirm}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
