import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/server/lib/db';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ratedUserId, raterUserId, ratingScore, ratingComment } = body;

    // 필수 파라미터 검증
    if (!ratedUserId || !raterUserId || !ratingScore) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 평점 범위 검증
    if (ratingScore < 1 || ratingScore > 5) {
      return NextResponse.json(
        { error: '평점은 1~5 사이여야 합니다.' },
        { status: 400 }
      );
    }

    // call_id 조회 (가장 최근 통화 기록)
    const callResult = await pool.query(
      `SELECT call_id FROM call_history
       WHERE (host_user_id = $1 AND guest_user_id = $2)
          OR (host_user_id = $2 AND guest_user_id = $1)
       ORDER BY created_at DESC
       LIMIT 1`,
      [ratedUserId, raterUserId]
    );

    if (callResult.rows.length === 0) {
      return NextResponse.json(
        { error: '통화 기록을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const callId = callResult.rows[0].call_id;

    // 평가 중복 체크
    const existingRating = await pool.query(
      `SELECT rating_id FROM ratings
       WHERE call_id = $1 AND rater_user_id = $2`,
      [callId, raterUserId]
    );

    if (existingRating.rows.length > 0) {
      return NextResponse.json(
        { error: '이미 평가를 제출하였습니다.' },
        { status: 409 }
      );
    }

    // 평가 저장
    await pool.query(
      `INSERT INTO ratings (call_id, rater_user_id, rated_user_id, rating_score, rating_comment)
       VALUES ($1, $2, $3, $4, $5)`,
      [callId, raterUserId, ratedUserId, ratingScore, ratingComment]
    );

    logger.log(`⭐ 평가 저장 완료: call_id=${callId}, rater=${raterUserId}, rated=${ratedUserId}, score=${ratingScore}`);

    return NextResponse.json(
      { message: '평가가 성공적으로 제출되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    logger.error('❌ 평가 제출 에러:', error);
    return NextResponse.json(
      { error: '평가 제출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
