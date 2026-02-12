# 포인트 시스템 정리

## 포인트 테이블 구조

```sql
create table public.points (
  id serial,
  user_id integer,
  amount integer,          -- 포인트 증감량 (양수/음수)
  type text,              -- 'earn' 또는 'charge'
  reason text,            -- 포인트 발생 사유
  reference_type text,    -- 'call_history', 'ratings' 등
  reference_id integer,   -- 참조 ID
  created_at timestamp
)
```

## 포인트 타입 (type)

| 타입 | 설명 |
|------|------|
| `earn` | 포인트 획득 (양수) |
| `charge` | 포인트 차감 (음수) |

## 포인트 발생 사유 (reason)

### 1. 통화 관련

| reason | type | amount | 설명 | 발생 조건 |
|--------|------|--------|------|----------|
| `call_charge` | `charge` | 가변 (음수) | 게스트 통화 요금 | 통화 종료 시 게스트에게 차감<br>max(기본요금, 분×분당포인트)<br>- 오디오: 기본 10점, 1점/분<br>- 비디오: 기본 40점, 4점/분 |
| `call_earning` | `earn` | 가변 (양수) | 호스트 통화 수익 | 통화 종료 시 호스트에게 지급<br>통화분수 × 분당포인트<br>- 오디오: 1점/분<br>- 비디오: 4점/분 |
| `early_exit_penalty` | `charge` | -5 | 호스트 조기 퇴장 패널티 | 호스트가 10분 이내에 방을 나갈 때<br>(게스트가 있는 경우에만) |

### 2. 평가 관련

| reason | type | amount | 설명 | 발생 조건 |
|--------|------|--------|------|----------|
| `rating_reward` | `earn` | +1 | 평가 작성 보상 | 통화 후 평가를 제출한 사람에게 지급 |
| `five_star_bonus` | `earn` | +1 | 5점 평가 보너스 | 5점 평가를 받은 사람에게 지급 |

## 통화 요금 계산 로직

### 기본 원칙
- **게스트 차감**: max(기본요금, 통화시간분수 × 분당포인트)
- **호스트 수익**: 통화시간분수 × 분당포인트
- **통화시간**: 초 단위를 **올림 처리**하여 분으로 계산

### 계산 공식

```typescript
// 기본 요금
const baseCharge = room.callType === 'audio' ? 10 : 40;

// 분당 포인트
const pointsPerMinute = room.callType === 'audio' ? 1 : 4;

// 통화 시간을 분 단위로 올림 처리 (45초 → 1분)
const sessionMinutes = Math.ceil(sessionDurationSeconds / 60);

// 시간당 차감 = 분 × 분당포인트
const timeBasedCharge = sessionMinutes * pointsPerMinute;

// 게스트 최종 차감 = max(기본요금, 시간당차감)
const guestCharge = Math.max(baseCharge, timeBasedCharge);

// 호스트 수익 = 시간당 포인트
const hostEarnings = sessionMinutes * pointsPerMinute;
```

### 요금표

| 통화 타입 | 기본 요금 | 분당 포인트 |
|-----------|-----------|-------------|
| 오디오콜 | 10점 | 1점/분 |
| 비디오콜 | 40점 | 4점/분 |

### 계산 예시 (오디오콜 기준)

| 통화 시간 | 분 단위 (올림) | 게스트 차감 | 호스트 수익 | 설명 |
|-----------|----------------|-------------|-------------|------|
| 45초 | 1분 | -10점 | +1점 | max(10, 1) = 10 |
| 5분 | 5분 | -10점 | +5점 | max(10, 5) = 10 |
| 10분 | 10분 | -10점 | +10점 | max(10, 10) = 10 |
| 15분 | 15분 | -15점 | +15점 | max(10, 15) = 15 |
| 30분 | 30분 | -30점 | +30점 | max(10, 30) = 30 |

### 계산 예시 (비디오콜 기준)

| 통화 시간 | 분 단위 (올림) | 게스트 차감 | 호스트 수익 | 설명 |
|-----------|----------------|-------------|-------------|------|
| 45초 | 1분 | -40점 | +4점 | max(40, 4) = 40 |
| 5분 | 5분 | -40점 | +20점 | max(40, 20) = 40 |
| 10분 | 10분 | -40점 | +40점 | max(40, 40) = 40 |
| 15분 | 15분 | -60점 | +60점 | max(40, 60) = 60 |
| 30분 | 30분 | -120점 | +120점 | max(40, 120) = 120 |

## 평가 시스템

### 포인트 보상
- 평가를 작성한 사람: **+1점** (`rating_reward`)
- 5점 평가를 받은 사람: **+1점 보너스** (`five_star_bonus`)

### degree 변화 (users 테이블)
| 평점 | degree 변화 |
|------|-------------|
| 5점 | +0.1 |
| 4점 | +0.05 |
| 3점 | 변화 없음 |
| 2점 | -0.1 |
| 1점 | -0.1 |

## 프론트엔드 번역 가이드

### reason별 표시 텍스트 (예시)

```typescript
const reasonText = {
  ko: {
    call_charge: '통화 요금',
    call_earning: '통화 수익',
    early_exit_penalty: '조기 퇴장 패널티',
    rating_reward: '평가 작성 보상',
    five_star_bonus: '5점 평가 보너스',
  },
  en: {
    call_charge: 'Call Fee',
    call_earning: 'Call Earning',
    early_exit_penalty: 'Early Exit Penalty',
    rating_reward: 'Rating Reward',
    five_star_bonus: '5-Star Bonus',
  },
  ja: {
    call_charge: '通話料金',
    call_earning: '通話収益',
    early_exit_penalty: '早期退出ペナルティ',
    rating_reward: '評価報酬',
    five_star_bonus: '5つ星ボーナス',
  },
};
```

### 상세 설명 텍스트 (예시)

```typescript
const reasonDescription = {
  ko: {
    call_charge: '통화 이용료가 차감되었습니다.',
    call_earning: '통화를 호스팅하여 포인트를 획득했습니다.',
    early_exit_penalty: '10분 이내 조기 퇴장으로 패널티가 부과되었습니다.',
    rating_reward: '평가를 작성하여 보상을 받았습니다.',
    five_star_bonus: '5점 만점 평가를 받아 보너스를 획득했습니다!',
  },
  // ...
};
```

## 구현 파일 위치

- **서버**: `/server/lib/socket-handlers.ts` (통화 정산)
- **서버**: `/server/controllers/ratings.controller.ts` (평가 처리)
- **DB 스키마**: `points` 테이블
