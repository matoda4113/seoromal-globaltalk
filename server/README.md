# Server 디렉터리 구조

## 📁 디렉터리 설명

### `/controllers`
비즈니스 로직을 처리하는 컨트롤러
- 예: `auth.controller.ts`, `room.controller.ts`

### `/lib`
외부 서비스 및 라이브러리 설정
- `db.ts`: Supabase 데이터베이스 클라이언트
- `socket.ts`: Socket.io 설정 (추후 추가)
- `agora.ts`: Agora SDK 설정 (추후 추가)

### `/middlewares`
Express 미들웨어
- `auth.middleware.ts`: 인증 미들웨어
- `error.middleware.ts`: 에러 핸들링 미들웨어

### `/routes`
API 라우트 정의
- 예: `auth.routes.ts`, `room.routes.ts`

### `/services`
재사용 가능한 비즈니스 로직
- 데이터베이스 쿼리, 외부 API 호출 등

### `/utils`
유틸리티 함수
- `logger.ts`: 로깅 유틸리티
- 기타 헬퍼 함수

## 사용 방법

```typescript
// server.js에서 라우트 등록 예시
import healthRoutes from './server/routes/health.routes';

app.use('/api/health', healthRoutes);
```

## 코딩 가이드라인

프로젝트 루트의 `CODING_GUIDELINES.md` 참고
