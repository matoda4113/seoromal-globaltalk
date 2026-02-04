import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import logger from '@/lib/logger';

interface Participant {
  userId: number | null; // 비로그인 사용자는 null
  nickname: string;
  socketId: string;
  isHost: boolean;
}

export interface Room {
  id: string;
  title: string;
  hostId: number;
  hostNickname: string;
  hostProfileImage?: string | null;
  language: string; // korean, english, japanese
  topic: string; // free, romance, hobby, business, travel
  callType: 'audio' | 'video';
  maxParticipants: number;
  isPrivate: boolean;
  password?: string;
  participants: Participant[];
  createdAt: string;
  sessionStartedAt?: string;
}

interface AuthenticatedUser {
  userId: number;
  nickname: string;
  profile_image_url?: string | null;
  age_group?: number | null;
  gender?: string | null;
}

interface OnlineCount {
  total: number;
  authenticated: number;
  anonymous: number;
  authenticatedUsers: AuthenticatedUser[];
}

export function useSocket() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [onlineCount, setOnlineCount] = useState<OnlineCount>({
    total: 0,
    authenticated: 0,
    anonymous: 0,
    authenticatedUsers: [],
  });
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      logger.info('✅ Socket connected:', socket.id);
      setIsConnected(true);
      // 방 목록 요청
      socket.emit('getRooms');
    };

    const handleDisconnect = () => {
      logger.warn('❌ Socket disconnected');
      setIsConnected(false);
    };

    const handleRoomList = (roomList: Room[]) => {
      logger.debug('📋 Received room list:', roomList);
      setRooms(roomList);
    };

    const handleRoomCreated = (data: { roomId: string }) => {
      logger.info('🏠 Room created successfully:', data.roomId);
      // 방 목록 재요청
      socket.emit('getRooms');
    };

    const handleRoomDeleted = (roomId: string) => {
      logger.info('🗑️ Room deleted:', roomId);
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
    };

    const handleRoomUpdated = (updatedRoom: Room) => {
      logger.debug('🔄 Room updated:', updatedRoom);
      setRooms((prev) =>
        prev.map((room) => (room.id === updatedRoom.id ? updatedRoom : room))
      );
      if (currentRoom?.id === updatedRoom.id) {
        setCurrentRoom(updatedRoom);
      }
    };

    const handleRoomListUpdated = (room: Room) => {
      logger.debug('📝 Room list updated:', room);
      setRooms((prev) => {
        const index = prev.findIndex((r) => r.id === room.id);
        if (index !== -1) {
          // 기존 방 업데이트
          const newRooms = [...prev];
          newRooms[index] = room;
          return newRooms;
        }
        // 새 방 추가
        return [room, ...prev];
      });
    };

    const handleRoomJoined = (room: Room) => {
      logger.info('👋 Joined room:', room);
      setCurrentRoom(room);
    };

    const handleRoomLeft = (data: { roomId: string }) => {
      logger.info('🚪 Left room:', data.roomId);
      setCurrentRoom(null);
    };

    const handleRoomClosed = (data: { roomId: string; reason: string; message: string }) => {
      logger.warn('⚠️ Room closed:', data.message);
      alert(data.message);
      setCurrentRoom(null);
    };

    const handleError = (error: { message: string }) => {
      logger.error('🔴 Socket error:', error.message);
      alert(error.message);
    };

    const handleOnlineCount = (count: OnlineCount) => {
      logger.debug('📊 Online count:', count);
      setOnlineCount(count);
    };

    // 이벤트 리스너 등록
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('roomList', handleRoomList);
    socket.on('roomCreated', handleRoomCreated);
    socket.on('roomDeleted', handleRoomDeleted);
    socket.on('roomUpdated', handleRoomUpdated);
    socket.on('roomListUpdated', handleRoomListUpdated);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('roomLeft', handleRoomLeft);
    socket.on('roomClosed', handleRoomClosed);
    socket.on('error', handleError);
    socket.on('onlineCount', handleOnlineCount);

    // 이미 연결되어 있다면 즉시 방 목록 요청 및 온라인 카운트 요청
    if (socket.connected) {
      logger.info('Socket already connected, requesting initial data');
      setIsConnected(true);
      socket.emit('getRooms');
      // 서버에 온라인 카운트 재전송 요청
      socket.emit('getOnlineCount');
    }

    // 클린업
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('roomList', handleRoomList);
      socket.off('roomCreated', handleRoomCreated);
      socket.off('roomDeleted', handleRoomDeleted);
      socket.off('roomUpdated', handleRoomUpdated);
      socket.off('roomListUpdated', handleRoomListUpdated);
      socket.off('roomJoined', handleRoomJoined);
      socket.off('roomLeft', handleRoomLeft);
      socket.off('roomClosed', handleRoomClosed);
      socket.off('error', handleError);
      socket.off('onlineCount', handleOnlineCount);
    };
  }, [currentRoom]);

  const joinRoom = (roomId: string, nickname?: string) => {
    const socket = getSocket();
    logger.info('Joining room:', roomId, nickname);
    socket.emit('joinRoom', { roomId, nickname });
  };

  const leaveRoom = (roomId: string) => {
    const socket = getSocket();
    logger.info('Leaving room:', roomId);
    socket.emit('leaveRoom', { roomId });
  };

  const createRoom = (data: {
    title: string;
    language: string;
    topic: string;
    roomType: 'voice' | 'video';
    isPrivate: boolean;
    password?: string;
  }) => {
    const socket = getSocket();
    logger.info('Creating room:', data);
    socket.emit('createRoom', data);
  };

  const authenticate = (data: {
    userId: number;
    email: string;
    nickname: string;
    age_group?: number | null;
    gender?: string | null;
  }) => {
    const socket = getSocket();
    logger.info('Authenticating user:', data.nickname);
    socket.emit('authenticate', data);
  };

  return {
    rooms,
    onlineCount,
    currentRoom,
    isConnected,
    joinRoom,
    leaveRoom,
    createRoom,
    authenticate,
  };
}
