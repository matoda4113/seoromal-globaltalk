/**
 * 프론트엔드 로거 유틸리티
 *
 * 개발 환경: 모든 로그 출력
 * 프로덕션 환경: warn, error만 출력
 */

// 클라이언트 사이드에서는 process.env.NODE_ENV를 직접 사용
const isDev = typeof window !== 'undefined'
  ? process.env.NODE_ENV !== 'production'
  : process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * 일반 로그 (개발 환경에서만)
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * 정보 로그 (개발 환경에서만)
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * 디버그 로그 (개발 환경에서만)
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * 경고 로그 (항상 출력)
   */
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * 에러 로그 (항상 출력)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },
};

export default logger;
