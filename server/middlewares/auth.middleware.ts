import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
  userId?: number;
}

/**
 * JWT 인증 미들웨어
 * Cookie에서 accessToken을 읽어서 검증
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // JWT 검증
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    // req에 userId 추가
    (req as any).userId = decoded.userId;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      // 토큰 만료 시 403 반환 (프론트엔드에서 refresh 시도)
      return res.status(403).json({ message: 'Token expired', error: 'TOKEN_EXPIRED' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      // 유효하지 않은 토큰
      return res.status(401).json({ message: 'Invalid token', error: 'INVALID_TOKEN' });
    }
    return res.status(401).json({ message: 'Authentication failed' });
  }
};
