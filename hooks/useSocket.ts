import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import logger from '@/lib/logger';
import { OnlineCount } from '@/types/user';

interface Participant {

  userId: number | null; // 비로그인 사용자는 null
  nickname: string;
  profileImageUrl?: string | null; // 프로필 이미지
  socketId: string;
  isHost: boolean;
  ageGroup?: number | null;
  gender?: string | null;

}

export interface Room {
  id: string;
  title: string;
  hostId: number; // 항상 로그인한 사용자만 호스트 가능
  hostNickname: string;
  hostProfileImage?: string | null; // 호스트 프로필 이미지
  language: 'ko' | 'en' | 'ja';
  topic: 'free' | 'romance' | 'hobby' | 'business' | 'travel';
  callType: 'audio' | 'video'; // 오디오콜 or 비디오콜
  maxParticipants: number; // 현재는 2명 고정
  isPrivate: boolean; // 비공개 방 여부
  password?: string; // 비공개 방 비밀번호
  participants: Participant[];
  createdAt: string; // 최초 방생성 타임
  sessionStartedAt?: Date; // 대화 시작시간
  agoraAppId?: string; // Agora App ID
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: number | null;
  senderNickname: string;
  senderProfileImage?: string | null;
  message: string;
  timestamp: string;
  type?: 'text' | 'stt'; // 메시지 타입: text(수동 입력), stt(음성 인식)
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
  const [messages, setMessages] = useState<ChatMessage[]>([]); // 채팅 메시지
  const [ratingModalData, setRatingModalData] = useState<{ show: boolean; hostUserId?: number; message?: string } | null>(null);
  const [guestBalance, setGuestBalance] = useState<number | undefined>(undefined); // 게스트 잔액
  const [giftNotification, setGiftNotification] = useState<{ senderNickname: string; amount: number } | null>(null); // 선물 알림

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

    const handleRoomJoined = (data: Room & { guestBalance?: number }) => {
      logger.info('👋 Joined room:', data);
      setCurrentRoom(data);
      setMessages([]); // 방 입장 시 메시지 초기화

      // 게스트 잔액 저장
      if (data.guestBalance !== undefined) {
        setGuestBalance(data.guestBalance);
        logger.info(`💰 게스트 잔액: ${data.guestBalance}점`);
      }
    };

    const handleRoomLeft = (data: { roomId: string; showRatingModal?: boolean; hostUserId?: number }) => {
      logger.info('🚪 Left room:', data.roomId);
      setCurrentRoom(null);
      setMessages([]); // 방 나갈 때 메시지 초기화
      setGuestBalance(undefined); // 잔액 초기화


      if (data.showRatingModal && data.hostUserId) {
        logger.info('⭐ Showing rating modal for host:', data.hostUserId);
        setRatingModalData({ show: true, hostUserId: data.hostUserId });
      }
    };

    const handleRoomClosed = (data: { roomId: string; reason: string; message: string; showRatingModal?: boolean; hostUserId?: number }) => {
      logger.warn('⚠️ Room closed:', data.message);

      setCurrentRoom(null);
      setMessages([]); // 방 닫힐 때 메시지 초기화
      setGuestBalance(undefined); // 잔액 초기화

      // 평가 모달 또는 일반 메시지 모달 표시
      if (data.showRatingModal && data.hostUserId) {
        logger.info('⭐ Showing rating modal for host:', data.hostUserId);
        setRatingModalData({ show: true, hostUserId: data.hostUserId, message: data.message });
      } else {
        // alert 대신 ratingModalData로 메시지만 표시
        setRatingModalData({ show: true, message: data.message });
      }
    };

    const handleError = (error: { message: string }) => {
      logger.error('🔴 Socket error:', error.message);
      alert(error.message);
    };

    const handleOnlineCount = (count: OnlineCount) => {
      logger.debug('📊 Online count:', count);
      setOnlineCount(count);
    };

    const handleNewMessage = (message: ChatMessage) => {
      logger.info('💬 New message received:', message);
      logger.info('💬 Current messages count before:', messages.length);
      setMessages((prev) => {
        const newMessages = [...prev, message];
        logger.info('💬 New messages count after:', newMessages.length);
        return newMessages;
      });
    };

    const handlePointsUpdated = (data: { balance: number }) => {
      logger.info('💰 Points updated:', data.balance);
      setGuestBalance(data.balance);
    };

    const handleGiftReceived = (data: { senderNickname: string; amount: number; newBalance: number }) => {
      logger.info('🎁 Gift received:', data);
      setGuestBalance(data.newBalance); // 잔액 업데이트
      setGiftNotification({ senderNickname: data.senderNickname, amount: data.amount }); // 알림 표시
      // 3초 후 알림 자동 제거
      setTimeout(() => setGiftNotification(null), 3000);
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
    socket.on('newMessage', handleNewMessage);
    socket.on('pointsUpdated', handlePointsUpdated);
    socket.on('giftReceived', handleGiftReceived);

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
      socket.off('newMessage', handleNewMessage);
      socket.off('pointsUpdated', handlePointsUpdated);
      socket.off('giftReceived', handleGiftReceived);
    };
  }, [currentRoom]);

  const joinRoom = (roomId: string, nickname?: string, password?: string) => {
    const socket = getSocket();
    logger.info('Joining room:', roomId, nickname, password ? '(with password)' : '');
    socket.emit('joinRoom', { roomId, nickname, password });
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
    roomType: 'audio' | 'video';
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
    profileImageUrl?: string | null;
    ageGroup?: number | null;
    gender?: string | null;
  }) => {
    const socket = getSocket();
    logger.info('Authenticating user:', data.nickname);
    socket.emit('authenticate', data);
  };

  const sendMessage = (roomId: string, message: string, type: 'text' | 'stt' = 'text') => {
    const socket = getSocket();
    logger.info('Sending message to room:', roomId, message, 'type:', type);
    socket.emit('sendMessage', { roomId, message, type });
  };

  return {
    rooms,
    onlineCount,
    currentRoom,
    isConnected,
    messages,
    ratingModalData,
    setRatingModalData,
    guestBalance,
    giftNotification,
    joinRoom,
    leaveRoom,
    createRoom,
    authenticate,
    sendMessage,
  };
}
