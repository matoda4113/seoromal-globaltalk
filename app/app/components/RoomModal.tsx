'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Room, ChatMessage } from '@/hooks/useSocket';
import logger from "@/lib/logger";
import { useAuth } from '@/contexts/AuthContext';
import { useAgora } from '@/hooks/useAgora';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTranslate } from '@/hooks/useTranslate';
import giftService from '@/services/gift.service';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeave: (roomId: string) => void;
  room: Room;
  locale: 'ko' | 'en' | 'ja';
  messages: ChatMessage[];
  onSendMessage: (roomId: string, message: string, type?: 'text' | 'stt') => void;
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
    remainingTime: '남은 시간',
    minutes: '분',
    hours: '시간',
    balance: '잔액',
    points: '점',
    sendGift: '선물하기',
    giftModal: '선물 보내기',
    selectAmount: '선물할 포인트를 선택하세요',
    send: '보내기',
    cancel: '취소',
    giftSent: '선물을 보냈습니다!',
    giftFailed: '선물 전송에 실패했습니다.',
    lowPointsWarning: '⚠️ 포인트가 부족합니다! 충전하지 않으면 곧 통화가 종료됩니다.',
    giftReceivedToast: '님이 도토리를 선물했습니다!',
    confirmLeave: '나가시겠습니까?',
    confirmLeaveWithGuest: '방을 나가면 대화가 종료됩니다. 나가시겠습니까?',
    confirmLeaveWithPenalty: '10분 미만 통화 종료 시 패널티가 부여됩니다.',
    confirmLeaveWithPoints: '10분 미만 통화 시 도토리 10개가 차감됩니다.',
    reallyLeave: '정말 나가시겠습니까?',
    confirm: '확인',
    warning: '경고',
  },
  en: {
    leave: 'Leave',
    mute: 'Mute',
    unmute: 'Unmute',
    video: 'Video',
    endCall: 'End Call',
    speaker: 'Speaker',
    connecting: 'Connecting...',
    remainingTime: 'Time Left',
    minutes: 'min',
    hours: 'hr',
    balance: 'Balance',
    points: 'pts',
    sendGift: 'Send Gift',
    giftModal: 'Send a Gift',
    selectAmount: 'Select points to gift',
    send: 'Send',
    cancel: 'Cancel',
    giftSent: 'Gift sent successfully!',
    giftFailed: 'Failed to send gift.',
    lowPointsWarning: '⚠️ Low points! Please recharge or the call will end soon.',
    giftReceivedToast: 'sent you acorns!',
    confirmLeave: 'Do you want to leave?',
    confirmLeaveWithGuest: 'Leaving will end the conversation. Do you want to leave?',
    confirmLeaveWithPenalty: 'A penalty will be applied for ending calls under 10 minutes.',
    confirmLeaveWithPoints: '10 acorns will be deducted for calls under 10 minutes.',
    reallyLeave: 'Are you sure you want to leave?',
    confirm: 'Confirm',
    warning: 'Warning',
  },
  ja: {
    leave: '退出',
    mute: 'ミュート',
    unmute: 'ミュート解除',
    video: 'ビデオ',
    endCall: '通話終了',
    speaker: 'スピーカー',
    connecting: '接続中...',
    remainingTime: '残り時間',
    minutes: '分',
    hours: '時間',
    balance: '残高',
    points: 'pt',
    sendGift: 'ギフトを送る',
    giftModal: 'ギフトを送る',
    selectAmount: '送るポイントを選択',
    send: '送る',
    cancel: 'キャンセル',
    giftSent: 'ギフトを送信しました！',
    giftFailed: 'ギフトの送信に失敗しました。',
    lowPointsWarning: '⚠️ ポイント不足！チャージしないと通話が終了します。',
    giftReceivedToast: 'さんからどんぐりが届きました！',
    confirmLeave: '退出しますか？',
    confirmLeaveWithGuest: '退出すると会話が終了します。退出しますか？',
    confirmLeaveWithPenalty: '10分未満の通話終了時にはペナルティが適用されます。',
    confirmLeaveWithPoints: '10分未満の通話時にはどんぐり10個が差し引かれます。',
    reallyLeave: '本当に退出しますか？',
    confirm: '確認',
    warning: '警告',
  },
};

export default function RoomModal({ isOpen, onClose, onLeave, room, locale, messages, onSendMessage, guestBalance, giftNotification }: RoomModalProps) {
  const t = translations[locale];
  const { user } = useAuth();
  const [callDuration, setCallDuration] = useState(0);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [selectedGiftAmount, setSelectedGiftAmount] = useState<number | null>(null);
  const [isSendingGift, setIsSendingGift] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{ message: string; warning?: string } | null>(null);

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
    toggleMute,
    joinChannel,
    leaveChannel,
    localVolume,
    remoteVolume,
    microphones,
    selectedMicId,
    changeMicrophone,
  } = useAgora(room.id, user?.userId);

  // ref로 최신 함수 참조 유지
  const onLeaveRef = useRef(onLeave);
  const onCloseRef = useRef(onClose);
  const historyPushedRef = useRef(false);
  const isClosingRef = useRef(false); // 프로그램적으로 닫는 중인지 추적

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
  }, [remainingMinutes, isGuest, isOpen, locale]);

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

  // 번역 훅
  const { translateText } = useTranslate();

  // STT 기능 - 자동으로 계속 음성 인식
  const handleSTTTranscript = useCallback((transcript: string) => {
    logger.info('📝 STT 텍스트 전송:', transcript);
    onSendMessage(room.id, transcript, 'stt');
  }, [room.id, onSendMessage]);

  // STT 언어 설정 (방의 언어에 맞춤)
  const sttLanguage = room.language === 'korean' ? 'ko-KR' : room.language === 'english' ? 'en-US' : 'ja-JP';

  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition(
    handleSTTTranscript,
    sttLanguage
  );

  // 모든 사용자 STT 자동 시작 (음소거 상태와 연동)
  useEffect(() => {
    if (!isSupported) return;

    if (isJoined && !isMuted && !isListening) {
      // 통화 중이고 음소거가 아닌데 STT가 꺼져있으면 자동 시작
      logger.log('🎤 STT 자동 시작 (통화 중, 음소거 해제)');
      const timer = setTimeout(() => {
        startListening();
      }, 500); // 약간의 딜레이를 줘서 안정성 확보
      return () => clearTimeout(timer);
    } else if ((isMuted || !isJoined) && isListening) {
      // 음소거하거나 통화 종료되면 STT 중지
      logger.log('🛑 음소거 또는 통화 종료 → STT 자동 중지');
      stopListening();
    }
  }, [isJoined, isMuted, isSupported, isListening, startListening, stopListening]);

  // 번역 캐시 (같은 메시지 중복 번역 방지)
  const translationCacheRef = useRef<{ [key: string]: string }>({});

  useEffect(() => {
    const processMessages = async () => {
      // 모든 STT 메시지를 자동 번역 (캐시 사용)
      // 유저의 country 언어로 번역 (없으면 브라우저 언어)
      const userCountry = user?.country?.toLowerCase() || '';
      const browserLang = typeof window !== 'undefined' ? navigator.language.split('-')[0] : 'en';
      const targetLang = userCountry || browserLang; // country 우선, 없으면 브라우저 언어

      const translatedMessages = await Promise.all(
        messages.map(async (msg) => {
          // 상대방이 보낸 STT 메시지면 번역
          if (msg.senderId !== user?.userId && msg.type === 'stt') {
            const cacheKey = `${msg.id}_${targetLang}`;

            // 캐시에 있으면 캐시 사용
            if (translationCacheRef.current[cacheKey]) {
              return { ...msg, message: msg.message, translatedMessage: translationCacheRef.current[cacheKey] };
            }

            // 캐시에 없으면 번역하고 캐시에 저장
            try {
              // 유저 country 언어로 번역 (한국어 방 -> 게스트 모국어)
              // 소스 언어: 방 언어 (호스트가 말하는 언어)
              const translated = await translateText(msg.message, targetLang, room.language);
              translationCacheRef.current[cacheKey] = translated;
              // 원본과 번역을 함께 저장
              return { ...msg, message: msg.message, translatedMessage: translated };
            } catch (error) {
              logger.error('번역 실패, 원본 표시:', error);
              return msg; // 번역 실패 시 원본 표시
            }
          }
          return msg;
        })
      );

      if (clearedAtIndex === -1) {
        // 지우기 전: 필터링 및 번역된 메시지 표시
        setLocalMessages(translatedMessages);
      } else {
        // 지운 후: 지운 시점 이후의 새 메시지만 표시
        const newMessages = translatedMessages.slice(clearedAtIndex);
        setLocalMessages(newMessages);
      }
    };

    processMessages();
  }, [messages, clearedAtIndex, user?.userId, room.language]); // translateText 제거!

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

  // 메시지 추가될 때 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        logger.log('👤 호스트 혼자 남음 → Agora 연결 해제');
        void leaveChannel();
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
          // 10분 이상 통화한 경우 - 패널티 없음
          setConfirmModalData({ message: t.confirmLeaveWithGuest });
        } else {
          // 10분 미만 통화 중 나가는 경우 - 패널티 있음
          setConfirmModalData({
            message: t.reallyLeave,
            warning: t.confirmLeaveWithPenalty
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
            // 10분 이상 통화한 경우
            setConfirmModalData({ message: t.confirmLeave });
          } else {
            // 10분 미만 통화 중 나가는 경우 - 도토리 차감 경고
            setConfirmModalData({
              message: t.reallyLeave,
              warning: t.confirmLeaveWithPoints
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
      alert(locale === 'ko' ? '선물할 금액을 선택해주세요.' : locale === 'ja' ? 'ギフト金額を選択してください。' : 'Please select a gift amount.');
      return;
    }

    const recipient = room.participants.find((p) => p.userId !== user?.userId);
    if (!recipient || !recipient.userId) {
      alert(locale === 'ko' ? '상대방을 찾을 수 없습니다.' : locale === 'ja' ? '相手が見つかりません。' : 'Recipient not found.');
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
        <div className="flex flex-col items-center">
          <h1 className="text-white font-semibold text-lg">{room.title}</h1>
          {/* Connection Status */}
          {(() => {
            const currentParticipant = room.participants.find(p => p.userId === user?.userId);
            const isHost = currentParticipant?.isHost;
            const participantCount = room.participants.length;

            if (isJoined) {
              return <p className="text-green-400 text-xs mt-1">🎤 통화 중</p>;
            } else if (isHost && participantCount === 1) {
              return <p className="text-yellow-400 text-xs mt-1">⏳ 게스트 대기 중...</p>;
            } else if (participantCount >= 2) {
              return <p className="text-blue-400 text-xs mt-1 animate-pulse">🔄 연결 중...</p>;
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
          // Audio Call Layout - 양옆 배치
          <div className="w-full px-8">
            <div className="flex flex-col items-center gap-6">
              {/* 참가자 프로필 */}
              <div className="flex justify-center items-center gap-[30px] max-w-4xl mx-auto">
                {room.participants.map((participant) => {
                  // 현재 참가자가 말하고 있는지 확인 (임계값: 0.1 이상)
                  const isMe = participant.userId === user?.userId;
                  const VOLUME_THRESHOLD = 0.1; // 백그라운드 노이즈 필터링
                  const isSpeaking = isMe ? (localVolume > VOLUME_THRESHOLD) : (remoteVolume > VOLUME_THRESHOLD);

                  return (
                    <div key={participant.socketId} className="text-center">
                      <div className="relative">
                        {/* 말하는 중일 때 애니메이션 링 */}
                        {isSpeaking && (
                          <>
                            <div className="absolute inset-0 w-20 h-20 rounded-full bg-green-500 opacity-30 animate-ping"></div>
                            <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-green-400 animate-pulse"></div>
                          </>
                        )}
                        {/* 프로필 이미지 */}
                        <div className={`w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 overflow-hidden relative ${
                          isSpeaking ? 'ring-4 ring-green-400 shadow-lg shadow-green-500/50' : ''
                        }`}>
                          {participant.profileImageUrl ? (
                            <img
                              src={participant.profileImageUrl}
                              alt={participant.nickname}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            participant.nickname[0].toUpperCase()
                          )}
                        </div>
                      </div>
                      <p className="text-white text-lg font-semibold mb-1">{participant.nickname}</p>
                      <span className={`inline-block ${participant.isHost ? 'bg-yellow-500' : 'bg-gray-600'} text-white px-2 py-1 rounded text-xs`}>
                        {participant.isHost ? 'Host' : 'Guest'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 마이크 선택 */}
              {microphones.length > 1 && (
                <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-3 rounded-lg">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  <select
                    value={selectedMicId}
                    onChange={(e) => changeMicrophone(e.target.value)}
                    className="bg-gray-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {microphones.map((mic) => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || `마이크 ${mic.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Video Call Layout
          <div className="relative w-full h-full">
            {/* Remote Video (큰 화면) */}
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4 overflow-hidden">
                  {room.participants[1]?.profileImageUrl ? (
                    <img
                      src={room.participants[1].profileImageUrl}
                      alt={room.participants[1].nickname}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    room.participants[1]?.nickname?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <p className="text-white text-xl">{room.participants[1]?.nickname || t.connecting}</p>
              </div>
            </div>

            {/* Local Video (작은 PIP) */}
            <div className="absolute top-4 right-4 w-32 h-40 bg-gray-700 rounded-lg overflow-hidden shadow-lg">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                  {room.participants[0]?.profileImageUrl ? (
                    <img
                      src={room.participants[0].profileImageUrl}
                      alt={room.participants[0].nickname}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    room.participants[0]?.nickname?.[0]?.toUpperCase() || 'Y'
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 선물하기 버튼 (항상 표시, 왼쪽 상단) */}
        {room.sessionStartedAt && (
          <div className="absolute top-4 left-4 z-20 pointer-events-auto">
            <button
              onClick={() => setIsGiftModalOpen(true)}
              className="bg-pink-600/80 hover:bg-pink-500/80 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm transition-colors flex items-center gap-1 shadow-lg"
            >
              🎁 {t.sendGift}
            </button>
          </div>
        )}

        {/* Chat Messages Overlay (full height) */}
        {isChatVisible && (
          <div className="absolute top-4 bottom-4 left-4 right-4 overflow-y-auto space-y-2 pointer-events-none z-10">
            {/* 상단 버튼들 */}
            <div className="flex justify-end items-start mb-2 pointer-events-auto">
              {/* 채팅 지우기 버튼 (오른쪽) */}
              {localMessages.length > 0 && (
                <button
                  onClick={clearChatHistory}
                  className="bg-gray-800/70 hover:bg-gray-700/70 text-gray-300 text-xs px-3 py-1 rounded-full backdrop-blur-sm transition-colors"
                >
                  🗑️ 채팅 기록 지우기
                </button>
              )}
            </div>

            {localMessages.map((msg) => {
              const isMyMessage = msg.senderId === user?.userId;
              const isSTT = msg.type === 'stt';

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} pointer-events-auto`}
                >
                  {/* STT 메시지: 보라색 글자 + 아이콘, 일반 메시지: 흰색 글자 */}
                  {isSTT ? (
                    <div className="max-w-xs bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                      <p className="text-sm flex items-center gap-1" style={{ color: '#c084fc' }}>
                        <span>🎤</span>
                        <span>{msg.message}</span>
                      </p>
                      {/* 번역된 메시지 (있으면 표시) */}
                      {(msg as any).translatedMessage && (msg as any).translatedMessage !== msg.message && (
                        <p className="text-white/80 text-xs mt-1 ml-6">{(msg as any).translatedMessage}</p>
                      )}
                    </div>
                  ) : (
                    <div className={`max-w-xs ${isMyMessage ? 'bg-blue-600/90' : 'bg-gray-800/90'} backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg`}>
                      <p className="text-white text-sm">{msg.message}</p>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-gray-800 px-4 py-4">
        {/* Message Input (always visible at bottom) */}
        <div className="mb-3 max-w-2xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="메시지 입력..."
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              전송
            </button>
          </div>
        </div>

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
      {isGiftModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            {/* 헤더 */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">🎁 {t.giftModal}</h2>
              <p className="text-gray-400 text-sm">{t.selectAmount}</p>
            </div>

            {/* 선물 금액 선택 */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[50, 100, 200, 300].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setSelectedGiftAmount(amount)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedGiftAmount === amount
                      ? 'border-pink-500 bg-pink-500/20 text-pink-400'
                      : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="text-3xl mb-1">🌰</div>
                  <div className="text-xl font-bold">{amount}{t.points}</div>
                </button>
              ))}
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsGiftModalOpen(false);
                  setSelectedGiftAmount(null);
                }}
                disabled={isSendingGift}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSendGift}
                disabled={!selectedGiftAmount || isSendingGift}
                className="flex-1 px-4 py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isSendingGift ? '전송 중...' : t.send}
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
