# 서로말 프로젝트 코딩 지침

## 0. AI 코딩 어시스턴트 작업 프로세스 (최우선)

### ⚠️ 함부로 코딩하지 말 것

**모든 작업은 반드시 아래 순서를 따를 것:**

1. **문제 파악 및 분석**
   - 사용자 요청 정확히 이해
   - 현재 코드베이스 상태 파악
   - 영향받는 파일/테이블 분석
   - 잠재적 문제점 및 위험 요소 파악

2. **전략 수립 및 제안**
   - 여러 해결 방안 제시 (최소 2개 이상)
   - 각 방안의 장단점 명확히 설명
   - 추천 방안 제시 및 근거 설명
   - 예상되는 작업 범위 명시

3. **사용자 승인 대기 (필수)**
   - "이렇게 진행할까요?" 또는 "작업을 시작할까요?" 질문
   - 사용자가 명시적으로 승인할 때까지 코딩 금지
   - 승인 표현 예시: "시작", "ㄱㄱ", "해봐", "좋아", "ok"
   - **승인 없이 절대 코드 작성/수정 금지**

4. **승인 후 작업 시작**
   - TodoWrite로 작업 목록 작성
   - 단계별로 구현하며 진행 상황 보고
   - 각 단계 완료 시 TodoWrite 업데이트

5. **Git 커밋/푸시 금지**
   - **절대로 AI가 임의로 git commit 또는 git push 하지 말 것**
   - 코드 작업 완료 후 사용자가 직접 커밋/푸시함
   - 변경 사항 요약만 제공하고 커밋은 사용자 판단에 맡김

### ❌ 잘못된 예시
```
사용자: "회원 탈퇴하면 테이블에서 삭제하면 문제 생길 것 같은데?"
AI: [바로 Soft Delete 마이그레이션 파일 생성 + 코드 수정 시작] ← 잘못됨!
```

### ✅ 올바른 예시
```
사용자: "회원 탈퇴하면 테이블에서 삭제하면 문제 생길 것 같은데?"
AI: "맞습니다. 문제가 발생할 수 있습니다.

발생 가능한 문제:
1. 다른 사용자의 평가/통화내역 데이터가 함께 삭제됨
2. 통계 데이터 손실
3. 법적 보관 의무 위반 가능

해결 방안:
1. Soft Delete (추천)
   - 장점: 데이터 보존, 복구 가능, 개인정보 익명화
   - 단점: DB 용량 증가

2. Hard Delete + 데이터 아카이빙
   - 장점: 운영 DB 용량 관리
   - 단점: 복잡도 증가, 복구 어려움

Soft Delete 방식을 추천합니다. 작업을 시작할까요?"

사용자: "ㄱㄱ"
AI: [TodoWrite 작성 후 작업 시작]
```

## 1. 언어 및 커뮤니케이션
- **모든 응답은 한글로 작성**
- 코드 주석도 한글 사용
- 변수명/함수명은 영어 (camelCase)

## 2. 데이터베이스 작업

### 현재 운영 중인 테이블 스키마

#### users 테이블
```sql
create table public.users (
  id serial not null,
  email text not null,
  name text null,
  provider text not null,
  social_id text null,
  refresh_token text null,
  nickname text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  password text null,
  age_group integer null,
  gender text null,
  constraint users_pkey primary key (id),
  constraint users_email_provider_key unique (email, provider)
) TABLESPACE pg_default;
```

#### ratings 테이블
```sql
create table public.ratings (
  id serial not null,
  call_history_id integer not null,
  rater_user_id integer not null,
  rated_user_id integer not null,
  rating integer not null,
  created_at timestamp with time zone null default now(),
  constraint ratings_pkey primary key (id),
  constraint ratings_unique_rater_call unique (call_history_id, rater_user_id),
  constraint ratings_call_history_id_fkey foreign KEY (call_history_id) references call_history (id) on delete CASCADE,
  constraint ratings_rated_user_id_fkey foreign KEY (rated_user_id) references users (id) on delete CASCADE,
  constraint ratings_rater_user_id_fkey foreign KEY (rater_user_id) references users (id) on delete CASCADE,
  constraint ratings_rating_check check ((rating >= 1) and (rating <= 4))
) TABLESPACE pg_default;

create index IF not exists idx_ratings_rater_user_id on public.ratings using btree (rater_user_id) TABLESPACE pg_default;
create index IF not exists idx_ratings_rated_user_id on public.ratings using btree (rated_user_id) TABLESPACE pg_default;
create index IF not exists idx_ratings_call_history_id on public.ratings using btree (call_history_id) TABLESPACE pg_default;
create index IF not exists idx_ratings_created_at on public.ratings using btree (created_at desc) TABLESPACE pg_default;
```

#### points 테이블
```sql
create table public.points (
  id serial not null,
  user_id integer not null,
  amount integer not null,
  type text not null,
  description text null,
  created_at timestamp with time zone null default now(),
  constraint points_pkey primary key (id),
  constraint points_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_points_user_id on public.points using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_points_created_at on public.points using btree (created_at desc) TABLESPACE pg_default;
```

#### call_history 테이블
```sql
create table public.call_history (
  id serial not null,
  room_id text not null,
  room_title text not null,
  category text not null,
  host_user_id integer not null,
  host_nickname text not null,
  guest_user_id integer not null,
  guest_nickname text not null,
  duration integer not null default 0,
  started_at timestamp without time zone null default CURRENT_TIMESTAMP,
  ended_at timestamp without time zone null,
  host_point_change integer not null default 0,
  guest_point_change integer not null default 0,
  created_at timestamp with time zone null default now(),
  constraint call_history_pkey primary key (id),
  constraint call_history_guest_user_id_fkey foreign KEY (guest_user_id) references users (id) on delete CASCADE,
  constraint call_history_host_user_id_fkey foreign KEY (host_user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_call_history_host_user_id on public.call_history using btree (host_user_id) TABLESPACE pg_default;
create index IF not exists idx_call_history_guest_user_id on public.call_history using btree (guest_user_id) TABLESPACE pg_default;
create index IF not exists idx_call_history_created_at on public.call_history using btree (created_at desc) TABLESPACE pg_default;
create index IF not exists idx_call_history_host_created on public.call_history using btree (host_user_id, created_at desc) TABLESPACE pg_default;
create index IF not exists idx_call_history_guest_created on public.call_history using btree (guest_user_id, created_at desc) TABLESPACE pg_default;
```

### DB 작업 규칙
- **반드시 위 테이블 스키마를 참고할 것**
- 새 컬럼 추가 시 기존 스키마와 일관성 유지
- 트랜잭션이 필요한 작업은 반드시 `BEGIN` ~ `COMMIT` 사용
- 에러 발생 시 `ROLLBACK` 처리

### DB 타입 규칙 (필수)
- **ID 컬럼**: `SERIAL` (자동 증가하는 int4)
- **텍스트 컬럼**: `TEXT` 사용 (VARCHAR 사용 금지)
- **시간 컬럼**: `TIMESTAMPTZ` (timestamp with time zone)
  - 생성일: `created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`
  - 수정일: `updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`
- **외래키**: `INTEGER` + `REFERENCES` + `ON DELETE CASCADE`

## 3. 프론트엔드 ↔ 백엔드 통신

### 필수 규칙
- **프론트에서 백엔드 호출 시 반드시 Service 레이어를 거칠 것**
  ```typescript
  // ✅ 올바른 방법
  await RatingService.submitRating(callHistoryId, rating);

  // ❌ 잘못된 방법
  await fetch('/api/ratings', { ... });
  ```

- **axios를 사용하여 HTTP 요청**
  ```typescript
  import { apiClient } from '@/lib/api-client';

  const response = await apiClient.post('/ratings', data);
  ```

- **직접 fetch 사용 금지**

## 4. 파일 구조

```
프론트엔드:
├── services/*.service.ts      # API 호출 로직 (예: auth.service.ts, rating.service.ts)
├── app/**/page.tsx            # 페이지 컴포넌트
├── components/*.tsx           # 재사용 컴포넌트
├── hooks/*.ts                 # 커스텀 훅 (예: useSocket.ts)
└── lib/*.ts                   # 유틸리티 (예: api-client.ts, socket.ts)

백엔드:
├── server/controllers/*.controller.ts  # 비즈니스 로직
├── server/routes/*.ts                  # 라우트 정의
├── server/lib/db.ts                    # DB 연결
└── server.ts                           # 메인 서버 (라우트 등록)
```

## 5. 타입 정의

### Service 파일에 인터페이스 정의
```typescript
// services/rating.service.ts
export interface Rating {
  id: number;
  call_history_id: number;
  rater_user_id: number;
  rated_user_id: number;
  rating: number;
  created_at: string;
}

export interface RatingResponse {
  message: string;
  data: {
    rating: Rating;
    pointsAwarded: number;
  };
}
```

### 타입 규칙
- 백엔드 응답 타입 명시 (예: `RatingResponse`)
- nullable 필드는 `| null` 명시
- 테이블 컬럼명과 동일하게 snake_case 사용 (DB와 일치)

## 6. 에러 핸들링

```typescript
try {
  const result = await SomeService.doSomething();
  // 성공 처리
} catch (error: any) {
  console.error('에러 발생:', error);
  // 사용자에게 친절한 메시지
  alert(error.response?.data?.error || '작업에 실패했습니다.');
}
```

### 규칙
- 모든 async 함수는 try-catch 사용
- 콘솔 로그로 디버깅 정보 출력
- 사용자에게는 이해하기 쉬운 한글 메시지

## 7. 소켓 통신

- Socket.io 사용
- 인증된 사용자는 `authenticate` 이벤트로 등록
- 방 관련 이벤트: `createRoom`, `joinRoom`, `leaveRoom`, `getRooms`
- 실시간 업데이트: `roomList`, `roomCreated`, `roomUpdated`, `roomDeleted`


## 8. 네이밍 컨벤션

- **변수/함수**: camelCase (예: `getUserData`, `isLoading`)
- **컴포넌트**: PascalCase (예: `RatingModal`, `CreateRoomModal`)
- **타입/인터페이스**: PascalCase (예: `User`, `RatingResponse`)
- **상수**: UPPER_SNAKE_CASE (예: `MAX_CALL_DURATION`)
- **파일명**: kebab-case 또는 PascalCase (컴포넌트는 PascalCase)

