// 백엔드 로거 유틸리티

import dotenv from "dotenv";

dotenv.config();
const isDev = process.env.NODE_ENV === 'development';
// const isDev = true;

export const loggerBack = {
  log: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`[LOG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (isDev) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
};

export default loggerBack;
