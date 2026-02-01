# 서로말 (SeRoMal)

**"서로 말하고, 서로 배우다"**

익명 음성/화상 기반 한일 언어교환 플랫폼

## 프로젝트 구조

```
seoromal-globaltalk/
├── server.js              # Express + Next.js 통합 서버
├── app/                   # Next.js App Router 페이지
│   ├── layout.tsx        # 루트 레이아웃
│   ├── page.tsx          # 랜딩페이지
│   └── globals.css       # 전역 스타일
├── lib/                   # 유틸리티 및 설정
│   └── i18n.ts           # 다국어 설정 (한국어/일본어)
├── public/               # 정적 파일
├── PROJECT_SPEC.md       # 프로젝트 기획서
└── package.json          # 프로젝트 설정

```

## 기술 스택

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **언어**: 한국어 / 일본어 지원

## 실행 방법

### 개발 모드
```bash
npm run dev
```
서버가 http://localhost:4000 에서 실행됩니다.

### 프로덕션 빌드
```bash
npm run build
npm start
```

## 서버 구조

**server.js**가 Express와 Next.js를 통합합니다:

- `/api/*` - Express API 라우트
- `/*` - Next.js 페이지 (SSR/SSG)

### API 엔드포인트 (예정)

- `GET /api/health` - 서버 상태 확인
- `POST /api/auth/*` - 인증 관련
- `GET /api/rooms` - 방 목록
- `POST /api/rooms` - 방 생성
- 등등...

## 다국어 지원

`lib/i18n.ts`에서 한국어(ko)와 일본어(ja) 번역을 관리합니다.

페이지 우측 상단에서 언어를 전환할 수 있습니다.

## 주요 기능 (MVP)

- [x] 랜딩페이지 (한/일 다국어)
- [ ] 소셜 로그인 (카카오, 구글)
- [ ] 방 만들기 / 방 찾기
- [ ] 1:1 음성 통화
- [ ] 도토리 포인트 시스템
- [ ] 평가 시스템

## 개발 가이드

### 새로운 페이지 추가
`app/` 폴더에 폴더와 `page.tsx` 파일을 추가합니다.

### API 라우트 추가
`server.js`에서 `/api/*` 경로에 Express 라우트를 추가합니다.

### 번역 추가
`lib/i18n.ts`의 `translations` 객체에 한국어/일본어 텍스트를 추가합니다.

## 라이선스

서로말 프로젝트 - 2025
