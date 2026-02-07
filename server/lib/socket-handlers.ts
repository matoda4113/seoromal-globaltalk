import { Server as SocketIOServer, Socket } from 'socket.io';
import logger from "@/lib/logger";

// 사용자 타입 정의
interface AuthenticatedUser {
  socketId: string;
  userId: number;
  email: string;
  nickname: string;
  profileImageUrl?: string | null;
  ageGroup?: number | null;
  gender?: string | null;
}

interface AnonymousUser {
  socketId: string;
  connectedAt: Date;
}

// 참가자 정보 타입
interface Participant {
  userId: number | null; // 비로그인 사용자는 null
  nickname: string;
  profileImageUrl?: string | null; // 프로필 이미지
  socketId: string;
  isHost: boolean;
  ageGroup?: number | null;
  gender?: string | null;
}

// 방 정보 타입
interface Room {
  id: string;
  title: string;
  hostId: number; // 항상 로그인한 사용자만 호스트 가능
  hostNickname: string;
  hostProfileImage?: string | null; // 호스트 프로필 이미지
  language: string; // korean, english, japanese
  topic: string; // free, romance, hobby, business, travel
  callType: 'audio' | 'video'; // 오디오콜 or 비디오콜
  maxParticipants: number; // 현재는 2명 고정
  isPrivate: boolean; // 비공개 방 여부
  password?: string; // 비공개 방 비밀번호
  participants: Participant[];
  createdAt: string; // 최초 방생성 타임
  sessionStartedAt?: Date; // 대화 시작시간
}

export function initializeSocketHandlers(io: SocketIOServer) {
  // 연결된 사용자 관리
  const authenticatedUsers = new Map<number, AuthenticatedUser>(); // userId -> user (중복 제거됨)
  const userSocketIds = new Map<string, number>(); // socketId -> userId (disconnect 시 필요)
  const anonymousUsers = new Map<string, AnonymousUser>(); // socketId -> anonymous

  // 방 목록 (임시 - 나중에 Redis로 변경)
  const rooms = new Map<string, Room>();

  // 온라인 사용자 수 및 목록 브로드캐스트
  function broadcastOnlineCount() {
    const totalOnline = authenticatedUsers.size + anonymousUsers.size;

    // 로그인한 사용자 목록 (닉네임, 프로필 이미지 포함)
    // authenticatedUsers는 이미 userId를 키로 사용하므로 중복 없음
    const authenticatedUserList = Array.from(authenticatedUsers.values()).map(user => ({
      userId: user.userId,
      nickname: user.nickname,
      profileImageUrl: user.profileImageUrl,
      ageGroup: user.ageGroup,
      gender: user.gender,
    }));

    io.emit('onlineCount', {
      total: totalOnline,
      authenticated: authenticatedUsers.size,
      anonymous: anonymousUsers.size,
      authenticatedUsers: authenticatedUserList,
    });
  }

  // Room 객체 직렬화
  function serializeRoom(room: Room) {
    return {
      ...room,
    };
  }

  // 사용자가 방을 나갈 때 처리 (leaveRoom, disconnect 공통 로직)
  function handleUserLeaveRoom(
    socketId: string,
    reason: 'left' | 'disconnected'
  ): { roomId: string; wasHost: boolean } | null {
    for (const [roomId, room] of rooms.entries()) {
      const participantIndex = room.participants.findIndex((p) => p.socketId === socketId);

      if (participantIndex !== -1) {
        const participant = room.participants[participantIndex];
        const isHost = participant.isHost;

        if (isHost) {
          // 호스트가 나감 - 방 삭제
          logger.log(`🗑️ Room deleted: ${room.title} (host ${reason})`);

          room.participants.forEach((p) => {
            io.to(p.socketId).emit('roomClosed', {
              roomId: room.id,
              reason: reason === 'left' ? 'host_left' : 'host_disconnected',
              message: reason === 'left'
                ? '호스트가 방을 나가 세션이 종료되었습니다.'
                : '호스트의 연결이 끊어져 세션이 종료되었습니다.',
            });
          });

          rooms.delete(roomId);
          io.emit('roomDeleted', roomId);
        } else {
          // 게스트가 나감 - 참가자 목록에서 제거
          room.participants.splice(participantIndex, 1);
          room.sessionStartedAt = undefined;
          logger.log(`👋 ${participant.nickname} ${reason} room: ${room.title}`);

          rooms.set(roomId, room);

          room.participants.forEach((p) => {
            io.to(p.socketId).emit('roomUpdated', serializeRoom(room));
          });

          io.emit('roomListUpdated', serializeRoom(room));
        }

        return { roomId, wasHost: isHost };
      }
    }

    return null;
  }

  io.on('connection', (socket: Socket) => {
    logger.log(`✅ Client connected: ${socket.id}`);

    // 익명 사용자로 우선 등록
    anonymousUsers.set(socket.id, {
      socketId: socket.id,
      connectedAt: new Date(),
    });
    logger.log(`👤 Anonymous user connected: ${socket.id}`);
    logger.log(`📊 Total: ${authenticatedUsers.size} authenticated, ${anonymousUsers.size} anonymous`);

    // 온라인 카운트 브로드캐스트
    broadcastOnlineCount();


    // 사용자 인증 (로그인한 경우)
    socket.on('authenticate', (data: {
      userId: number;
      email: string;
      nickname: string;
      profileImageUrl?: string | null;
      ageGroup?: number | null;
      gender?: string | null;
    }) => {
      if (data.userId && data.email && data.nickname) {
        // 익명 → 인증 전환
        if (anonymousUsers.has(socket.id)) {
          anonymousUsers.delete(socket.id);
          logger.log(`🔄 익명 → 인증 전환: ${data.nickname} (${socket.id})`);
        }

        // 로그인한 사용자로 등록 (userId를 키로 사용 -> 중복 제거됨)
        authenticatedUsers.set(data.userId, {
          socketId: socket.id,
          userId: data.userId,
          email: data.email,
          nickname: data.nickname,
          profileImageUrl: data.profileImageUrl,
          ageGroup: data.ageGroup,
          gender: data.gender,
        });
        userSocketIds.set(socket.id, data.userId);
        logger.log(`🔐 Authenticated user: ${data.nickname} (userId: ${data.userId}, socketId: ${socket.id}) - age: ${data.ageGroup}, gender: ${data.gender}`);
        logger.log(`📊 Total: ${authenticatedUsers.size} unique authenticated users, ${anonymousUsers.size} anonymous`);

        // 온라인 사용자 수 브로드캐스트
        broadcastOnlineCount();
      }
    });

    // 방 목록 요청 (로그인/비로그인 모두 가능)
    socket.on('getRooms', () => {
      const roomList = Array.from(rooms.values())
        .filter((room) => room.participants.length < room.maxParticipants)
        .map(serializeRoom);
      socket.emit('roomList', roomList);
      logger.log(`📋 Room list sent to ${socket.id}: ${roomList.length} rooms`);
    });

    // 온라인 카운트 요청
    socket.on('getOnlineCount', () => {
      const totalOnline = authenticatedUsers.size + anonymousUsers.size;
      const authenticatedUserList = Array.from(authenticatedUsers.values()).map(user => ({
        userId: user.userId,
        nickname: user.nickname,
        profileImageUrl: user.profileImageUrl,
        ageGroup: user.ageGroup,
        gender: user.gender,
      }));

      socket.emit('onlineCount', {
        total: totalOnline,
        authenticated: authenticatedUsers.size,
        anonymous: anonymousUsers.size,
        authenticatedUsers: authenticatedUserList,
      });
      logger.log(`📊 Online count sent to ${socket.id}: ${totalOnline} users`);
    });

    // 방 만들기 (로그인 필수)
    socket.on('createRoom', (data: {
      title: string;
      language: string;
      topic: string;
      roomType: 'voice' | 'video';
      isPrivate: boolean;
      password?: string;
    }) => {
      // socketId로 userId를 찾아서, userId로 user 조회
      const userId = userSocketIds.get(socket.id);
      const user = userId ? authenticatedUsers.get(userId) : null;

      if (!user) {
        socket.emit('error', { message: '방을 만들려면 로그인이 필요합니다.' });
        return;
      }

      // 비공개 방인 경우 비밀번호 검증
      if (data.isPrivate && !data.password) {
        socket.emit('error', { message: '비공개 방은 비밀번호가 필요합니다.' });
        return;
      }

      // 이미 참가 중인 방이 있는지 확인
      const existingRoom = Array.from(rooms.values()).find((room) =>
        room.participants.some((p) => p.socketId === socket.id)
      );

      if (existingRoom) {
        socket.emit('error', { message: '이미 참가 중인 방이 있습니다. 하나의 방만 참가할 수 있습니다.' });
        return;
      }

      const room: Room = {
        id: `room_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        title: data.title,
        hostId: user.userId,
        hostNickname: user.nickname,
        hostProfileImage: user.profileImageUrl,
        language: data.language,
        topic: data.topic,
        callType: data.roomType === 'voice' ? 'audio' : 'video',
        maxParticipants: 2,
        isPrivate: data.isPrivate,
        password: data.isPrivate ? data.password : undefined,
        participants: [
          {
            userId: user.userId,
            nickname: user.nickname,
            profileImageUrl: user.profileImageUrl,
            socketId: socket.id,
            isHost: true,
            ageGroup: user.ageGroup,
            gender :user.gender,
          },
        ],
        createdAt: new Date().toISOString(),
      };

      rooms.set(room.id, room);
      const privacyLabel = data.isPrivate ? '비공개' : '공개';
      logger.log(`🏠 Room created: ${room.title} by ${user.nickname} (${data.roomType}, ${privacyLabel})`);

      // 방 생성자에게 성공 응답
      socket.emit('roomCreated', { roomId: room.id });

      // 호스트를 방에 자동으로 입장시킴
      socket.emit('roomJoined', serializeRoom(room));
      logger.log(`👋 Host auto-joined room: ${room.title}`);

      // 모든 클라이언트에게 새 방 알림
      io.emit('roomListUpdated', serializeRoom(room));
    });

    // 방 입장 (로그인 유저만 가능)
    socket.on('joinRoom', (data: { roomId: string; nickname?: string }) => {
      const userId = userSocketIds.get(socket.id);
      const authUser = userId ? authenticatedUsers.get(userId) : null;

      // 로그인하지 않은 경우 팅김
      if (!authUser) {
        socket.emit('error', { message: '로그인 이후 방 입장 가능합니다.' });
        return;
      }

      // 이미 다른 방에 참가 중인지 체크
      for (const [roomId, existingRoom] of rooms.entries()) {
        if (existingRoom.participants.some((p) => p.socketId === socket.id)) {
          socket.emit('error', { message: '이미 다른 방에 참가 중입니다.' });
          return;
        }
      }

      const room = rooms.get(data.roomId);

      if (!room) {
        socket.emit('error', { message: '방을 찾을 수 없습니다.' });
        return;
      }

      // 정원 체크
      if (room.participants.length >= room.maxParticipants) {
        socket.emit('error', { message: '방이 가득 찼습니다.' });
        return;
      }

      // 참가자 추가
      const newParticipant: Participant = {
        userId: authUser?.userId || null,
        nickname: authUser?.nickname || data.nickname || 'Guest',
        profileImageUrl: authUser?.profileImageUrl || null,
        socketId: socket.id,
        isHost: false,
        ageGroup: authUser?.ageGroup || null,
        gender: authUser?.gender || null

      };

      room.participants.push(newParticipant);
      logger.log(`👋 User ${newParticipant.nickname} joined room: ${room.title}`);
      logger.log(`👥 현재 참가자 목록 (${room.participants.length}/${room.maxParticipants}):`);

      // 2명이 모였으면 세션 시작
      if (room.participants.length === 2 && !room.sessionStartedAt) {
        room.sessionStartedAt = new Date();
        logger.log(`🎤 세션 시작: ${room.title} (${room.callType})`);
      }

      rooms.set(room.id, room);

      // 입장한 사용자에게 방 정보 전송
      socket.emit('roomJoined', serializeRoom(room));

      // 방의 모든 참가자에게 업데이트 알림
      room.participants.forEach((p) => {
        io.to(p.socketId).emit('roomUpdated', serializeRoom(room));
      });

      // 모든 클라이언트에게 방 목록 업데이트
      io.emit('roomListUpdated', serializeRoom(room));
    });

    // 방 나가기
    socket.on('leaveRoom', (data: { roomId: string }) => {
      const room = rooms.get(data.roomId);

      if (!room) {
        socket.emit('error', { message: '방을 찾을 수 없습니다.' });
        return;
      }

      const participantIndex = room.participants.findIndex((p) => p.socketId === socket.id);

      if (participantIndex === -1) {
        socket.emit('error', { message: '방에 참가하지 않았습니다.' });
        return;
      }

      // 공통 로직 호출
      const result = handleUserLeaveRoom(socket.id, 'left');

      // 나간 사용자에게 성공 응답
      if (result) {
        socket.emit('roomLeft', { roomId: result.roomId });
      }
    });



    // 연결 해제
    socket.on('disconnect', () => {
      const userId = userSocketIds.get(socket.id);
      const authUser = userId ? authenticatedUsers.get(userId) : null;
      const anonUser = anonymousUsers.get(socket.id);

      if (authUser && userId) {
        logger.log(`❌ Authenticated user disconnected: ${authUser.nickname} (userId: ${userId}, socketId: ${socket.id})`);
        authenticatedUsers.delete(userId);
        userSocketIds.delete(socket.id);
      } else if (anonUser) {
        logger.log(`❌ Anonymous user disconnected: ${socket.id}`);
        anonymousUsers.delete(socket.id);
      }

      // 참가 중인 방에서 제거 (공통 로직 호출)
      handleUserLeaveRoom(socket.id, 'disconnected');

      logger.log(`📊 Total: ${authenticatedUsers.size} authenticated, ${anonymousUsers.size} anonymous`);

      // 온라인 사용자 수 브로드캐스트
      broadcastOnlineCount();
    });
  });

  logger.log('✅ Socket.io handlers initialized');
}
