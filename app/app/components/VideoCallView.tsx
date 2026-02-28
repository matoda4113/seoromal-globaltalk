'use client';

import { useState, useEffect } from 'react';
import { Room } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import type { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import type { ILocalVideoTrack } from 'agora-rtc-sdk-ng';

const translations = {
  ko: {
    waitingForOther: '상대방을 기다리는 중...',
  },
  en: {
    waitingForOther: 'Waiting for the other person...',
  },
  ja: {
    waitingForOther: '相手を待っています...',
  },
};

interface VideoCallViewProps {
  room: Room;
  localVideoRef: React.RefObject<HTMLDivElement | null>;
  remoteVideoRef: React.RefObject<HTMLDivElement | null>;
  localVideoTrack: ILocalVideoTrack | null;
  remoteUsers: IAgoraRTCRemoteUser[];
  microphones: MediaDeviceInfo[];
  cameras: MediaDeviceInfo[];
  selectedMicId: string;
  selectedCameraId: string;
  changeMicrophone: (deviceId: string) => void;
  changeCamera: (deviceId: string) => void;
  isScreenSharing: boolean;
  toggleScreenShare: () => void;
  screenShareLabel: string;
}

export default function VideoCallView({
  room,
  localVideoRef,
  remoteVideoRef,
  localVideoTrack,
  remoteUsers,
  microphones,
  cameras,
  selectedMicId,
  selectedCameraId,
  changeMicrophone,
  changeCamera,
  isScreenSharing,
  toggleScreenShare,
  screenShareLabel,
}: VideoCallViewProps) {
  const { user } = useAuth();
  const { currentLanguage } = useGlobalSettings();
  const t = translations[currentLanguage];
  const [isPipMode, setIsPipMode] = useState(true);
  const [remoteVideoFit, setRemoteVideoFit] = useState<'cover' | 'contain'>('cover');

  // 상대방 비디오 object-fit 적용
  useEffect(() => {
    if (remoteVideoRef.current) {
      const videoElement = remoteVideoRef.current.querySelector('video');
      if (videoElement) {
        videoElement.style.objectFit = remoteVideoFit;
      }
    }
  }, [remoteVideoFit, remoteUsers]);

  // PIP 모드 전환 시 비디오 재연결 (prop으로 받은 함수 호출)
  const handlePipToggle = (newMode: boolean) => {
    setIsPipMode(newMode);

    // DOM 재렌더링 후 비디오 재연결
    setTimeout(() => {
      if (localVideoTrack && localVideoRef.current) {
        localVideoTrack.play(localVideoRef.current);
      }
      if (remoteUsers.length > 0 && remoteUsers[0].videoTrack && remoteVideoRef.current) {
        remoteUsers[0].videoTrack.play(remoteVideoRef.current);
      }
    }, 50);
  };

  return (
    <>
      {isPipMode ? (
          // PIP 모드: 상대방 전체화면 + 내 화면 작은 창
          <>
            {/* 상대방 비디오 - 전체 화면 */}
            <div className="absolute inset-0 bg-gray-900">
              <div
                ref={remoteVideoRef}
                className="w-full h-full [&>video]:w-full [&>video]:h-full"
              />
              {/* 상대방이 없거나 비디오가 없을 때 플레이스홀더 */}
              {(!remoteUsers || remoteUsers.length === 0 || !remoteUsers[0]?.videoTrack) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
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
                    <p className="text-white text-xl">{room.participants[1]?.nickname || t.waitingForOther}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 내 비디오 - PIP (왼쪽 아래) */}
            <div className="absolute bottom-4 left-4 w-32 h-48 md:w-48 md:h-64 bg-gray-800 rounded-lg overflow-hidden shadow-2xl z-10 border-2 border-white/30">
              <div
                ref={localVideoRef}
                className={`w-full h-full [&>video]:w-full [&>video]:h-full ${
                  isScreenSharing ? '[&>video]:object-contain' : '[&>video]:object-cover'
                }`}
              />
              {/* 로컬 비디오가 없을 때 플레이스홀더 */}
              {!localVideoTrack && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                      {user?.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={user.nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.nickname?.[0]?.toUpperCase() || 'Y'
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PIP 모드 컨트롤 버튼들 - 하단 오른쪽 */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3">
              {/* 상대방 화면 fit 토글 버튼 */}
              <button
                onClick={() => setRemoteVideoFit(remoteVideoFit === 'cover' ? 'contain' : 'cover')}
                className={`${
                  remoteVideoFit === 'contain'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-gray-900/80 hover:bg-gray-800'
                } backdrop-blur-sm text-white p-3 rounded-full transition-colors shadow-lg`}
                title={remoteVideoFit === 'cover' ? '전체 화면 보기' : '화면 맞춤'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>

              {/* 화면 공유 버튼 */}
              <button
                onClick={toggleScreenShare}
                className={`${
                  isScreenSharing
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-900/80 hover:bg-gray-800'
                } backdrop-blur-sm text-white p-3 rounded-full transition-colors shadow-lg`}
                title={screenShareLabel}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>

              {/* PIP 모드 토글 버튼 */}
              <button
                onClick={() => handlePipToggle(false)}
                className="bg-gray-900/80 backdrop-blur-sm text-white p-3 rounded-full hover:bg-gray-800 transition-colors shadow-lg"
                title="분할 화면으로 전환"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                </svg>
              </button>
            </div>

            {/* 마이크 & 카메라 선택 - PIP 창 위 (PC only) */}
            {(microphones.length > 1 || cameras.length > 1) && (
              <div className="hidden md:block absolute bottom-[17rem] left-4 z-30">
                <div className="flex flex-col gap-2 bg-gray-900/80 backdrop-blur-sm px-3 py-2 rounded-lg">
                  {/* 마이크 선택 */}
                  {microphones.length > 1 && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                      <select
                        value={selectedMicId}
                        onChange={(e) => changeMicrophone(e.target.value)}
                        className="bg-gray-800 text-white text-xs px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {microphones.map((mic) => (
                          <option key={mic.deviceId} value={mic.deviceId}>
                            {mic.label || `마이크 ${mic.deviceId.slice(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* 카메라 선택 */}
                  {cameras.length > 1 && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      <select
                        value={selectedCameraId}
                        onChange={(e) => changeCamera(e.target.value)}
                        className="bg-gray-800 text-white text-xs px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {cameras.map((camera) => (
                          <option key={camera.deviceId} value={camera.deviceId}>
                            {camera.label || `카메라 ${camera.deviceId.slice(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          // 분할 화면 모드: 데스크톱 좌우, 모바일 상하
          <div className="flex flex-col md:flex-row w-full h-full">
            {/* 상대방 비디오 (데스크톱: 왼쪽, 모바일: 위) */}
            <div className="flex-1 bg-gray-900 relative overflow-hidden">
              <div
                ref={remoteVideoRef}
                className="w-full h-full [&>video]:w-full [&>video]:h-full"
              />
              {/* 상대방이 없거나 비디오가 없을 때 플레이스홀더 */}
              {(!remoteUsers || remoteUsers.length === 0 || !remoteUsers[0]?.videoTrack) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
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
                    <p className="text-white text-xl">{room.participants[1]?.nickname || t.waitingForOther}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 내 비디오 (데스크톱: 오른쪽, 모바일: 아래) */}
            <div className="flex-1 bg-gray-800 relative overflow-hidden">
              <div
                ref={localVideoRef}
                className={`w-full h-full [&>video]:w-full [&>video]:h-full ${
                  isScreenSharing ? '[&>video]:object-contain' : '[&>video]:object-cover'
                }`}
              />
              {/* 로컬 비디오가 없을 때 플레이스홀더 */}
              {!localVideoTrack && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4 overflow-hidden">
                      {user?.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={user.nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.nickname?.[0]?.toUpperCase() || 'Y'
                      )}
                    </div>
                    <p className="text-white text-xl">{user?.nickname}</p>
                  </div>
                </div>
              )}

              {/* 마이크 & 카메라 선택 (PC only) */}
              {(microphones.length > 1 || cameras.length > 1) && (
                <div className="hidden md:block absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="flex items-center gap-3 bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-lg">
                    {/* 마이크 선택 */}
                    {microphones.length > 1 && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                        <select
                          value={selectedMicId}
                          onChange={(e) => changeMicrophone(e.target.value)}
                          className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {microphones.map((mic) => (
                            <option key={mic.deviceId} value={mic.deviceId}>
                              {mic.label || `마이크 ${mic.deviceId.slice(0, 8)}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* 카메라 선택 */}
                    {cameras.length > 1 && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        <select
                          value={selectedCameraId}
                          onChange={(e) => changeCamera(e.target.value)}
                          className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {cameras.map((camera) => (
                            <option key={camera.deviceId} value={camera.deviceId}>
                              {camera.label || `카메라 ${camera.deviceId.slice(0, 8)}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 컨트롤 버튼들 - 하단 오른쪽 */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3">
              {/* 상대방 화면 fit 토글 버튼 */}
              <button
                onClick={() => setRemoteVideoFit(remoteVideoFit === 'cover' ? 'contain' : 'cover')}
                className={`${
                  remoteVideoFit === 'contain'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-gray-900/80 hover:bg-gray-800'
                } backdrop-blur-sm text-white p-3 rounded-full transition-colors shadow-lg`}
                title={remoteVideoFit === 'cover' ? '전체 화면 보기' : '화면 맞춤'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>

              {/* 화면 공유 버튼 */}
              <button
                onClick={toggleScreenShare}
                className={`${
                  isScreenSharing
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-900/80 hover:bg-gray-800'
                } backdrop-blur-sm text-white p-3 rounded-full transition-colors shadow-lg`}
                title={screenShareLabel}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>

              {/* PIP 모드 토글 버튼 */}
              <button
                onClick={() => handlePipToggle(true)}
                className="bg-gray-900/80 backdrop-blur-sm text-white p-3 rounded-full hover:bg-gray-800 transition-colors shadow-lg"
                title="PIP 모드로 전환"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        )}
    </>
  );
}
