# 해오름인포텍 업무시스템 - 로컬 배포 가이드

## 빠른 시작 (Quick Start)

### 1. 환경 요구사항
- **Java 11+** (OpenJDK 또는 Oracle JDK)
- **Node.js 18+** 
- **PostgreSQL 12+** (선택사항)
- **운영체제**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### 2. 간단한 배포 방법

```bash
# 1. 프로젝트 다운로드
git clone https://github.com/your-repo/haeoreum-system.git
cd haeoreum-system

# 2. 자동 배포 실행
chmod +x start-local-tomcat.sh
./start-local-tomcat.sh
```

### 3. 접속 확인
- **웹사이트**: http://localhost:8080/haeoreum
- **대시보드**: http://localhost:8080/haeoreum/dashboard
- **API**: http://localhost:3000/api

## 상세 배포 가이드

자세한 단계별 배포 방법은 다음 문서를 참조하세요:
- `단계별_로컬배포_상세가이드.md` - 완전한 10단계 배포 과정
- `로컬_Tomcat_배포가이드.md` - Tomcat 서버 배포 방법

## 파일 구조

```
haeoreum-system/
├── client/                    # 프론트엔드 소스
├── server/                    # 백엔드 API 소스
├── shared/                    # 공통 스키마
├── start-local-tomcat.sh      # 자동 배포 스크립트
├── tomcat-server.js           # Tomcat 스타일 서버
├── ecosystem.config.js        # PM2 설정
├── web.xml                    # 웹앱 설정
└── package.json               # 의존성 관리
```

## 서비스 관리

```bash
# 서비스 상태 확인
pm2 status

# 로그 확인
pm2 logs

# 서비스 재시작
pm2 restart all

# 서비스 중지
pm2 stop all
```

## 문제 해결

### 포트 충돌
```bash
# 포트 사용 확인
netstat -tulpn | grep :8080
netstat -tulpn | grep :3000

# 프로세스 종료
sudo kill -9 $(lsof -t -i:8080)
```

### 권한 문제
```bash
# 실행 권한 부여
chmod +x start-local-tomcat.sh
chmod +x *.sh
```

## 지원 및 문의
- 기술 지원: sunrise050716@company.com
- 설치 문의: 내부 IT 팀

---
**해오름인포텍 업무시스템** - 완전한 로컬 독립 실행 가능