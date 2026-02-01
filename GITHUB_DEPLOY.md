# GitHub 자동 배포 설정 가이드

GitHub에 코드를 push하면 자동으로 Fly.io에 배포되도록 설정하는 방법입니다.

## 1. GitHub Repository 생성

1. GitHub에서 새 repository 생성
2. 로컬에서 Git 초기화 및 연결:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/seoromal-globaltalk.git
git push -u origin main
```

## 2. Fly.io API 토큰 생성

이미 생성된 토큰을 복사하세요:

```
fm2_lJPECAAAAAAAEUB9xBAnTygdfnLZcbXOigUt7DXKwrVodHRwczovL2FwaS5mbHkuaW8vdjGUAJLOABY6Sx8Lk7lodHRwczovL2FwaS5mbHkuaW8vYWFhL3YxxDws6HvI1T2cb+D1uZyR195hJO4su1GL3n8d9Xi0eFUtfXGupFpnqsgMt3NzoO0F38JO92oceU2Z5e7RFhfETj/j3iafQvHZGAFN2uxPmghXd6GwnyJ2Wl7C/UAna8EU25EdDaDD6ySu5tt2CwRNdJ365vwK3+Vzr3ovstgrn9cdIkFiPnU4d4l7sMiYUMQg6RqtiAcUw18/8eZsWv4X+WzDJP2dDSntbOKH+XOTyvw=,fm2_lJPETj/j3iafQvHZGAFN2uxPmghXd6GwnyJ2Wl7C/UAna8EU25EdDaDD6ySu5tt2CwRNdJ365vwK3+Vzr3ovstgrn9cdIkFiPnU4d4l7sMiYUMQQCOWgbcX6jQkuOdPpq1Wr/MO5aHR0cHM6Ly9hcGkuZmx5LmlvL2FhYS92MZYEks5pfu+Szml+8ggXzgAVVa4Kkc4AFVWuxCD2F9elc8f7gEJo1/w8rogjDStMSK3GBjyvR7pmkVGYnA==,fo1_8exJSzlP17qo1zvWlFkeiYSZyOhtn2MAJD4T_UgEpVc
```

⚠️ **이 토큰은 절대 GitHub 코드에 포함하지 마세요!**

## 3. GitHub Secrets 설정

1. GitHub repository 페이지로 이동
2. **Settings** > **Secrets and variables** > **Actions** 클릭
3. **New repository secret** 클릭
4. Secret 추가:
   - Name: `FLY_API_TOKEN`
   - Value: 위의 Fly.io 토큰 복사해서 붙여넣기
5. **Add secret** 클릭

## 4. 자동 배포 테스트

이제 main 브랜치에 push하면 자동으로 배포됩니다!

```bash
# 코드 수정 후
git add .
git commit -m "Update landing page"
git push origin main
```

GitHub Actions 탭에서 배포 진행 상황을 확인할 수 있습니다.

## 5. 배포 확인

- **GitHub Actions**: https://github.com/YOUR_USERNAME/seoromal-globaltalk/actions
- **배포된 앱**: https://seoromal-globaltalk-2025.fly.dev/

## 수동 배포 (필요시)

자동 배포 없이 수동으로 배포하려면:

```bash
flyctl deploy
```

## 문제 해결

### GitHub Actions 실패 시

1. GitHub Actions 탭에서 로그 확인
2. `FLY_API_TOKEN` Secret이 올바르게 설정되었는지 확인
3. fly.toml 파일이 repository에 포함되어 있는지 확인

### 토큰이 만료된 경우

```bash
flyctl tokens create deploy
```

새 토큰을 생성하고 GitHub Secrets를 업데이트하세요.

## 배포 흐름

```
코드 수정
    ↓
git push origin main
    ↓
GitHub Actions 실행
    ↓
Fly.io 자동 배포
    ↓
https://seoromal-globaltalk-2025.fly.dev 업데이트 완료!
```

이제 코드를 push하기만 하면 자동으로 배포됩니다! 🚀
