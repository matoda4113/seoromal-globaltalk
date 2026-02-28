'use client';

import { Room } from '@/hooks/useSocket';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';

const translations = {
  ko: {
    joinRoom: '입장하기',
    participants: '명 참여 중',
    alreadyJoined: '참가 중',
    filters: {
      ko: '한국어',
      en: '영어',
      ja: '일본어',
      free: '자유',
      romance: '연애',
      hobby: '취미',
      business: '비즈니스',
      travel: '여행',
    },
  },
  en: {
    joinRoom: 'Join',
    participants: 'participants',
    alreadyJoined: 'Joined',
    filters: {
      ko: 'Korean',
      en: 'English',
      ja: 'Japanese',
      free: 'Free Talk',
      romance: 'Romance',
      hobby: 'Hobby',
      business: 'Business',
      travel: 'Travel',
    },
  },
  ja: {
    joinRoom: '入室する',
    participants: '人参加中',
    alreadyJoined: '参加中',
    filters: {
      ko: '韓国語',
      en: '英語',
      ja: '日本語',
      free: '自由',
      romance: '恋愛',
      hobby: '趣味',
      business: 'ビジネス',
      travel: '旅行',
    },
  },
};

interface RoomCardProps {
  room: Room;
  onJoin: (roomId: string) => void;
  currentUserId?: number | null; // 현재 로그인한 사용자 ID
}

export default function RoomCard({
  room,
  onJoin,
  currentUserId,
}: RoomCardProps) {
  const { currentLanguage } = useGlobalSettings();
  const t = translations[currentLanguage];

  // 이미 참가 중인지 확인
  const isAlreadyJoined = room.participants.some(p => p.userId === currentUserId);
  const isFull = room.participants.length >= room.maxParticipants;

  const languageText = t.filters[room.language as keyof typeof t.filters] as string;
  const topicText = t.filters[room.topic as keyof typeof t.filters] as string;
  return (
    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
      {/* Room Title */}
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-base font-bold text-gray-900 line-clamp-1 flex-1">
          {room.title}
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Call Type Icon */}
          {room.callType === 'audio' ? (
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          )}
          {/* Lock Icon */}
          {room.isPrivate && (
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>

      {/* Host Info */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
          {room.hostProfileImage ? (
            <img
              src={room.hostProfileImage}
              alt={room.hostNickname}
              className="w-full h-full object-cover"
            />
          ) : (
            room.hostNickname[0].toUpperCase()
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500">Host</p>
          <p className="text-sm font-semibold text-gray-700">{room.hostNickname}</p>
        </div>
      </div>

      {/* Tags (Language & Topic) */}
      <div className="mb-3 flex gap-2">
        <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
          {languageText}
        </span>
        <span className="inline-block bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
          {topicText}
        </span>
      </div>

      {/* Bottom Section */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-600">
          {room.participants.length}/{room.maxParticipants} {t.participants}
        </div>
        <button
          onClick={() => onJoin(room.id)}
          disabled={isFull || isAlreadyJoined}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors active:scale-95 min-h-[40px] disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isAlreadyJoined ? t.alreadyJoined : t.joinRoom}
        </button>
      </div>
    </div>
  );
}
