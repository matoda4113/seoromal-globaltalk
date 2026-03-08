'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSocket } from '@/hooks/useSocket';
import type { Room, ChatMessage } from '@/hooks/useSocket';
import type { OnlineCount } from '@/types/user';

interface SocketContextType {
  rooms: Room[];
  onlineCount: OnlineCount;
  currentRoom: Room | null;
  isConnected: boolean;
  messages: ChatMessage[];
  ratingModalData: { show: boolean; hostUserId?: number; message?: string } | null;
  setRatingModalData: (data: { show: boolean; hostUserId?: number; message?: string } | null) => void;
  guestBalance: number | undefined;
  giftNotification: { senderNickname: string; amount: number } | null;
  joinRoom: (roomId: string, nickname?: string, password?: string) => void;
  leaveRoom: (roomId: string) => void;
  createRoom: (data: {
    title: string;
    language: string;
    topic: string;
    roomType: 'audio' | 'video';
    isPrivate: boolean;
    password?: string;
  }) => void;
  authenticate: (data: {
    userId: number;
    email: string;
    nickname: string;
    profileImageUrl?: string | null;
    ageGroup?: number | null;
    gender?: string | null;
  }) => void;
  sendMessage: (roomId: string, message: string, type?: 'text' | 'stt') => void;
  updateRoomTitle: (roomId: string, newTitle: string) => void;
  refreshOnlineCount: (page?: number, limit?: number) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socket = useSocket();

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return context;
}
