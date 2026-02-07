'use client';

import { useEffect, useState, useRef } from 'react';
import { Room } from '@/hooks/useSocket';
import logger from "@/lib/logger";

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeave: (roomId: string) => void;
  room: Room;
  locale: 'ko' | 'en' | 'ja';
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
  },
  en: {
    leave: 'Leave',
    mute: 'Mute',
    unmute: 'Unmute',
    video: 'Video',
    endCall: 'End Call',
    speaker: 'Speaker',
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
  },
};

export default function RoomModal({ isOpen, onClose, onLeave, room, locale }: RoomModalProps) {
  const t = translations[locale];
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(room.callType === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  // ref로 최신 함수 참조 유지
  const onLeaveRef = useRef(onLeave);
  const onCloseRef = useRef(onClose);
  const historyPushedRef = useRef(false);

  useEffect(() => {
    onLeaveRef.current = onLeave;
    onCloseRef.current = onClose;
  }, [onLeave, onClose]);

  // History API - 뒤로가기 처리 (모달이 열릴 때 한 번만 실행)
  useEffect(() => {
    if (!isOpen) {
      historyPushedRef.current = false;
      return;
    }

    if (historyPushedRef.current) {
      logger.log('⏭️ History already pushed, skipping');
      return;
    }

    // 모달 열릴 때 히스토리 추가 (한 번만)
    logger.log('📍 Pushing history state for room:', room.id);
    logger.log('📍 Current history length:', window.history.length);
    logger.log('📍 Current state before push:', window.history.state);
    window.history.pushState({ modal: 'room', roomId: room.id }, '', `/app?room=${room.id}`);
    logger.log('📍 Current history length after push:', window.history.length);
    logger.log('📍 Current state after push:', window.history.state);
    historyPushedRef.current = true;
  }, [isOpen, room.id]);

  // Popstate 이벤트 리스너는 별도 useEffect로 관리
  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = (event: PopStateEvent) => {
      // 브라우저 뒤로가기 했을 때
      logger.log('⬅️ Popstate event triggered:', event.state);
      logger.log('⬅️ Current history state:', window.history.state);

      // room 모달이 아닌 상태로 돌아갔다면 모달 닫기
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

  // 통화 시간 카운터
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // 통화 시간 포맷 (00:00)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    logger.log('🚪 handleClose called, current state:', window.history.state);

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
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
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
        <h1 className="text-white font-semibold text-lg">{room.title}</h1>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        {room.callType === 'audio' ? (
          // Audio Call Layout
          <div className="text-center">
            <div className="mb-8">
              {room.participants.map((participant, index) => (
                <div key={participant.socketId} className={index === 0 ? '' : 'mt-8'}>
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4 overflow-hidden">
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
                  <p className="text-white text-2xl font-semibold mb-2">{participant.nickname}</p>
                  <p className="text-white text-2xl font-semibold mb-2">{participant.userId}</p>
                  <p className="text-white text-2xl font-semibold mb-2">{participant.profileImageUrl}</p>
                  <p className="text-white text-2xl font-semibold mb-2">{participant.gender}</p>
                  <p className="text-white text-2xl font-semibold mb-2">{participant.ageGroup}</p>
                  <p className="text-white text-2xl font-semibold mb-2">{participant.socketId}</p>
                  <p className="text-white text-2xl font-semibold mb-2">{participant.userId}</p>
                  <p className="text-white text-2xl font-semibold mb-2">{participant.userId}</p>
                  {index === 0 && participant.isHost && (
                    <span className="inline-block bg-yellow-500 text-white px-2 py-1 rounded text-xs">Host</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-lg">{formatDuration(callDuration)}</p>
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
      </div>

      {/* Bottom Controls */}
      <div className="bg-gray-800 px-4 py-6">
        <div className="flex justify-center items-center gap-4 max-w-md mx-auto">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`flex flex-col items-center gap-2 px-6 py-3 rounded-full transition-colors ${
              isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              {isMuted ? (
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              )}
            </svg>
            <span className="text-white text-xs">{isMuted ? t.unmute : t.mute}</span>
          </button>

          {/* Video Button (only for video calls) */}
          {room.callType === 'video' && (
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`flex flex-col items-center gap-2 px-6 py-3 rounded-full transition-colors ${
                !isVideoOn ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                {isVideoOn ? (
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                ) : (
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                )}
              </svg>
              <span className="text-white text-xs">{t.video}</span>
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={handleClose}
            className="flex flex-col items-center gap-2 px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            <span className="text-white text-xs">{t.endCall}</span>
          </button>

          {/* Speaker Button */}
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`flex flex-col items-center gap-2 px-6 py-3 rounded-full transition-colors ${
              isSpeakerOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-600 hover:bg-gray-500'
            }`}
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              {isSpeakerOn ? (
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              )}
            </svg>
            <span className="text-white text-xs">{t.speaker}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
