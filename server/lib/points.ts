import { Pool } from 'pg';

/**
 * 사용자의 총 포인트를 계산합니다
 * @param pool - DB 연결 풀
 * @param userId - 사용자 ID
 * @returns 총 포인트
 */
export async function getUserPoints(pool: Pool, userId: number): Promise<number> {
  const query = `
    SELECT COALESCE(SUM(amount), 0) as total_points
    FROM points
    WHERE user_id = $1
  `;
  const result = await pool.query(query, [userId]);
  return parseInt(result.rows[0].total_points) || 0;
}

/**
 * 포인트를 적립합니다
 * @param pool - DB 연결 풀
 * @param userId - 사용자 ID
 * @param amount - 적립할 포인트 (양수)
 * @param type - 포인트 유형
 * @param reason - 적립 사유
 * @param referenceType - 참조 타입
 * @param referenceId - 참조 ID
 */
export async function addPoints(
  pool: Pool,
  userId: number,
  amount: number,
  type: string,
  reason: string,
  referenceType?: string,
  referenceId?: number
): Promise<void> {
  const query = `
    INSERT INTO points (user_id, amount, type, reason, reference_type, reference_id)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
  await pool.query(query, [userId, amount, type, reason, referenceType, referenceId]);
}

/**
 * 포인트를 사용합니다
 * @param pool - DB 연결 풀
 * @param userId - 사용자 ID
 * @param amount - 사용할 포인트 (양수로 입력, 음수로 저장됨)
 * @param type - 포인트 유형
 * @param reason - 사용 사유
 * @param referenceType - 참조 타입
 * @param referenceId - 참조 ID
 * @throws 포인트가 부족한 경우 에러
 */
export async function spendPoints(
  pool: Pool,
  userId: number,
  amount: number,
  type: string,
  reason: string,
  referenceType?: string,
  referenceId?: number
): Promise<void> {
  // 현재 포인트 확인
  const currentPoints = await getUserPoints(pool, userId);

  if (currentPoints < amount) {
    throw new Error('포인트가 부족합니다');
  }

  const query = `
    INSERT INTO points (user_id, amount, type, reason, reference_type, reference_id)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
  await pool.query(query, [userId, -amount, type, reason, referenceType, referenceId]);
}
