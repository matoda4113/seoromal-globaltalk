import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

// 인증 미들웨어 (추후 구현)
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // TODO: JWT 토큰 검증 로직 추가
    next();
  } catch (error) {
    res.status(401).json({ error: '인증이 필요합니다' });
  }
};
