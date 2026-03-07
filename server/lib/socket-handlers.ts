import { Server as SocketIOServer, Socket } from 'socket.io';
import loggerBack from "../utils/loggerBack";
import type { User, AnonymousUser } from '@/types/user';
import { pool } from './db';
import { pointsService } from '../services/points.service';

// 사용자 타입은 types/user.ts에서 import

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
  hostBio?: string | null; // 호스트 자기소개
  hostDegree?: number; // 호스트 매너 온도
  hostAverageRating?: number; // 호스트 평균 평점
  hostTotalRatings?: number; // 호스트 총 평가 수
  language: 'ko' | 'en' | 'ja';
  topic: 'free' | 'romance' | 'hobby' | 'business' | 'travel';
  callType: 'audio' | 'video'; // 오디오콜 or 비디오콜
  maxParticipants: number; // 현재는 2명 고정
  isPrivate: boolean; // 비공개 방 여부
  password?: string; // 비공개 방 비밀번호
  participants: Participant[];
  createdAt: string; // 최초 방생성 타임
  sessionStartedAt?: Date; // 대화 시작시간
}

// 모듈 레벨 변수 (gift controller 등에서 접근 가능)
let _io: SocketIOServer | null = null;
export const userSocketIds = new Map<string, number>(); // socketId -> userId

// 포인트 업데이트 알림 함수
export function notifyPointsUpdate(userId: number, balance: number) {
  if (!_io) {
    loggerBack.warn('⚠️ Socket.IO not initialized');
    return;
  }

  const socketId = Array.from(userSocketIds.entries())
    .find(([_, id]) => id === userId)?.[0];

  if (socketId) {
    _io.to(socketId).emit('pointsUpdated', { balance });
    loggerBack.log(`💰 userId ${userId}에게 잔액 업데이트 전송: ${balance}점`);
  }
}

// 선물 수신 알림 함수
export function notifyGiftReceived(userId: number, senderNickname: string, amount: number, newBalance: number) {
  if (!_io) {
    loggerBack.warn('⚠️ Socket.IO not initialized');
    return;
  }

  const socketId = Array.from(userSocketIds.entries())
    .find(([_, id]) => id === userId)?.[0];

  if (socketId) {
    _io.to(socketId).emit('giftReceived', { senderNickname, amount, newBalance });
    loggerBack.log(`🎁 userId ${userId}에게 선물 알림 전송: ${senderNickname}님이 ${amount}점 선물`);
  }
}

export function initializeSocketHandlers(io: SocketIOServer) {
  // io 저장
  _io = io;

  // 연결된 사용자 관리
  const authenticatedUsers = new Map<number, User>(); // userId -> user (socketId 포함, 중복 제거됨)
  const anonymousUsers = new Map<string, AnonymousUser>(); // socketId -> anonymous

  // 방 목록 (임시 - 나중에 Redis로 변경)
  const rooms = new Map<string, Room>();

  // 온라인 사용자 수 브로드캐스트 (개인정보 제외, 통계만)
  function broadcastOnlineCount() {
    const totalOnline = authenticatedUsers.size + anonymousUsers.size;

    io.to('lobby').emit('onlineCount', {
      total: totalOnline,
      // authenticated: authenticatedUsers.size,
      // anonymous: anonymousUsers.size,
    });



  }

  // Room 객체 직렬화
  function serializeRoom(room: Room) {
    return {
      ...room,
    };
  }

  // 정산 처리 함수
  async function processSettlement(
    room: Room,
    participant: Participant,
    sessionDurationSeconds: number,
    callId: number,
  hostEarlyExit: boolean
  ) {
    const isHost = participant.isHost;
    const isGuest = !isHost;

    // 로그인 유저가 아니면 정산 안 함
    if (!participant.userId) {
      loggerBack.log(`⚠️ 비로그인 유저는 정산 불가: ${participant.nickname}`);
      return;
    }

    if (isGuest) {
      // 게스트 정산 로직
      const guestTooShort = sessionDurationSeconds <= 15;

      if (guestTooShort) {
        loggerBack.log(`💰 Guest ${participant.nickname} - No settlement (session <= 15 seconds)`);
        return;
      }

      // 기본 요금: 오디오 10점, 비디오 40점
      const baseCharge = room.callType === 'audio' ? 10 : 40;

      // 1분당 포인트: 오디오 1점, 비디오 4점
      const pointsPerMinute = room.callType === 'audio' ? 1 : 4;

      // 통화 시간을 분 단위로 올림 처리
      const sessionMinutes = Math.ceil(sessionDurationSeconds / 60);

      // 시간당 차감 = 분 * 분당포인트
      const timeBasedCharge = sessionMinutes * pointsPerMinute;

      // 최종 차감 = max(기본요금, 시간당차감)
      const guestCharge = Math.max(baseCharge, timeBasedCharge);

      try {
        // 게스트 포인트 차감
        if(!hostEarlyExit){
          await pointsService.chargeCallFee(participant.userId, guestCharge, callId);
        }
      } catch (error) {
        loggerBack.error(`❌ 게스트 포인트 차감 실패:`, error);
      }
    }

    if (isHost) {
      // 호스트 정산 로직 - 실제 통화 시간(올림)만큼 지급
      const sessionMinutes = Math.ceil(sessionDurationSeconds / 60);
      const pointsPerMinute = room.callType === 'audio' ? 1 : 4;
      const hostEarnings = sessionMinutes * pointsPerMinute;

      if (hostEarnings > 0) {
        try {
          // 호스트 포인트 지급
          await pointsService.grantCallEarning(participant.userId, hostEarnings, callId);
        } catch (error) {
          loggerBack.error(`❌ 호스트 포인트 지급 실패:`, error);
        }
      }
    }
  }

  // 호스트 조기 퇴장 패널티 처리
  async function applyHostPenalty(host: Participant, callId: number) {
    if (!host.userId) {
      loggerBack.log(`⚠️ 비로그인 호스트는 패널티 불가: ${host.nickname}`);
      return;
    }

    try {
      // 호스트 조기 퇴장 패널티 적용
      await pointsService.applyEarlyExitPenalty(host.userId, callId);
    } catch (error) {
      loggerBack.error(`❌ 호스트 패널티 부여 실패:`, error);
    }
  }

  // call_history 레코드 생성 함수 (call_id 반환)
  async function createCallHistory(
    room: Room,
    host: Participant,
    guest: Participant | null,
    sessionDurationSeconds: number,
    endReason: string,
    hostEarlyExit: boolean = false,
    hostPenaltyPoints: number = 0
  ): Promise<number | null> {
    // 호스트와 게스트 모두 로그인 유저인 경우만 기록
    if (!host.userId || !guest?.userId) {
      loggerBack.log(`⚠️ call_history 기록 건너뛰기 (비로그인 유저 포함)`);
      return null;
    }

    const actualMinutes = Math.floor(sessionDurationSeconds / 60);
    const pointsPerMinute = room.callType === 'audio' ? 1 : 4;

    // 호스트 수익 계산
    const hostPointsEarned = hostEarlyExit ? 0 : actualMinutes * pointsPerMinute;

    // 게스트 차감 계산
    const guestTooShort = sessionDurationSeconds <= 15;
    const baseMinutes = 10;
    const guestPointsCharged = guestTooShort ? 0 : baseMinutes * pointsPerMinute;

    try {
      const result = await pool.query(
        `INSERT INTO call_history (
          room_id, host_user_id, guest_user_id, call_type, language, topic,
          started_at, ended_at, duration_seconds,
          host_points_earned, guest_points_charged,
          host_early_exit, host_penalty_points, guest_too_short, end_reason
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING call_id`,
        [
          room.id,
          host.userId,
          guest.userId,
          room.callType,
          room.language,
          room.topic,
          room.sessionStartedAt || new Date(),
          new Date(),
          sessionDurationSeconds,
          hostPointsEarned,
          guestPointsCharged,
          hostEarlyExit,
          hostPenaltyPoints,
          guestTooShort,
          endReason,
        ]
      );
      const callId = result.rows[0].call_id;
      loggerBack.log(`📝 call_history 기록 완료: ${room.id} (${sessionDurationSeconds}초) call_id=${callId}`);
      return callId;
    } catch (error) {
      loggerBack.error(`❌ call_history 기록 실패:`, error);
      return null;
    }
  }

  // 사용자가 방을 나갈 때 처리 (leaveRoom, disconnect 공통 로직)
  async function handleUserLeaveRoom(
    socketId: string,
    reason: 'left' | 'disconnected'
  ): Promise<{ roomId: string; wasHost: boolean; showRatingModal?: boolean; hostUserId?: number } | null> {
    for (const [roomId, room] of rooms.entries()) {
      const participantIndex = room.participants.findIndex((p) => p.socketId === socketId);

      if (participantIndex !== -1) {
        const participant = room.participants[participantIndex];
        const isHost = participant.isHost;

        // 세션 시간 계산
        const sessionDurationSeconds = room.sessionStartedAt
          ? Math.floor((Date.now() - new Date(room.sessionStartedAt).getTime()) / 1000)
          : 0;

        // 10분 이상 통화했는지 체크 (테스트: 5초)
        const isTenMinutesOrMore = sessionDurationSeconds >= 600;
        // const isTenMinutesOrMore = sessionDurationSeconds >= 5;

        if (isHost) {
          // 호스트가 나감 - 방 삭제
          loggerBack.log(`🗑️ Room deleted: ${room.title} (host ${reason})`);

          const hasGuest = room.participants.length > 1;
          const guest = room.participants.find((p) => !p.isHost) || null;

          if (hasGuest && guest && room.sessionStartedAt) {
            const hostEarlyExit = !isTenMinutesOrMore;
            const hostPenaltyPoints = hostEarlyExit ? 5 : 0;

            // 1. call_history 먼저 생성 (call_id 받기)
            const callId = await createCallHistory(
              room,
              participant,
              guest,
              sessionDurationSeconds,
              reason === 'left' ? 'host_left' : 'host_disconnected',
              hostEarlyExit,
              hostPenaltyPoints
            );

            // 2. call_id가 있으면 정산 처리
            if (callId) {
              if (hostEarlyExit) {
                // 10분 미만 + 게스트 있음 - 패널티 부여
                await applyHostPenalty(participant, callId);
              } else {
                // 정상 종료 - 호스트 정산 처리
                await processSettlement(room, participant, sessionDurationSeconds, callId, hostEarlyExit);
              }

              // 게스트 정산 처리
              await processSettlement(room, guest, sessionDurationSeconds, callId , hostEarlyExit);
            }

            // 게스트에게 방 종료 알림
            io.to(guest.socketId).emit('roomClosed', {
              roomId: room.id,
              reason: reason === 'left' ? 'host_left' : 'host_disconnected',
              message: reason === 'left'
                ? '호스트가 방을 나가 세션이 종료되었습니다.'
                : '호스트의 연결이 끊어져 세션이 종료되었습니다.',
              showRatingModal: isTenMinutesOrMore,
              hostUserId: participant.userId,
            });
          }

          rooms.delete(roomId);
          io.emit('roomDeleted', roomId);
        } else {
          // 게스트가 나감 - 참가자 목록에서 제거
          const host = room.participants.find((p) => p.isHost);

          if (room.sessionStartedAt && host) {
            // 1. call_history 먼저 생성 (call_id 받기)
            const callId = await createCallHistory(
              room,
              host,
              participant,
              sessionDurationSeconds,
              reason === 'left' ? 'guest_left' : 'guest_disconnected',
              false,
              0
            );

            // 2. call_id가 있으면 정산 처리
            if (callId) {
              // 게스트 정산 처리
              await processSettlement(room, participant, sessionDurationSeconds, callId,false);

              // 호스트 정산 처리
              await processSettlement(room, host, sessionDurationSeconds, callId,false);
            }

            // 게스트가 10분 이상 통화 후 나갈 때 평가 모달
            if (isTenMinutesOrMore && host.userId) {
              loggerBack.log(`⭐ Guest ${participant.nickname} can rate the host`);

              room.participants.splice(participantIndex, 1);
              room.sessionStartedAt = undefined;
              loggerBack.log(`👋 ${participant.nickname} ${reason} room: ${room.title}`);

              rooms.set(roomId, room);

              room.participants.forEach((p) => {
                io.to(p.socketId).emit('roomUpdated', serializeRoom(room));
              });

              io.to('lobby').emit('roomListUpdated', serializeRoom(room));

              // 평가 모달 정보 반환
              return { roomId, wasHost: isHost, showRatingModal: true, hostUserId: host.userId };
            }
          }

          room.participants.splice(participantIndex, 1);
          room.sessionStartedAt = undefined;
          loggerBack.log(`👋 ${participant.nickname} ${reason} room: ${room.title}`);

          rooms.set(roomId, room);

          room.participants.forEach((p) => {
            io.to(p.socketId).emit('roomUpdated', serializeRoom(room));
          });

          io.to('lobby').emit('roomListUpdated', serializeRoom(room));
        }

        return { roomId, wasHost: isHost };
      }
    }

    return null;
  }

  io.on('connection', (socket: Socket) => {
    loggerBack.log(`✅ Client connected: ${socket.id}`);
    socket.join('lobby');
    // 익명 사용자로 우선 등록
    anonymousUsers.set(socket.id, {
      socketId: socket.id,
      connectedAt: new Date(),
    });
    loggerBack.log(`👤 Anonymous user connected: ${socket.id}`);
    loggerBack.log(`📊 Total: ${authenticatedUsers.size} authenticated, ${anonymousUsers.size} anonymous`);

    // 온라인 카운트 브로드캐스트
    broadcastOnlineCount();


    // 사용자 인증 (로그인한 경우)
    socket.on('authenticate', (data: User) => {
      if (data.userId && data.email && data.nickname) {
        // 익명 → 인증 전환
        if (anonymousUsers.has(socket.id)) {
          anonymousUsers.delete(socket.id);
          loggerBack.log(`🔄 익명 → 인증 전환: ${data.nickname} (${socket.id})`);
        }

        // 로그인한 사용자로 등록 (userId를 키로 사용 -> 중복 제거됨)
        authenticatedUsers.set(data.userId, {
          ...data,
          socketId: socket.id, // socketId 추가
        });
        userSocketIds.set(socket.id, data.userId);
        loggerBack.log(`🔐 Authenticated user: ${data.nickname} (userId: ${data.userId}, socketId: ${socket.id}) - age: ${data.ageGroup}, gender: ${data.gender}`);
        loggerBack.log(`📊 Total: ${authenticatedUsers.size} unique authenticated users, ${anonymousUsers.size} anonymous`);

        // 온라인 사용자 수 브로드캐스트
        // broadcastOnlineCount();
      }
    });

    // 방 목록 요청 (로그인/비로그인 모두 가능)
    socket.on('getRooms', () => {
      const roomList = Array.from(rooms.values())
        .filter((room) => room.participants.length < room.maxParticipants)
        .map(serializeRoom);
      socket.emit('roomList', roomList);
      loggerBack.log(`📋 Room list sent to ${socket.id}: ${roomList.length} rooms`);
    });

    // 온라인 카운트 요청 (페이지네이션 지원)
    socket.on('getOnlineCount', (data?: { page?: number; limit?: number }) => {
      const totalOnline = authenticatedUsers.size + anonymousUsers.size;
      const page = data?.page || 1;
      const limit = data?.limit || 50;
      // const limit = 1;

      // 전체 인증 사용자 목록
      const allAuthenticatedUsers = Array.from(authenticatedUsers.values()).map(user => ({
        userId: user.userId,
        nickname: user.nickname,
        profileImageUrl: user.profileImageUrl,
        ageGroup: user.ageGroup,
        gender: user.gender,
      }));

      // 페이지네이션 적용
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = allAuthenticatedUsers.slice(startIndex, endIndex);
      const hasMore = endIndex < allAuthenticatedUsers.length;

      socket.emit('onlineCount', {
        total: totalOnline,
        authenticated: authenticatedUsers.size,
        anonymous: anonymousUsers.size,
        authenticatedUsers: paginatedUsers,
        page,
        limit,
        hasMore,
      });
      loggerBack.log(`📊 Online count sent to ${socket.id}: page ${page}, ${paginatedUsers.length}/${allAuthenticatedUsers.length} users`);
    });

    // 대기실(로비) 입장
    socket.on('joinLobby', () => {
      socket.join('lobby');
      loggerBack.log(`🚪 ${socket.id} joined lobby`);
    });

    // 대기실(로비) 퇴장
    socket.on('leaveLobby', () => {
      socket.leave('lobby');
      loggerBack.log(`🚪 ${socket.id} left lobby`);
    });

    // 방 만들기 (로그인 필수)
    socket.on('createRoom', async (data: {
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

      // 이미 참가 중인 방이 있는지 확인 (userId 기준)
      const existingRoom = Array.from(rooms.values()).find((room) =>
        room.participants.some((p) => p.userId === user.userId)
      );

      if (existingRoom) {
        socket.emit('error', { message: '이미 참가 중인 방이 있습니다. 하나의 방만 참가할 수 있습니다.' });
        return;
      }

      // 호스트 정보 DB에서 조회 (bio, degree, rating)
      let hostBio: string | null | undefined;
      let hostDegree: number | undefined;
      let hostAverageRating: number | undefined;
      let hostTotalRatings: number | undefined;

      try {
        const userQuery = await pool.query(
          `SELECT bio, degree FROM users WHERE id = $1`,
          [user.userId]
        );
        if (userQuery.rows.length > 0) {
          hostBio = userQuery.rows[0].bio;
          hostDegree = userQuery.rows[0].degree;
        }

        const ratingQuery = await pool.query(
          `SELECT
            COALESCE(AVG(rating_score), 0) as average_rating,
            COUNT(*) as total_ratings
          FROM ratings
          WHERE rated_user_id = $1`,
          [user.userId]
        );
        if (ratingQuery.rows.length > 0) {
          hostAverageRating = parseFloat(Number(ratingQuery.rows[0].average_rating).toFixed(1));
          hostTotalRatings = parseInt(ratingQuery.rows[0].total_ratings);
        }
      } catch (error) {
        loggerBack.error('❌ Failed to fetch host info:', error);
      }

      const room: Room = {
        id: `room_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        title: data.title,
        hostId: user.userId,
        hostNickname: user.nickname??"host",
        hostProfileImage: user.profileImageUrl,
        hostBio,
        hostDegree,
        hostAverageRating,
        hostTotalRatings,
        language: data.language as 'ko' | 'en' | 'ja',
        topic: data.topic as 'free' | 'romance' | 'hobby' | 'business' | 'travel',
        callType: data.roomType as 'audio' | 'video',
        maxParticipants: 2,
        isPrivate: data.isPrivate,
        password: data.isPrivate ? data.password : undefined,
        participants: [
          {
            userId: user.userId,
            nickname: user.nickname??"user",
            profileImageUrl: user.profileImageUrl,
            socketId: socket.id,
            isHost: true,
            ageGroup: user.ageGroup,
            gender: user.gender,
          },
        ],
        createdAt: new Date().toISOString(),
      };

      rooms.set(room.id, room);
      const privacyLabel = data.isPrivate ? '비공개' : '공개';
      loggerBack.log(`🏠 Room created: ${room.title} by ${user.nickname} (${data.roomType}, ${privacyLabel})`);

      // 방 생성자에게 성공 응답
      socket.emit('roomCreated', { roomId: room.id });

      // 방을 만들면 로비에서 나감 (호스트가 방에 자동 입장하므로)
      socket.leave('lobby');
      loggerBack.log(`🚪 ${socket.id} left lobby (created room)`);

      // 호스트를 방에 자동으로 입장시킴
      socket.emit('roomJoined', {
        ...serializeRoom(room),
        agoraAppId: process.env.NEXT_PUBLIC_AGORA_APP_ID || '',
      });
      loggerBack.log(`👋 Host auto-joined room: ${room.title}`);

      // 로비에 있는 클라이언트에게 새 방 알림
      io.to('lobby').emit('roomListUpdated', serializeRoom(room));
    });

    // 방 입장 (로그인 유저만 가능)
    socket.on('joinRoom', async (data: { roomId: string; nickname?: string; password?: string }) => {
      const userId = userSocketIds.get(socket.id);
      const authUser = userId ? authenticatedUsers.get(userId) : null;

      // 로그인하지 않은 경우 팅김
      if (!authUser) {
        socket.emit('error', { message: '로그인 이후 방 입장 가능합니다.' });
        return;
      }


      // 이미 다른 방에 참가 중인지 체크 (userId 기준)
      for (const [roomId, existingRoom] of rooms.entries()) {
        if (existingRoom.participants.some((p) => p.userId === authUser.userId)) {
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

      // 호스트 여부 확인 (방을 만든 사람인지)
      const isHost = room.hostId === authUser.userId;

      // 게스트인 경우 비밀방 비밀번호 체크
      if (!isHost && room.isPrivate) {
        if (!data.password) {
          socket.emit('error', { message: '비밀번호를 입력해주세요.' });
          return;
        }
        if (data.password !== room.password) {
          socket.emit('error', { message: '비밀번호가 일치하지 않습니다.' });
          return;
        }
        loggerBack.log(`🔐 비밀방 입장 성공: ${authUser.nickname} → ${room.title}`);
      }

      // 게스트인 경우 포인트 체크 (오디오: 10점, 비디오: 40점 미만이면 입장 불가)
      let guestBalance: number | undefined;
      if (!isHost) {
        try {
          const balance = await pointsService.getBalance(authUser.userId);
          guestBalance = balance;

          // 방 타입에 따른 최소 포인트 체크
          const minPoints = room.callType === 'audio' ? 10 : 40;
          loggerBack.info(`💰 입장 포인트 체크: userId=${authUser.userId}, balance=${balance}, 방타입=${room.callType}, 필요포인트=${minPoints}`);

          if (balance < minPoints) {
            socket.emit('error', { message: `포인트가 부족합니다. (현재 ${balance}점, 최소 ${minPoints}점 필요)` });
            return;
          }
        } catch (error) {
          loggerBack.error('❌ 포인트 조회 실패:', error);
          socket.emit('error', { message: '포인트 확인 중 오류가 발생했습니다.' });
          return;
        }
      }

      // await 이후 다시 정원 체크 (동시 입장 race condition 방지)
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
        isHost: isHost,
        ageGroup: authUser?.ageGroup || null,
        gender: authUser?.gender || null

      };

      room.participants.push(newParticipant);
      loggerBack.log(`👋 User ${newParticipant.nickname} joined room: ${room.title}`);
      loggerBack.log(`👥 현재 참가자 목록 (${room.participants.length}/${room.maxParticipants}):`);

      // 2명이 모였으면 세션 시작
      if (room.participants.length === 2) {
        room.sessionStartedAt = new Date();
        loggerBack.log(`🎤 세션 시작: ${room.title} (${room.callType})`);
      }

      rooms.set(room.id, room);

      // 방에 입장하면 로비에서 나감
      socket.leave('lobby');
      loggerBack.log(`🚪 ${socket.id} left lobby (joined room)`);

      // 입장한 사용자에게 방 정보 전송 (게스트는 잔액 포함)
      socket.emit('roomJoined', {
        ...serializeRoom(room),
        agoraAppId: process.env.NEXT_PUBLIC_AGORA_APP_ID || '',
        ...(guestBalance !== undefined && { guestBalance }),
      });

      // 방의 모든 참가자에게 업데이트 알림
      room.participants.forEach((p) => {
        io.to(p.socketId).emit('roomUpdated', serializeRoom(room));
      });

      // 로비에 있는 클라이언트에게 방 목록 업데이트
      io.to('lobby').emit('roomListUpdated', serializeRoom(room));

    });

    // 방 나가기
    socket.on('leaveRoom', async (data: { roomId: string }) => {
      console.log(`리절트  :!!}`);
      // 공통 로직 호출
      const result = await handleUserLeaveRoom(socket.id, 'left');

      // 나간 사용자에게 성공 응답
      if (result) {
        // 방을 나가면 자동으로 로비에 재가입
        socket.join('lobby');
        loggerBack.log(`🔄 ${socket.id} re-joined lobby after leaving room`);

        socket.emit('roomLeft', {
          roomId: result.roomId,
          showRatingModal: result.showRatingModal,
          hostUserId: result.hostUserId,
        });
      } else {
        // 참가 중인 방이 없는 경우 (이미 나갔거나 참가한 적 없음)
        socket.emit('error', { message: '방에 참가하지 않았습니다.' });
      }
    });

    // 채팅 메시지 전송
    socket.on('sendMessage', (data: { roomId: string; message: string; type?: 'text' | 'stt' }) => {
      const room = rooms.get(data.roomId);

      if (!room) {
        socket.emit('error', { message: '방을 찾을 수 없습니다.' });
        return;
      }

      // 보낸 사람 정보 찾기
      const sender = room.participants.find((p) => p.socketId === socket.id);

      if (!sender) {
        socket.emit('error', { message: '방에 참가하지 않았습니다.' });
        return;
      }

      // 메시지 객체 생성
      const messageData = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        roomId: data.roomId,
        senderId: sender.userId,
        senderNickname: sender.nickname,
        senderProfileImage: sender.profileImageUrl,
        message: data.message,
        timestamp: new Date().toISOString(),
        type: data.type || 'text', // 메시지 타입: text(수동) 또는 stt(음성인식)
      };

      loggerBack.log(`💬 Message from ${sender.nickname} in room ${room.title}: ${data.message} (${messageData.type})`);

      // 방의 모든 참가자에게 메시지 브로드캐스트
      room.participants.forEach((p) => {
        io.to(p.socketId).emit('newMessage', messageData);
      });
    });

    // 방 제목 수정 (방장만 가능)
    socket.on('updateRoomTitle', (data: { roomId: string; newTitle: string }) => {
      const room = rooms.get(data.roomId);

      if (!room) {
        socket.emit('error', { message: '방을 찾을 수 없습니다.' });
        return;
      }

      // 요청자가 방장인지 확인
      const participant = room.participants.find((p) => p.socketId === socket.id);
      if (!participant || !participant.isHost) {
        socket.emit('error', { message: '방장만 제목을 수정할 수 있습니다.' });
        return;
      }

      // 제목 유효성 검사
      if (!data.newTitle || data.newTitle.trim().length === 0) {
        socket.emit('error', { message: '방 제목을 입력해주세요.' });
        return;
      }

      if (data.newTitle.trim().length > 50) {
        socket.emit('error', { message: '방 제목은 50자 이내로 입력해주세요.' });
        return;
      }

      // 방 제목 업데이트
      room.title = data.newTitle.trim();
      loggerBack.log(`✏️ Room title updated: ${room.id} -> "${room.title}"`);

      // 방의 모든 참가자에게 업데이트된 방 정보 전송
      room.participants.forEach((p) => {
        io.to(p.socketId).emit('roomUpdated', serializeRoom(room));
      });

      // 로비에 있는 사용자에게 방 목록 업데이트 알림
      io.to('lobby').emit('roomListUpdated', serializeRoom(room));

    });

    // 연결 해제
    socket.on('disconnect', async () => {
      const userId = userSocketIds.get(socket.id);
      const authUser = userId ? authenticatedUsers.get(userId) : null;
      const anonUser = anonymousUsers.get(socket.id);

      if (authUser && userId) {
        loggerBack.log(`❌ Authenticated user disconnected: ${authUser.nickname} (userId: ${userId}, socketId: ${socket.id})`);
        authenticatedUsers.delete(userId);
        userSocketIds.delete(socket.id);
      } else if (anonUser) {
        loggerBack.log(`❌ Anonymous user disconnected: ${socket.id}`);
        anonymousUsers.delete(socket.id);
      }

      // 참가 중인 방에서 제거 (공통 로직 호출)
      await handleUserLeaveRoom(socket.id, 'disconnected');

      loggerBack.log(`📊 Total: ${authenticatedUsers.size} authenticated, ${anonymousUsers.size} anonymous`);

      // 온라인 사용자 수 브로드캐스트
      broadcastOnlineCount();
    });
  });

  loggerBack.log('✅ Socket.io handlers initialized');
}
