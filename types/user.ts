/**
 * 기본 사용자 정보 인터페이스
 */
export interface User {
  userId: number;
  email: string;
  name?: string;
  nickname?: string;
  bio?: string | null;
  profileImageUrl?: string | null;
  provider: string;
  ageGroup?: number | null;
  gender?: string | null;
  degree?: number;
  points?: number;
  country?: string | null;
  socketId?: string; // 소켓 연결 시에만 존재
}

/**
 * 익명 사용자
 */
export interface AnonymousUser {
  socketId: string;
  connectedAt: Date;
}

/**
 * 온라인 카운트 정보
 */
export interface OnlineCount {
  total: number;
  authenticated: number;
  anonymous: number;
  authenticatedUsers: User[]; // socketId 포함된 User 배열
}
