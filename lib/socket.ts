import { io, Socket } from 'socket.io-client';
import logger from '@/lib/logger';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

    socket = io(socketUrl, {
      path: '/socket',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // 연결 에러만 로깅 (중요한 정보)
    socket.on('connect_error', (error) => {
      logger.error('🔴 Socket connection error:', error);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
