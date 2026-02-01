# Fly.io 배포 가이드

## 사전 준비

1. **Fly.io 계정 생성**
   - https://fly.io/app/sign-up 에서 계정 생성

2. **flyctl CLI 설치**
   ```bash
   # macOS
   brew install flyctl

   # 또는 curl로 설치
   curl -L https://fly.io/install.sh | sh
   ```

3. **로그인**
   ```bash
   flyctl auth login
   ```

## 배포 방법

### 1. 처음 배포하는 경우

```bash
# 앱 생성 (fly.toml 이미 있으므로 자동으로 설정 읽음)
flyctl launch --no-deploy

# 앱 이름이 중복되면 fly.toml의 app 이름을 변경하세요
# app = "seoromal-globaltalk-YOUR-NAME"

# 배포
flyctl deploy
```

### 2. 업데이트 배포

```bash
# 코드 변경 후
flyctl deploy
```

### 3. 배포 확인

```bash
# 앱 열기
flyctl open

# 로그 확인
flyctl logs

# 상태 확인
flyctl status
```

## 주요 설정

### fly.toml 설명

- **app**: 앱 이름 (고유해야 함)
- **primary_region**: "nrt" (도쿄 리전 - 한일 사용자에게 가까움)
- **internal_port**: 4000 (server.js의 포트)
- **memory**: 256mb (무료 티어 사용 가능)
- **auto_stop_machines**: 트래픽 없을 때 자동 중지 (비용 절감)
- **min_machines_running**: 0 (완전 무료로 운영 가능)

## 비용

- **무료 플랜**: 256MB RAM, 1 shared CPU
- 트래픽 없을 때 자동 중지되어 비용 발생 안함
- 처음 시작 시 약간의 cold start 있을 수 있음

## 유용한 명령어

```bash
# 앱 재시작
flyctl apps restart seoromal-globaltalk

# 머신 상태 확인
flyctl machine list

# SSH 접속
flyctl ssh console

# 스케일 조정
flyctl scale memory 512  # 메모리 증가

# 앱 삭제
flyctl apps destroy seoromal-globaltalk
```

## 환경변수 설정 (필요시)

```bash
# 환경변수 설정
flyctl secrets set DATABASE_URL=your-database-url
flyctl secrets set SUPABASE_URL=your-supabase-url
flyctl secrets set SUPABASE_ANON_KEY=your-anon-key

# 환경변수 목록 확인
flyctl secrets list
```

## 문제 해결

### 배포 실패 시
```bash
# 로그 확인
flyctl logs

# 빌드 로그 확인
flyctl deploy --verbose
```

### 앱이 시작되지 않을 때
```bash
# 헬스체크 확인
flyctl status

# 머신 재시작
flyctl machine restart
```

## 도메인 연결 (옵션)

```bash
# 커스텀 도메인 추가
flyctl certs add your-domain.com

# SSL 인증서는 자동으로 설정됩니다
```

## 배포 후 URL

앱이 배포되면 다음 URL로 접속 가능합니다:
- https://seoromal-globaltalk.fly.dev

(앱 이름을 변경했다면 해당 이름으로 변경됩니다)
