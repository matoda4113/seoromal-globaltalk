import { Request, Response } from 'express';
import { pool } from '../lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import axios from 'axios';
import loggerBack from "../utils/loggerBack";
import { getUserPoints, addPoints } from '../lib/points';


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ACCESS_TOKEN_EXPIRES_IN = '1d'; // Access Token 1일
const REFRESH_TOKEN_EXPIRES_IN = '30d'; // Refresh Token 30일

interface TokenVerificationResult {
  email: string;
  name?: string;
  socialId: string;
  provider: string;
  profileImage?: string;
}

/**
 * Access Token 생성
 */
function generateAccessToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

/**
 * Refresh Token 생성
 */
function generateRefreshToken(userId: number): string {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

/**
 * 유저 평점 정보 가져오기
 */
async function getUserRating(userId: number) {
  try {
    const query = `
      SELECT
        COALESCE(AVG(rating_score), 0) as average_rating,
        COUNT(*) as total_ratings,
        COUNT(CASE WHEN rating_score = 1 THEN 1 END) as rating_1_count,
        COUNT(CASE WHEN rating_score = 2 THEN 1 END) as rating_2_count,
        COUNT(CASE WHEN rating_score = 3 THEN 1 END) as rating_3_count,
        COUNT(CASE WHEN rating_score = 4 THEN 1 END) as rating_4_count,
        COUNT(CASE WHEN rating_score = 5 THEN 1 END) as rating_5_count
      FROM ratings
      WHERE rated_user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    const { average_rating, total_ratings, rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count } = result.rows[0];

    return {
      averageRating: parseFloat(Number(average_rating).toFixed(1)),
      totalRatings: parseInt(total_ratings),
      ratingDistribution: {
        rating1: parseInt(rating_1_count),
        rating2: parseInt(rating_2_count),
        rating3: parseInt(rating_3_count),
        rating4: parseInt(rating_4_count),
        rating5: parseInt(rating_5_count),
      }
    };
  } catch (error) {
    loggerBack.error('Failed to get user rating:', error);
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingDistribution: {
        rating1: 0,
        rating2: 0,
        rating3: 0,
        rating4: 0,
        rating5: 0,
      }
    };
  }
}

/**
 * 유저 정보를 일관된 형식으로 포맷팅
 */
function formatUserInfo(user: any, points?: number, rating?: { averageRating: number; totalRatings: number; ratingDistribution: { rating1: number; rating2: number; rating3: number; rating4: number; rating5: number } }) {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    nickname: user.nickname,
    bio: user.bio,
    profileImageUrl: user.profile_image_url,
    provider: user.provider,
    ageGroup: user.age_group,
    gender: user.gender,
    country: user.country,
    degree: user.degree,
    ...(points !== undefined && { points }),
    ...(rating && {
      averageRating: rating.averageRating,
      totalRatings: rating.totalRatings,
      ratingDistribution: rating.ratingDistribution
    }),
  };
}

/**
 * 소셜 로그인 (Google, Kakao, LINE, Apple)
 */
export async function socialLogin(req: Request, res: Response) {
  let client;

  try {
    const { provider, token } = req.body;

    // DB 연결 시도
    try {
      client = await pool.connect();
      loggerBack.info('Database connection established');
    } catch (dbError) {
      loggerBack.error('Database connection failed:', dbError);
      return res.status(500).json({
        message: 'Database connection failed',
        error: process.env.NODE_ENV === 'development' ? String(dbError) : undefined,
      });
    }

    if (!provider || !token) {
      return res.status(400).json({
        message: 'Provider and token are required',
      });
    }

    let userInfo: TokenVerificationResult | null = null;

    // Provider별 토큰 검증 및 사용자 정보 가져오기
    switch (provider) {
      case 'google':
        userInfo = await verifyGoogleToken(token);
        break;
      case 'kakao':
        userInfo = await verifyKakaoToken(token);
        break;
      case 'line':
        userInfo = await verifyLineToken(token);
        break;
      case 'apple':
        userInfo = await verifyAppleToken(token);
        break;
      default:
        return res.status(400).json({
          message: 'Invalid provider',
        });
    }

    if (!userInfo) {
      return res.status(401).json({
        message: 'Invalid token',
      });
    }

    // DB에서 사용자 조회
    const selectQuery = `
      SELECT * FROM users
      WHERE email = $1 AND provider = $2
      LIMIT 1
    `;
    let result = await client.query(selectQuery, [userInfo.email, provider]);
    let user = result.rows[0];

    let isNewUser = false;
    if (!user) {
      // 신규 사용자 생성
      isNewUser = true;
      const insertQuery = `
        INSERT INTO users (email, name, nickname, provider, social_id,profile_image_url)
        VALUES ($1, $2, $3, $4, $5,$6)
        RETURNING *
      `;
      result = await client.query(insertQuery, [
        userInfo.email,
        userInfo.name,
        userInfo.name || '사용자',
        provider,
        userInfo.socialId,
        userInfo.profileImage,
      ]);
      user = result.rows[0];

      // 신규 가입자에게 50포인트 지급
      await addPoints(pool, user.id, 50, 'earn', '회원가입 축하 포인트', 'signup');
    }

    // 사용자 포인트 조회
    const userPoints = await getUserPoints(pool, user.id);

    // 사용자 평점 조회
    const userRating = await getUserRating(user.id);

    // JWT 토큰 생성 (Access + Refresh)
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // httpOnly Cookie에 토큰 저장
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 1 * 24 * 60 * 60 * 1000, // 1일
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
    });

    loggerBack.info('Cookies set successfully');

    // 신규 가입자는 201, 기존 사용자는 200 상태 코드 반환
    return res.status(isNewUser ? 201 : 200).json({
      message: isNewUser ? 'Registration successful' : 'Login successful',
      data: {
        userInfo: formatUserInfo(user, userPoints, userRating),
      },
    });
  } catch (error) {
    loggerBack.error('Social login error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * 이메일 회원가입
 */
export async function emailRegister(req: Request, res: Response) {
  const client = await pool.connect();

  try {
    const { email, password, nickname } = req.body;

    if (!email || !password || !nickname) {
      return res.status(400).json({
        message: 'Email, password, and nickname are required',
      });
    }

    // 이메일 중복 확인 (모든 provider에 대해)
    const checkQuery = `SELECT id, provider FROM users WHERE email = $1`;
    const checkResult = await client.query(checkQuery, [email]);

    if (checkResult.rows.length > 0) {
      const existingProvider = checkResult.rows[0].provider;
      return res.status(409).json({
        message: `Email already exists with ${existingProvider} login`,
        error: 'EMAIL_ALREADY_EXISTS',
        provider: existingProvider,
      });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const insertQuery = `
      INSERT INTO users (email, password, nickname, provider)
      VALUES ($1, $2, $3, 'email')
      RETURNING *
    `;
    const result = await client.query(insertQuery, [email, hashedPassword, nickname]);
    const user = result.rows[0];

    // 신규 가입자에게 50포인트 지급
    await addPoints(pool, user.id, 50, 'earn', '회원가입 축하 포인트', 'signup');

    // 사용자 포인트 조회
    const userPoints = await getUserPoints(pool, user.id);

    // 사용자 평점 조회
    const userRating = await getUserRating(user.id);

    // JWT 토큰 생성 (Access + Refresh)
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // httpOnly Cookie에 토큰 저장
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000, // 1일
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
    });

    loggerBack.info('Cookies set successfully');

    return res.status(201).json({
      message: 'Registration successful',
      data: {
        userInfo: formatUserInfo(user, userPoints, userRating),
      },
    });
  } catch (error) {
    loggerBack.error('Email register error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  } finally {
    client.release();
  }
}

/**
 * 이메일 로그인
 */
export async function emailLogin(req: Request, res: Response) {
  const client = await pool.connect();

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    // 사용자 조회
    const query = `SELECT * FROM users WHERE email = $1 AND provider = 'email'`;
    const result = await client.query(query, [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // 사용자 포인트 조회
    const userPoints = await getUserPoints(pool, user.id);

    // 사용자 평점 조회
    const userRating = await getUserRating(user.id);

    // JWT 토큰 생성 (Access + Refresh)
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // httpOnly Cookie에 토큰 저장
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000, // 15분
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
    });

    loggerBack.info('Cookies set successfully');

    return res.json({
      message: 'Login successful',
      data: {
        userInfo: formatUserInfo(user, userPoints, userRating),
      },
    });
  } catch (error) {
    loggerBack.error('Email login error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  } finally {
    client.release();
  }
}

/**
 * Refresh Token으로 Access Token 재발급
 */
export async function refreshAccessToken(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: 'Refresh token required',
      });
    }

    // Refresh Token 검증
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: number; type: string };

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        message: 'Invalid token type',
      });
    }

    // 새로운 Access Token 생성
    const newAccessToken = generateAccessToken(decoded.userId);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1일
    });

    return res.json({
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}

/**
 * 현재 사용자 정보 가져오기
 */
export async function getCurrentUser(req: Request, res: Response) {
  const client = await pool.connect();

  try {
    const userId = (req as any).userId;

    const query = `SELECT * FROM users WHERE id = $1`;
    const result = await client.query(query, [userId]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // 사용자 포인트 조회
    const userPoints = await getUserPoints(pool, user.id);

    // 사용자 평점 조회
    const userRating = await getUserRating(user.id);

    return res.json({
      message: 'User retrieved successfully',
      data: {
        userInfo: formatUserInfo(user, userPoints, userRating),
      },
    });
  } catch (error) {
    loggerBack.error('Get current user error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  } finally {
    client.release();
  }
}

/**
 * 로그아웃
 */
export async function logout(req: Request, res: Response) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  return res.json({
    message: 'Logout successful',
  });
}

/**
 * 닉네임 변경
 */
export async function updateNickname(req: Request, res: Response) {
  const client = await pool.connect();

  try {
    const userId = (req as any).userId;
    const { nickname, bio } = req.body;

    // 최소한 하나의 필드는 있어야 함
    if (!nickname && bio === undefined) {
      return res.status(400).json({
        message: 'Nickname or bio is required',
      });
    }

    // 동적으로 쿼리 생성
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (nickname) {
      updates.push(`nickname = $${paramIndex}`);
      values.push(nickname);
      paramIndex++;
    }

    if (bio !== undefined) {
      updates.push(`bio = $${paramIndex}`);
      values.push(bio);
      paramIndex++;
    }

    values.push(userId);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await client.query(query, values);
    const user = result.rows[0];

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        bio: user.bio,
        provider: user.provider,
        ageGroup: user.age_group,
        gender: user.gender,
        degree: user.degree,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    loggerBack.error('Update profile error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  } finally {
    client.release();
  }
}

/**
 * 프로필 정보 변경
 */
export async function updateProfile(req: Request, res: Response) {
  const client = await pool.connect();

  try {
    const userId = (req as any).userId;
    const { nickname, age_group, gender, country } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (nickname !== undefined) {
      updates.push(`nickname = $${paramCount++}`);
      values.push(nickname);
    }
    if (age_group !== undefined) {
      updates.push(`age_group = $${paramCount++}`);
      values.push(age_group);
    }
    if (gender !== undefined) {
      updates.push(`gender = $${paramCount++}`);
      values.push(gender);
    }
    if (country !== undefined) {
      updates.push(`country = $${paramCount++}`);
      values.push(country);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message: 'No fields to update',
      });
    }

    values.push(userId);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    const result = await client.query(query, values);
    const user = result.rows[0];

    return res.json({
      message: 'Profile updated successfully',
      data: {
        userInfo: formatUserInfo(user),
      },
    });
  } catch (error) {
    loggerBack.error('Update profile error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  } finally {
    client.release();
  }
}

/**
 * 회원 탈퇴
 */
export async function deleteAccount(req: Request, res: Response) {
  const client = await pool.connect();

  try {
    const userId = (req as any).userId;

    // 개인정보 익명화
    const query = `
      UPDATE users
      SET
        email = $1,
        name = NULL,
        nickname = '탈퇴한 사용자',
        password = NULL
      WHERE id = $2
    `;
    await client.query(query, [`deleted_${userId}@deleted.com`, userId]);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.json({
      message: 'Account deleted successfully',
    });
  } catch (error) {
    loggerBack.error('Delete account error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  } finally {
    client.release();
  }
}

// ===== Provider별 토큰 검증 함수 =====

/**
 * Google 토큰 검증
 */
async function verifyGoogleToken(accessToken: string): Promise<TokenVerificationResult | null> {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
    );

    return {
      email: response.data.email,
      name: response.data.name,
      socialId: response.data.sub,
      provider: 'google',
    };
  } catch (error) {
    loggerBack.error('Google token verification failed:', error);
    return null;
  }
}

/**
 * Kakao 토큰 검증
 */
async function verifyKakaoToken(token: string): Promise<TokenVerificationResult | null> {
  const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || '1bccb4263099e4c40c3e227f662bf9ba';
  const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;
  const REDIRECT_URI =`${process.env.NEXT_PUBLIC_ORIGIN_URL}/login/kakao`;

  // 먼저 Access Token으로 시도
  try {
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { kakao_account, id } = userResponse.data;

    if (!kakao_account?.email) {
      throw new Error('Email not provided by Kakao');
    }

    return {
      email: kakao_account.email,
      name: kakao_account.profile?.nickname,
      socialId: String(id),
      provider: 'kakao',
    };
  } catch (error: any) {
    // Access Token으로 실패하면 Authorization Code로 간주하고 교환 시도
    loggerBack.debug('Access Token 실패, Authorization Code로 교환 시도');

    try {
      const tokenResponse = await axios.post(
        'https://kauth.kakao.com/oauth/token',
        null,
        {
          params: {
            grant_type: 'authorization_code',
            client_id: KAKAO_REST_API_KEY,
            client_secret: KAKAO_CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code: token,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // 새로 받은 Access Token으로 사용자 정보 조회
      const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const { kakao_account, id } = userResponse.data;

      if (!kakao_account?.email) {
        throw new Error('Email not provided by Kakao');
      }


      return {
        email: kakao_account.email,
        name: kakao_account.profile?.nickname,
        socialId: String(id),
        profileImage: kakao_account.profile?.profile_image_url,
        provider: 'kakao',
      };
    } catch (codeError: any) {
      loggerBack.error('Kakao token verification failed:', codeError);
      return null;
    }
  }
}

/**
 * LINE 토큰 검증
 */
async function verifyLineToken(code: string): Promise<TokenVerificationResult | null> {
  try {
    // 1. Authorization Code를 Access Token으로 교환
    const LINE_CHANNEL_ID = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || '2009282903';
    const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_ORIGIN_URL}/login/line`;

    const tokenResponse = await axios.post(
      'https://api.line.me/oauth2/v2.1/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET || '',
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // 2. Access Token으로 프로필 정보 가져오기
    const profileResponse = await axios.get('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const { userId, displayName, pictureUrl } = profileResponse.data;

    // 3. 이메일 정보 가져오기 (ID Token에서 추출)
    let email = `${userId}@line.me`; // 기본값
    try {
      const idToken = tokenResponse.data.id_token;
      if (idToken) {
        // ID Token을 디코딩하여 이메일 추출 (JWT 형식)
        const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
        if (payload.email) {
          email = payload.email;
          loggerBack.log('LINE email found:', email);
        }
      }
    } catch (emailError) {
      loggerBack.log('LINE email not available, using default');
    }

    return {
      email: email,
      name: displayName,
      socialId: userId,
      profileImage: pictureUrl,
      provider: 'line',
    };
  } catch (error) {
    loggerBack.error('LINE token verification failed:', error);
    return null;
  }
}

/**
 * Apple 토큰 검증
 */
async function verifyAppleToken(token: string): Promise<TokenVerificationResult | null> {
  // Apple Sign In은 ID Token을 JWT로 검증해야 함
  // 여기서는 기본 구조만 제공
  try {
    // TODO: Apple JWT 검증 로직 구현
    loggerBack.warn('Apple login not fully implemented yet');
    return null;
  } catch (error) {
    loggerBack.error('Apple token verification failed:', error);
    return null;
  }
}
