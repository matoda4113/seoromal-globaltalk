import { Server as SocketIOServer, Socket } from 'socket.io';
import logger from "@/lib/logger";

// 사용자 타입 정의
interface AuthenticatedUser {
  socketId: string;
  userId: number;
  email: string;
  nickname: string;
  age_group?: number | null;
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
  socketId: string;
  isHost: boolean;
}

// 방 정보 타입
interface Room {
  id: string;
  title: string;
  hostId: number; // 항상 로그인한 사용자만 호스트 가능
  hostNickname: string;
  language: string; // korean, english, japanese
  topic: string; // free, romance, hobby, business, travel
  callType: 'audio' | 'video'; // 오디오콜 or 비디오콜
  maxParticipants: number; // 현재는 2명 고정
  participants: Participant[];
  createdAt: string;
  sessionStartedAt?: Date; // 2명이 모였을 때 세션 시작 시간
}

export function initializeSocketHandlers(io: SocketIOServer) {
  // 연결된 사용자 관리
  const authenticatedUsers = new Map<string, AuthenticatedUser>(); // socketId -> user
  const anonymousUsers = new Map<string, AnonymousUser>(); // socketId -> anonymous

  // 방 목록 (임시 - 나중에 Redis로 변경)
  const rooms = new Map<string, Room>();

  // 온라인 사용자 수 및 목록 브로드캐스트
  function broadcastOnlineCount() {
    const totalOnline = authenticatedUsers.size + anonymousUsers.size;

    // 로그인한 사용자 목록 (닉네임만)
    const authenticatedUserList = Array.from(authenticatedUsers.values()).map(user => ({
      userId: user.userId,
      nickname: user.nickname,
      age_group: user.age_group,
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

    // 새로 접속한 클라이언트에게도 즉시 온라인 카운트 전송
    const totalOnline = authenticatedUsers.size + anonymousUsers.size;
    const authenticatedUserList = Array.from(authenticatedUsers.values()).map(user => ({
      userId: user.userId,
      nickname: user.nickname,
      age_group: user.age_group,
      gender: user.gender,
    }));
    socket.emit('onlineCount', {
      total: totalOnline,
      authenticated: authenticatedUsers.size,
      anonymous: anonymousUsers.size,
      authenticatedUsers: authenticatedUserList,
    });

    // 사용자 인증 (로그인한 경우)
    socket.on('authenticate', (data: {
      userId: number;
      email: string;
      nickname: string;
      age_group?: number | null;
      gender?: string | null;
    }) => {
      if (data.userId && data.email && data.nickname) {
        // 익명 → 인증 전환
        if (anonymousUsers.has(socket.id)) {
          anonymousUsers.delete(socket.id);
          logger.log(`🔄 익명 → 인증 전환: ${data.nickname} (${socket.id})`);
        }

        // 로그인한 사용자로 등록
        authenticatedUsers.set(socket.id, {
          socketId: socket.id,
          userId: data.userId,
          email: data.email,
          nickname: data.nickname,
          age_group: data.age_group,
          gender: data.gender,
        });
        logger.log(`🔐 Authenticated user: ${data.nickname} (${socket.id}) - age: ${data.age_group}, gender: ${data.gender}`);
        logger.log(`📊 Total: ${authenticatedUsers.size} authenticated, ${anonymousUsers.size} anonymous`);

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
        age_group: user.age_group,
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
      callType: 'audio' | 'video';
    }) => {
      const user = authenticatedUsers.get(socket.id);

      if (!user) {
        socket.emit('error', { message: '방을 만들려면 로그인이 필요합니다.' });
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
        language: data.language,
        topic: data.topic,
        callType: data.callType,
        maxParticipants: 2,
        participants: [
          {
            userId: user.userId,
            nickname: user.nickname,
            socketId: socket.id,
            isHost: true,
          },
        ],
        createdAt: new Date().toISOString(),
      };

      rooms.set(room.id, room);
      logger.log(`🏠 Room created: ${room.title} by ${user.nickname} (${data.callType})`);

      // 방 생성자에게 성공 응답
      socket.emit('roomCreated', { roomId: room.id });

      // 모든 클라이언트에게 새 방 알림
      io.emit('roomListUpdated', serializeRoom(room));
    });

    // 방 입장 (로그인/비로그인 모두 가능)
    socket.on('joinRoom', (data: { roomId: string; nickname?: string }) => {
      const authUser = authenticatedUsers.get(socket.id);
      const anonUser = anonymousUsers.get(socket.id);

      // 로그인하지 않은 경우 닉네임 필요
      if (!authUser && !data.nickname) {
        socket.emit('error', { message: '닉네임을 입력해주세요.' });
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
        socketId: socket.id,
        isHost: false,
      };

      room.participants.push(newParticipant);
      logger.log(`👋 User ${newParticipant.nickname} joined room: ${room.title}`);
      logger.log(`👥 현재 참가자 목록 (${room.participants.length}/${room.maxParticipants}):`);
      room.participants.forEach((p, idx) => {
        const role = p.isHost ? '호스트' : '게스트';
        const userType = p.userId ? '로그인' : '비로그인';
        logger.log(`   ${idx + 1}. ${p.nickname} (${role}, ${userType})`);
      });

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

      const participant = room.participants[participantIndex];
      const isHost = participant.isHost;

      // 호스트가 나가면 방 삭제
      if (isHost) {
        logger.log(`🗑️  Room deleted: ${room.title} (host left)`);

        // 모든 참가자에게 방 종료 알림
        room.participants.forEach((p) => {
          io.to(p.socketId).emit('roomClosed', {
            roomId: room.id,
            reason: 'host_left',
            message: '호스트가 방을 나가 세션이 종료되었습니다.',
          });
        });

        rooms.delete(data.roomId);
        io.emit('roomDeleted', data.roomId);
      } else {
        // 게스트가 나가면 참가자 목록에서 제거
        room.participants.splice(participantIndex, 1);
        logger.log(`👋 ${participant.nickname} left room: ${room.title}`);

        // 세션 시작 시간 초기화
        room.sessionStartedAt = undefined;

        rooms.set(room.id, room);

        // 남은 참가자에게 업데이트 알림
        room.participants.forEach((p) => {
          io.to(p.socketId).emit('roomUpdated', serializeRoom(room));
        });

        // 모든 클라이언트에게 방 목록 업데이트
        io.emit('roomListUpdated', serializeRoom(room));
      }

      // 나간 사용자에게 성공 응답
      socket.emit('roomLeft', { roomId: data.roomId });
    });

    // WebRTC 시그널링 (offer)
    socket.on('webrtc-offer', (data: { roomId: string; offer: any }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;

      // 같은 방의 다른 참가자에게 전달
      room.participants.forEach((p) => {
        if (p.socketId !== socket.id) {
          io.to(p.socketId).emit('webrtc-offer', {
            offer: data.offer,
            from: socket.id,
          });
        }
      });
    });

    // WebRTC 시그널링 (answer)
    socket.on('webrtc-answer', (data: { roomId: string; answer: any }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;

      // 같은 방의 다른 참가자에게 전달
      room.participants.forEach((p) => {
        if (p.socketId !== socket.id) {
          io.to(p.socketId).emit('webrtc-answer', {
            answer: data.answer,
            from: socket.id,
          });
        }
      });
    });

    // WebRTC 시그널링 (ICE candidate)
    socket.on('webrtc-ice-candidate', (data: { roomId: string; candidate: any }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;

      // 같은 방의 다른 참가자에게 전달
      room.participants.forEach((p) => {
        if (p.socketId !== socket.id) {
          io.to(p.socketId).emit('webrtc-ice-candidate', {
            candidate: data.candidate,
            from: socket.id,
          });
        }
      });
    });

    // 연결 해제
    socket.on('disconnect', () => {
      const authUser = authenticatedUsers.get(socket.id);
      const anonUser = anonymousUsers.get(socket.id);

      if (authUser) {
        logger.log(`❌ Authenticated user disconnected: ${authUser.nickname} (${socket.id})`);
        authenticatedUsers.delete(socket.id);
      } else if (anonUser) {
        logger.log(`❌ Anonymous user disconnected: ${socket.id}`);
        anonymousUsers.delete(socket.id);
      }

      // 참가 중인 방에서 제거
      for (const [roomId, room] of rooms.entries()) {
        const participantIndex = room.participants.findIndex((p) => p.socketId === socket.id);

        if (participantIndex !== -1) {
          const participant = room.participants[participantIndex];
          logger.log(`🔌 ${participant.nickname} disconnected from room: ${room.title}`);

          // 호스트가 연결 해제되면 방 삭제
          if (participant.isHost) {
            room.participants.forEach((p) => {
              io.to(p.socketId).emit('roomClosed', {
                roomId: room.id,
                reason: 'host_disconnected',
                message: '호스트의 연결이 끊어져 세션이 종료되었습니다.',
              });
            });

            rooms.delete(roomId);
            io.emit('roomDeleted', roomId);
          } else {
            // 게스트가 연결 해제되면 참가자 목록에서 제거
            room.participants.splice(participantIndex, 1);
            room.sessionStartedAt = undefined;

            rooms.set(roomId, room);

            // 남은 참가자에게 업데이트 알림
            room.participants.forEach((p) => {
              io.to(p.socketId).emit('roomUpdated', serializeRoom(room));
            });

            io.emit('roomListUpdated', serializeRoom(room));
          }
          break;
        }
      }

      logger.log(`📊 Total: ${authenticatedUsers.size} authenticated, ${anonymousUsers.size} anonymous`);

      // 온라인 사용자 수 브로드캐스트
      broadcastOnlineCount();
    });
  });

  logger.log('✅ Socket.io handlers initialized');
}
