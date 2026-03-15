'use client';

import { Room } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';

const translations = {
  ko: {
    host: 'Host',
    guest: 'Guest',
    waitingForOther: '상대방을 기다리는 중...',
  },
  en: {
    host: 'Host',
    guest: 'Guest',
    waitingForOther: 'Waiting for the other person...',
  },
  ja: {
    host: 'Host',
    guest: 'Guest',
    waitingForOther: '相手を待っています...',
  },
};

interface AudioCallViewProps {
  room: Room;
  localVolume: number;
  remoteVolume: number;
  microphones: MediaDeviceInfo[];
  selectedMicId: string;
  changeMicrophone: (deviceId: string) => void;
}

export default function AudioCallView({
  room,
  localVolume,
  remoteVolume,
  microphones,
  selectedMicId,
  changeMicrophone,
}: AudioCallViewProps) {
  const { user } = useAuth();
  const { currentLanguage } = useGlobalSettings();
  const t = translations[currentLanguage];

  // 상대방 찾기 (나를 제외한 참가자)
  const otherParticipant = room.participants.find(p => p.userId !== user?.userId);
  const VOLUME_THRESHOLD = 0.1; // 백그라운드 노이즈 필터링
  const isSpeaking = remoteVolume > VOLUME_THRESHOLD;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
          {/* 참가자 프로필 - 상대방만 표시 */}
          <div className="flex justify-center items-center">
            {otherParticipant ? (
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  {/* 말하는 중일 때 애니메이션 링 */}
                  {isSpeaking && (
                    <>
                      <div className="absolute inset-0 w-32 h-32 rounded-full bg-green-500 opacity-30 animate-ping"></div>
                      <div className="absolute inset-0 w-32 h-32 rounded-full border-4 border-green-400 animate-pulse"></div>
                    </>
                  )}
                  {/* 프로필 이미지 */}
                  <div className={`w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold overflow-hidden ${
                    isSpeaking ? 'ring-4 ring-green-400 shadow-lg shadow-green-500/50' : ''
                  }`}>
                    {otherParticipant.profileImageUrl ? (
                      <img
                        src={otherParticipant.profileImageUrl}
                        alt={otherParticipant.nickname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      otherParticipant.nickname[0].toUpperCase()
                    )}
                  </div>
                </div>
                <p className="text-white text-xl font-semibold mb-2">{otherParticipant.nickname}</p>
                <span className={`inline-block ${otherParticipant.isHost ? 'bg-yellow-500' : 'bg-gray-600'} text-white px-3 py-1 rounded text-sm`}>
                  {otherParticipant.isHost ? t.host : t.guest}
                </span>
              </div>
            ) : (
              // 대기중 화면
              <div className="text-center">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4">
                  <svg className="w-16 h-16 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-white text-xl animate-pulse">{t.waitingForOther}</p>
              </div>
            )}
          </div>

          {/* 마이크 선택 (PC only) */}
          {microphones.length > 1 && (
            <div className="hidden md:flex items-center gap-3 bg-gray-800/50 px-4 py-3 rounded-lg">
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
  );
}
