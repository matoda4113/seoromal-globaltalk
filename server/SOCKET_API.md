# 서로말 Socket.IO API 문서

## 개요
서로말 실시간 통신 서버의 Socket.IO 이벤트 명령어 문서입니다.

---

## 클라이언트 → 서버 이벤트 (Client Emit)

### 1. `authenticate`
사용자 인증 (로그인한 사용자)

**데이터:**
```typescript
{
  userId: number;
  email: string;
  nickname: string;
  profileImageUrl?: string;
  ageGroup?: number;
  gender?: string;
}
```

**설명:**
- 익명 사용자를 인증된 사용자로 전환
- 같은 userId는 중복 제거됨 (최신 소켓 연결 유지)

---

### 2. `getOnlineCount`
현재 온라인 사용자 수 조회

**데이터:** 없음

**응답:** `onlineCount` 이벤트

---

### 3. `getRooms`
현재 활성 방 목록 조회

**데이터:** 없음

**응답:** `roomList` 이벤트

---

### 4. `createRoom`
새로운 방 생성 (로그인 필수)

**데이터:**
```typescript
{
  title: string;           // 방 제목
  language: 'ko' | 'en' | 'ja';  // 사용 언어
  topic: 'free' | 'romance' | 'hobby' | 'business' | 'travel';  // 주제
  roomType: 'voice' | 'video';  // 통화 타입 (audio/video)
  isPrivate: boolean;      // 비공개 방 여부
  password?: string;       // 비공개 방 비밀번호 (isPrivate=true일 때 필수)
}
```

**응답:**
- 성공: `roomCreated`, `roomJoined`, `roomListUpdated` (브로드캐스트)
- 실패: `error`

**조건:**
- 로그인한 사용자만 방 생성 가능
- 이미 다른 방에 참가 중이면 불가
- 비공개 방은 비밀번호 필수

---

### 5. `joinRoom`
방 입장 (로그인 필수)

**데이터:**
```typescript
{
  roomId: string;      // 입장할 방 ID
  nickname?: string;   // 닉네임 (현재는 authUser 닉네임 사용)
  password?: string;   // 비공개 방 비밀번호
}
```

**응답:**
- 성공: `roomJoined`, `roomUpdated`, `roomListUpdated` (브로드캐스트)
- 실패: `error`

**조건:**
- 로그인한 사용자만 입장 가능
- 이미 다른 방에 참가 중이면 불가
- 방 정원(2명) 초과 시 불가
- 비공개 방은 비밀번호 일치 필요
- **포인트 체크:**
  - 오디오 방: 최소 10점 필요
  - 비디오 방: 최소 40점 필요

---

### 6. `leaveRoom`
방 나가기

**데이터:**
```typescript
{
  roomId: string;  // 나갈 방 ID
}
```

**응답:**
- 성공: `roomLeft`, 상대방에게 `roomUpdated` 또는 `roomClosed`
- 실패: `error`

**동작:**
- **호스트가 나가는 경우:**
  - 방 삭제
  - 게스트에게 `roomClosed` 전송
  - 통화 시간이 10분 미만이면 호스트 패널티 5점 차감

- **게스트가 나가는 경우:**
  - 방에서 제거
  - 호스트에게 `roomUpdated` 전송

- **통화 기록 및 정산:**
  - 15초 이상 통화 시 call_history 기록
  - 게스트: 기본 요금 + 시간당 요금 차감
  - 호스트: 시간당 수익 지급

---

### 7. `sendMessage`
채팅 메시지 전송

**데이터:**
```typescript
{
  roomId: string;    // 메시지를 보낼 방 ID
  message: string;   // 메시지 내용
  type?: 'text' | 'stt';  // 메시지 타입 (text: 수동 입력, stt: 음성인식)
}
```

**응답:**
- 방 참가자 전체에게 `newMessage` 브로드캐스트

**메시지 객체:**
```typescript
{
  id: string;
  roomId: string;
  senderId: number | null;
  senderNickname: string;
  senderProfileImage?: string;
  message: string;
  timestamp: string;  // ISO 8601
  type: 'text' | 'stt';
}
```

---

### 8. `updateRoomTitle`
방 제목 수정 (방장만 가능)

**데이터:**
```typescript
{
  roomId: string;   // 방 ID
  newTitle: string; // 새 제목 (1-50자)
}
```

**응답:**
- 성공: 방 참가자에게 `roomUpdated`, 전체에게 `roomListUpdated` 브로드캐스트
- 실패: `error`

**조건:**
- 방장(호스트)만 수정 가능
- 제목은 1-50자 이내

---

## 서버 → 클라이언트 이벤트 (Server Emit)

### 1. `onlineCount`
현재 온라인 사용자 정보

**데이터:**
```typescript
{
  total: number;          // 전체 온라인 사용자 수
  authenticated: number;  // 로그인한 사용자 수
  anonymous: number;      // 비로그인 사용자 수
  authenticatedUsers: Array<{
    userId: number;
    nickname: string;
    profileImageUrl?: string;
    ageGroup?: number;
    gender?: string;
  }>;
}
```

**발생 시점:**
- 사용자 연결/인증/연결 해제 시
- `getOnlineCount` 요청 시

---

### 2. `roomList`
현재 활성 방 목록

**데이터:**
```typescript
Room[] // 참가 가능한 방 목록 (정원 미달 방만)
```

**Room 객체:**
```typescript
{
  id: string;
  title: string;
  hostId: number;
  hostNickname: string;
  hostProfileImage?: string;
  hostBio?: string;
  hostDegree?: number;        // 매너 온도
  hostAverageRating?: number; // 평균 평점
  hostTotalRatings?: number;  // 총 평가 수
  language: 'ko' | 'en' | 'ja';
  topic: 'free' | 'romance' | 'hobby' | 'business' | 'travel';
  callType: 'audio' | 'video';
  maxParticipants: number;    // 현재 2명 고정
  isPrivate: boolean;
  password?: string;
  participants: Participant[];
  createdAt: string;
  sessionStartedAt?: Date;    // 2명이 모였을 때 시작
}
```

**발생 시점:**
- `getRooms` 요청 시

---

### 3. `roomCreated`
방 생성 성공

**데이터:**
```typescript
{
  roomId: string;  // 생성된 방 ID
}
```

**발생 시점:**
- `createRoom` 성공 시

---

### 4. `roomJoined`
방 입장 성공

**데이터:**
```typescript
{
  ...Room,  // 방 전체 정보
  agoraAppId: string;  // Agora App ID
  guestBalance?: number;  // 게스트인 경우 현재 포인트 잔액
}
```

**발생 시점:**
- `createRoom` 성공 시 (호스트 자동 입장)
- `joinRoom` 성공 시

---

### 5. `roomUpdated`
방 정보 업데이트

**데이터:**
```typescript
Room  // 업데이트된 방 정보
```

**발생 시점:**
- 참가자 입장/퇴장
- 방 제목 변경
- 세션 시작 (2명이 모였을 때)

---

### 6. `roomListUpdated`
방 목록 업데이트 (전체 브로드캐스트)

**데이터:**
```typescript
Room  // 업데이트된 방 정보
```

**발생 시점:**
- 새 방 생성
- 참가자 입장/퇴장
- 방 제목 변경

---

### 7. `roomDeleted`
방 삭제 알림 (전체 브로드캐스트)

**데이터:**
```typescript
string  // 삭제된 방 ID
```

**발생 시점:**
- 호스트가 방 나감
- 호스트 연결 끊김

---

### 8. `roomClosed`
방 강제 종료 (게스트에게 전송)

**데이터:**
```typescript
{
  roomId: string;
  reason: 'host_left' | 'host_disconnected';
  message: string;
  showRatingModal: boolean;  // 10분 이상 통화 시 true
  hostUserId?: number;       // 평가할 호스트 ID
}
```

**발생 시점:**
- 호스트가 방을 나가거나 연결이 끊김

---

### 9. `roomLeft`
방 나가기 성공

**데이터:**
```typescript
{
  roomId: string;
  showRatingModal?: boolean;  // 10분 이상 통화 시 true
  hostUserId?: number;        // 평가할 호스트 ID (게스트인 경우)
}
```

**발생 시점:**
- `leaveRoom` 성공 시

---

### 10. `newMessage`
새 채팅 메시지 (방 참가자에게 브로드캐스트)

**데이터:**
```typescript
{
  id: string;
  roomId: string;
  senderId: number | null;
  senderNickname: string;
  senderProfileImage?: string;
  message: string;
  timestamp: string;  // ISO 8601
  type: 'text' | 'stt';
}
```

**발생 시점:**
- `sendMessage` 이벤트 수신 시

---

### 11. `pointsUpdated`
포인트 잔액 업데이트

**데이터:**
```typescript
{
  balance: number;  // 새 포인트 잔액
}
```

**발생 시점:**
- 포인트 충전
- 통화 정산
- 선물 송수신

---

### 12. `giftReceived`
선물 수신 알림

**데이터:**
```typescript
{
  senderNickname: string;  // 선물 보낸 사람
  amount: number;          // 선물 포인트
  newBalance: number;      // 새 잔액
}
```

**발생 시점:**
- 다른 사용자가 선물을 보냈을 때

---

### 13. `error`
에러 메시지

**데이터:**
```typescript
{
  message: string;  // 에러 메시지
}
```

**발생 시점:**
- 권한 부족
- 유효성 검증 실패
- 비즈니스 로직 오류

---

## 정산 로직

### 게스트 정산
- **15초 이하**: 정산 없음 (무료)
- **15초 초과**:
  - 기본 요금: 오디오 10점, 비디오 40점
  - 분당 요금: 오디오 1점/분, 비디오 4점/분
  - 최종 차감 = max(기본 요금, 시간 * 분당 요금) - **올림 처리**

### 호스트 정산
- **정상 퇴장**: 실제 통화 시간 * 분당 요금 지급 (올림 처리)
  - 오디오: 1점/분
  - 비디오: 4점/분
- **조기 퇴장 (10분 미만)**: 패널티 5점 차감, 수익 없음

### 평가 모달 조건
- 통화 시간 10분 이상 (테스트: 5초)
- 게스트가 나갈 때만 호스트 평가 가능

---

## 연결 상태

### 초기 연결
```
1. Client connects → 익명 사용자로 등록
2. Client emits 'authenticate' → 인증된 사용자로 전환
3. Server broadcasts 'onlineCount'
```

### 연결 해제
```
1. Client disconnects
2. Server removes from authenticated/anonymous users
3. Server calls handleUserLeaveRoom('disconnected')
4. Server broadcasts 'onlineCount'
```

---

## 주요 제약사항

1. **방 생성/입장**: 로그인 필수
2. **동시 참가**: 한 사용자당 하나의 방만 참가 가능
3. **방 정원**: 현재 2명 고정 (1:1 통화)
4. **포인트 제한**:
   - 오디오 방 입장: 최소 10점
   - 비디오 방 입장: 최소 40점
5. **비공개 방**: 비밀번호 필수

---

## 데이터베이스 연동

### call_history 테이블
- 통화 기록 저장
- 정산 금액 기록
- 평가 시스템에 연동

### points 테이블
- 포인트 트랜잭션 기록
- type: 'charge' (차감), 'earn' (수익)
- reason: 'call_charge', 'call_earning', 'early_exit_penalty'

### ratings 테이블
- 호스트 평가 저장 (call_history 참조)

---

## 환경 변수

```env
NEXT_PUBLIC_AGORA_APP_ID=<Agora App ID>
```

---

## 로깅

모든 주요 이벤트는 `loggerBack`를 통해 로깅됩니다:
- ✅ 연결/인증
- 🏠 방 생성
- 👋 입장/퇴장
- 💬 메시지
- 💰 정산
- ⚠️ 패널티
- ❌ 에러
