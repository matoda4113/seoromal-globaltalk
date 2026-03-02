# 포인트 시스템 API 문서

## 목차
1. [개요](#개요)
2. [포인트 수입 (Earn)](#포인트-수입-earn)
3. [포인트 지출 (Charge)](#포인트-지출-charge)
4. [포인트 조회 API](#포인트-조회-api)
5. [데이터베이스 스키마](#데이터베이스-스키마)

---

## 개요

포인트 시스템은 사용자의 활동에 따라 포인트를 적립하고 차감하는 기능을 제공합니다.
- **수입(earn)**: 양수(+) 금액으로 포인트 적립
- **지출(charge)**: 음수(-) 금액으로 포인트 차감
- **총 포인트**: `points` 테이블의 `amount` 컬럼 합계로 계산

---

## 포인트 수입 (Earn)

### 1. 회원가입 축하 포인트
- **금액**: +50 포인트
- **트리거**: 신규 회원가입 시
- **타입**: `earn`
- **사유**: `회원가입 축하 포인트`
- **참조**: `reference_type: 'signup'`
- **구현 위치**: `server/controllers/auth.controller.ts:192`, `server/controllers/auth.controller.ts:285`

```typescript
await addPoints(pool, user.id, 50, 'earn', '회원가입 축하 포인트', 'signup');
```

### 2. 호스트 통화 수익
- **금액**: 통화 시간에 따라 변동
  - 오디오: 1분당 1포인트
  - 비디오: 1분당 4포인트
- **계산 방식**: `Math.ceil(sessionDurationSeconds / 60) * pointsPerMinute`
- **트리거**: 통화 종료 시
- **타입**: `earn`
- **사유**: `call_earning`
- **참조**: `reference_type: 'call_history'`, `reference_id: callId`
- **구현 위치**: `server/lib/socket-handlers.ts:183-195`

```typescript
const sessionMinutes = Math.ceil(sessionDurationSeconds / 60);
const pointsPerMinute = room.callType === 'audio' ? 1 : 4;
const hostEarnings = sessionMinutes * pointsPerMinute;

await pool.query(
  `INSERT INTO points (user_id, amount, type, reason, reference_type, reference_id)
   VALUES ($1, $2, $3, $4, $5, $6)`,
  [participant.userId, hostEarnings, 'earn', 'call_earning', 'call_history', callId]
);
```

### 3. 평가 작성 보상
- **금액**: +1 포인트
- **트리거**: 통화 후 상대방 평가 작성 시
- **타입**: `earn`
- **사유**: `rating_reward`
- **참조**: `reference_type: 'ratings'`, `reference_id: callId`
- **구현 위치**: `server/controllers/ratings.controller.ts:82-87`

```typescript
await pool.query(
  `INSERT INTO points (user_id, amount, type, reason, reference_type, reference_id)
   VALUES ($1, $2, $3, $4, $5, $6)`,
  [raterUserId, 1, 'earn', 'rating_reward', 'ratings', callId]
);
```

### 4. 5점 평가 받은 보너스
- **금액**: +1 포인트
- **트리거**: 상대방으로부터 5점 평가를 받았을 때
- **타입**: `earn`
- **사유**: `five_star_bonus`
- **참조**: `reference_type: 'ratings'`, `reference_id: callId`
- **구현 위치**: `server/controllers/ratings.controller.ts:90-96`

```typescript
if (ratingScore === 5) {
  await pool.query(
    `INSERT INTO points (user_id, amount, type, reason, reference_type, reference_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [ratedUserId, 1, 'earn', 'five_star_bonus', 'ratings', callId]
  );
}
```

### 5. 선물 받기
- **금액**: 50, 100, 200, 300 포인트 중 선택
- **트리거**: 다른 사용자가 선물 전송 시
- **타입**: `earn`
- **사유**: `gift_received`
- **참조**: `reference_type: 'users'`, `reference_id: senderUserId`
- **구현 위치**: `server/controllers/gift.controller.ts:72-76`

```typescript
await pool.query(
  `INSERT INTO points (user_id, amount, type, reason, reference_type, reference_id)
   VALUES ($1, $2, $3, $4, $5, $6)`,
  [recipientUserId, amount, 'earn', 'gift_received', 'users', senderUserId]
);
```

---

## 포인트 지출 (Charge)

### 1. 게스트 통화 요금
- **금액**: 통화 시간과 타입에 따라 변동
  - **기본 요금**
    - 오디오: 10포인트
    - 비디오: 40포인트
  - **시간당 요금** (1분 단위 올림)
    - 오디오: 1분당 1포인트
    - 비디오: 1분당 4포인트
  - **최종 차감**: `Math.max(기본요금, 시간당요금)`
- **예외**: 15초 이하 통화는 차감 없음
- **트리거**: 통화 종료 시
- **타입**: `charge`
- **사유**: `call_charge`
- **참조**: `reference_type: 'call_history'`, `reference_id: callId`
- **구현 위치**: `server/lib/socket-handlers.ts:136-165`

```typescript
const baseCharge = room.callType === 'audio' ? 10 : 40;
const pointsPerMinute = room.callType === 'audio' ? 1 : 4;
const sessionMinutes = Math.ceil(sessionDurationSeconds / 60);
const timeBasedCharge = sessionMinutes * pointsPerMinute;
const guestCharge = Math.max(baseCharge, timeBasedCharge);

await pool.query(
  `INSERT INTO points (user_id, amount, type, reason, reference_type, reference_id)
   VALUES ($1, $2, $3, $4, $5, $6)`,
  [participant.userId, -guestCharge, 'charge', 'call_charge', 'call_history', callId]
);
```

### 2. 호스트 조기 퇴장 패널티
- **금액**: -5 포인트
- **트리거**: 호스트가 10분 이내 조기 퇴장 시
- **타입**: `charge`
- **사유**: `early_exit_penalty`
- **참조**: `reference_type: 'call_history'`, `reference_id: callId`
- **구현 위치**: `server/lib/socket-handlers.ts:211-227`

```typescript
const penaltyPoints = 5;

await pool.query(
  `INSERT INTO points (user_id, amount, type, reason, reference_type, reference_id)
   VALUES ($1, $2, $3, $4, $5, $6)`,
  [host.userId, -penaltyPoints, 'charge', 'early_exit_penalty', 'call_history', callId]
);
```

### 3. 선물 보내기
- **금액**: -50, -100, -200, -300 포인트 중 선택
- **트리거**: 사용자가 다른 사용자에게 선물 전송 시
- **타입**: `charge`
- **사유**: `gift_sent`
- **참조**: `reference_type: 'users'`, `reference_id: recipientUserId`
- **구현 위치**: `server/controllers/gift.controller.ts:64-69`

```typescript
await pool.query(
  `INSERT INTO points (user_id, amount, type, reason, reference_type, reference_id)
   VALUES ($1, $2, $3, $4, $5, $6)`,
  [senderUserId, -amount, 'charge', 'gift_sent', 'users', recipientUserId]
);
```

---

## 포인트 조회 API

### 1. 포인트 내역 조회

**Endpoint**: `GET /api/points/history`

**Headers**:
```
Cookie: accessToken={JWT_TOKEN}
```

**Response**:
```json
{
  "message": "Points history retrieved successfully",
  "data": {
    "totalPoints": 150,
    "history": [
      {
        "id": 123,
        "amount": 50,
        "type": "earn",
        "reason": "회원가입 축하 포인트",
        "reference_type": "signup",
        "reference_id": null,
        "created_at": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": 124,
        "amount": -10,
        "type": "charge",
        "reason": "call_charge",
        "reference_type": "call_history",
        "reference_id": 456,
        "created_at": "2024-01-15T11:00:00.000Z"
      }
    ]
  }
}
```

**구현 위치**: `server/controllers/points.controller.ts:9-49`

**특징**:
- 최근 100개 내역 조회
- 최신순 정렬 (created_at DESC)
- 인증 필요 (authenticate middleware)

---

## 데이터베이스 스키마

### points 테이블

```sql
CREATE TABLE points (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,           -- 양수: 수입, 음수: 지출
  type VARCHAR(50) NOT NULL,         -- 'earn' 또는 'charge'
  reason VARCHAR(255) NOT NULL,      -- 포인트 변동 사유
  reference_type VARCHAR(50),        -- 참조 타입 (signup, call_history, ratings, users 등)
  reference_id INTEGER,              -- 참조 ID
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 포인트 타입 (type)

| 타입 | 설명 |
|------|------|
| `earn` | 포인트 수입 (양수) |
| `charge` | 포인트 지출 (음수) |

### 포인트 사유 (reason)

| 사유 | 설명 | 금액 | 타입 |
|------|------|------|------|
| `회원가입 축하 포인트` | 신규 회원가입 | +50 | earn |
| `call_earning` | 호스트 통화 수익 | 변동 | earn |
| `rating_reward` | 평가 작성 보상 | +1 | earn |
| `five_star_bonus` | 5점 평가 받은 보너스 | +1 | earn |
| `gift_received` | 선물 받기 | +50~300 | earn |
| `call_charge` | 게스트 통화 요금 | 변동 | charge |
| `early_exit_penalty` | 호스트 조기 퇴장 패널티 | -5 | charge |
| `gift_sent` | 선물 보내기 | -50~300 | charge |

### 참조 타입 (reference_type)

| 타입 | 설명 |
|------|------|
| `signup` | 회원가입 |
| `call_history` | 통화 기록 |
| `ratings` | 평가 |
| `users` | 사용자 (선물) |

---

## 포인트 계산 헬퍼 함수

### getUserPoints
현재 사용자의 총 포인트를 조회합니다.

```typescript
export async function getUserPoints(pool: Pool, userId: number): Promise<number> {
  const query = `
    SELECT COALESCE(SUM(amount), 0) as total_points
    FROM points
    WHERE user_id = $1
  `;
  const result = await pool.query(query, [userId]);
  return parseInt(result.rows[0].total_points) || 0;
}
```

### addPoints
포인트를 적립합니다.

```typescript
export async function addPoints(
  pool: Pool,
  userId: number,
  amount: number,
  type: string,
  reason: string,
  referenceType?: string,
  referenceId?: number
): Promise<void>
```

### spendPoints
포인트를 차감합니다. 잔액이 부족하면 에러를 발생시킵니다.

```typescript
export async function spendPoints(
  pool: Pool,
  userId: number,
  amount: number,
  type: string,
  reason: string,
  referenceType?: string,
  referenceId?: number
): Promise<void>
```

**구현 위치**: `server/lib/points.ts`

---

## 소켓 이벤트

### pointsUpdated
포인트 잔액이 변경되었을 때 클라이언트에게 알림을 전송합니다.

```typescript
socket.on('pointsUpdated', (data) => {
  console.log('새로운 잔액:', data.balance);
});
```

**Payload**:
```json
{
  "balance": 150
}
```

### giftReceived
선물을 받았을 때 클라이언트에게 알림을 전송합니다.

```typescript
socket.on('giftReceived', (data) => {
  console.log(`${data.senderNickname}님이 ${data.amount}포인트를 선물했습니다!`);
  console.log('새로운 잔액:', data.newBalance);
});
```

**Payload**:
```json
{
  "senderNickname": "홍길동",
  "amount": 100,
  "newBalance": 250
}
```

**구현 위치**: `server/lib/socket-handlers.ts:45-75`

---

## 통화 요금 시뮬레이션

### 오디오 통화
| 통화 시간 | 게스트 차감 | 호스트 수익 |
|-----------|------------|------------|
| 15초 이하 | 0점 | 0점 |
| 1분 | 10점 (기본) | 1점 |
| 5분 | 10점 (기본) | 5점 |
| 10분 | 10점 (기본) | 10점 |
| 11분 | 11점 | 11점 |
| 20분 | 20점 | 20점 |

### 비디오 통화
| 통화 시간 | 게스트 차감 | 호스트 수익 |
|-----------|------------|------------|
| 15초 이하 | 0점 | 0점 |
| 1분 | 40점 (기본) | 4점 |
| 5분 | 40점 (기본) | 20점 |
| 10분 | 40점 (기본) | 40점 |
| 11분 | 44점 | 44점 |
| 20분 | 80점 | 80점 |

**주의사항**:
- 게스트는 기본 요금과 시간당 요금 중 **큰 값**으로 차감
- 호스트는 **실제 통화 시간**만큼만 수익 (올림 처리)
- 호스트 조기 퇴장 시 수익 없음 + 패널티 5점 부과
- 15초 이하 통화는 게스트 차감 없음

---

## 선물하기 API

### Endpoint
`POST /api/gift`

### Headers
```
Cookie: accessToken={JWT_TOKEN}
Content-Type: application/json
```

### Request Body
```json
{
  "recipientUserId": 123,
  "amount": 100
}
```

### Response
```json
{
  "message": "선물이 전송되었습니다.",
  "newBalance": 50
}
```

### 제약사항
- 선물 금액: 50, 100, 200, 300 포인트만 가능
- 자기 자신에게 선물 불가
- 잔액 부족 시 400 에러
- 수신자가 존재하지 않으면 404 에러

**구현 위치**: `server/controllers/gift.controller.ts:10-112`

---

## 입장 포인트 체크

게스트가 방에 입장할 때 최소 포인트를 확인합니다.

### 최소 포인트
- 오디오: 10포인트
- 비디오: 40포인트

### 체크 시점
- Socket 이벤트: `joinRoom`
- 게스트만 체크 (호스트는 체크 안 함)

**구현 위치**: `server/lib/socket-handlers.ts:663-686`

```typescript
const minPoints = room.callType === 'audio' ? 10 : 40;
if (balance < minPoints) {
  socket.emit('error', {
    message: `포인트가 부족합니다. (현재 ${balance}점, 최소 ${minPoints}점 필요)`
  });
  return;
}
```