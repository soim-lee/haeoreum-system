# 해오름인포텍 업무시스템 - macOS 설치 가이드

## 빠른 설치 (원클릭)

```bash
# 1. 전체 환경 설치 (처음 설치시)
chmod +x install-macos.sh
./install-macos.sh

# 2. 터미널 재시작 후 시스템 실행
chmod +x start-macos-tomcat.sh
./start-macos-tomcat.sh
```

## 접속 확인

- **웹사이트**: http://localhost:8080/haeoreum
- **관리 대시보드**: http://localhost:8080/haeoreum/dashboard
- **API 서버**: http://localhost:3000/api

## macOS 버전별 지원

### Apple Silicon (M1/M2) Mac
- macOS 11.0 Big Sur 이상
- 8GB RAM 이상 권장
- Homebrew 경로: `/opt/homebrew`

### Intel Mac
- macOS 10.15 Catalina 이상
- 8GB RAM 이상 권장
- Homebrew 경로: `/usr/local`

## 파일 구조

```
macOS 전용 파일:
├── install-macos.sh           # 원클릭 환경 설치
├── start-macos-tomcat.sh      # macOS 서버 시작
├── macos-troubleshoot.sh      # 문제 해결 도구
├── macOS_배포_완전가이드.md    # 상세 설치 가이드
└── README_macOS.md            # 이 파일
```

## 서비스 관리 (macOS 전용)

### Homebrew 서비스
```bash
# 서비스 상태 확인
brew services list

# Tomcat 관리
brew services start tomcat@9
brew services stop tomcat@9
brew services restart tomcat@9

# PostgreSQL 관리
brew services start postgresql@14
brew services stop postgresql@14
```

### PM2 프로세스 관리
```bash
# 프로세스 상태
pm2 status

# 로그 확인
pm2 logs

# 재시작
pm2 restart all
```

## 문제 해결

### 자동 문제 해결
```bash
./macos-troubleshoot.sh
```

### 일반적인 문제

**포트 충돌**
```bash
# 포트 사용 확인
lsof -i :8080
lsof -i :3000

# 프로세스 종료
sudo kill -9 $(lsof -t -i:8080)
```

**권한 문제**
```bash
# Tomcat 권한 수정
sudo chown -R $(whoami):staff /opt/homebrew/var/lib/tomcat@9

# 스크립트 실행 권한
chmod +x *.sh
```

**보안 제한**
```bash
# Gatekeeper 제한 해제
xattr -d com.apple.quarantine *.sh
```

## 개발자 정보

- **회사**: 해오름인포텍
- **시스템**: 업무관리 통합 플랫폼
- **지원**: macOS 10.15+ (Intel/Apple Silicon)
- **기술지원**: sunrise050716

---

상세한 설치 과정은 `macOS_배포_완전가이드.md`를 참조하세요.