# 로컬 컴퓨터에서 Tomcat 서버로 배포하기

## 1. 로컬 환경 준비

### 필수 소프트웨어 설치

#### Java 11+ 설치
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-11-jdk

# Windows (Chocolatey 사용)
choco install openjdk11

# macOS (Homebrew 사용)
brew install openjdk@11
```

#### Node.js 18+ 설치
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows (Chocolatey 사용)
choco install nodejs

# macOS (Homebrew 사용)
brew install node
```

#### Apache Tomcat 9 설치
```bash
# 다운로드 및 설치
cd /opt
sudo wget https://downloads.apache.org/tomcat/tomcat-9/v9.0.84/bin/apache-tomcat-9.0.84.tar.gz
sudo tar -xzf apache-tomcat-9.0.84.tar.gz
sudo mv apache-tomcat-9.0.84 tomcat
sudo chown -R $USER:$USER /opt/tomcat
```

## 2. Replit 프로젝트 다운로드

### 방법 1: Git Clone (권장)
```bash
# GitHub에서 프로젝트 클론
git clone https://github.com/your-username/haeoreum-system.git
cd haeoreum-system
```

### 방법 2: 압축 파일 다운로드
1. Replit에서 프로젝트를 압축 파일로 다운로드
2. 로컬에 압축 해제
```bash
tar -xzf haeoreum-source.tar.gz
cd haeoreum-source
```

## 3. 프로젝트 빌드

### 의존성 설치 및 빌드
```bash
# 의존성 설치
npm install

# 프로젝트 빌드
npm run build
```

### 빌드 결과 확인
```bash
# dist 디렉토리가 생성되었는지 확인
ls -la dist/
ls -la dist/public/
```

## 4. Tomcat 웹앱 배포

### 웹앱 디렉토리 생성
```bash
# Tomcat webapps 디렉토리에 haeoreum 웹앱 생성
sudo mkdir -p /opt/tomcat/webapps/haeoreum/WEB-INF
```

### 빌드된 파일 복사
```bash
# 프론트엔드 파일 복사
sudo cp -r dist/public/* /opt/tomcat/webapps/haeoreum/

# web.xml 복사
sudo cp web.xml /opt/tomcat/webapps/haeoreum/WEB-INF/

# 권한 설정
sudo chown -R $USER:$USER /opt/tomcat/webapps/haeoreum
```

## 5. 백엔드 API 서버 설정

### 환경 변수 설정
```bash
# .env 파일 생성
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/haeoreum_db
OPENAI_API_KEY=your_openai_api_key_here
TZ=Asia/Seoul
EOF
```

### PM2 설치 및 설정
```bash
# PM2 전역 설치
npm install -g pm2

# ecosystem.config.js 확인/생성
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'haeoreum-api',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF
```

## 6. 데이터베이스 설정 (PostgreSQL)

### PostgreSQL 설치
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# PostgreSQL 공식 사이트에서 설치
```

### 데이터베이스 생성
```bash
# PostgreSQL 접속
sudo -u postgres psql

# 데이터베이스 및 사용자 생성
CREATE DATABASE haeoreum_db;
CREATE USER haeoreum_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE haeoreum_db TO haeoreum_user;
\q
```

### 스키마 적용
```bash
# 데이터베이스 스키마 적용
npm run db:push
```

## 7. 서비스 시작

### Tomcat 시작
```bash
# Tomcat 시작
/opt/tomcat/bin/startup.sh

# 또는 systemd 서비스로 시작 (서비스 등록된 경우)
sudo systemctl start tomcat
```

### 백엔드 API 서버 시작
```bash
# PM2로 백엔드 서버 시작
pm2 start ecosystem.config.js

# 부팅 시 자동 시작 설정
pm2 startup
pm2 save
```

## 8. 서비스 확인

### 웹사이트 접속
- **프론트엔드**: http://localhost:8080/haeoreum
- **백엔드 API**: http://localhost:3000/api

### 상태 확인 명령어
```bash
# Tomcat 상태 확인
curl -I http://localhost:8080/haeoreum

# 백엔드 API 확인
curl http://localhost:3000/api/projects

# PM2 프로세스 확인
pm2 status

# 로그 확인
tail -f /opt/tomcat/logs/catalina.out
pm2 logs haeoreum-api
```

## 9. 자동 배포 스크립트

### deploy-local.sh 스크립트 생성
```bash
#!/bin/bash

# 로컬 Tomcat 자동 배포 스크립트

PROJECT_DIR="/path/to/haeoreum-system"
TOMCAT_WEBAPPS="/opt/tomcat/webapps/haeoreum"

echo "해오름인포텍 시스템 로컬 배포 시작..."

# 1. 프로젝트 디렉토리로 이동
cd $PROJECT_DIR

# 2. 최신 코드 가져오기 (Git 사용 시)
git pull origin main

# 3. 의존성 설치 및 빌드
npm ci
npm run build

# 4. 백엔드 서버 중지
pm2 stop haeoreum-api 2>/dev/null || echo "백엔드 서버가 실행되지 않고 있습니다."

# 5. Tomcat 중지
sudo systemctl stop tomcat 2>/dev/null || /opt/tomcat/bin/shutdown.sh

# 6. 기존 웹앱 백업
if [ -d "$TOMCAT_WEBAPPS" ]; then
    sudo mv $TOMCAT_WEBAPPS ${TOMCAT_WEBAPPS}.backup.$(date +%Y%m%d_%H%M%S)
fi

# 7. 새 웹앱 배포
sudo mkdir -p $TOMCAT_WEBAPPS/WEB-INF
sudo cp -r dist/public/* $TOMCAT_WEBAPPS/
sudo cp web.xml $TOMCAT_WEBAPPS/WEB-INF/
sudo chown -R $USER:$USER $TOMCAT_WEBAPPS

# 8. 서비스 시작
sudo systemctl start tomcat || /opt/tomcat/bin/startup.sh
pm2 start ecosystem.config.js

echo "배포 완료!"
echo "웹사이트: http://localhost:8080/haeoreum"
echo "API: http://localhost:3000/api"
```

### 스크립트 실행 권한 부여
```bash
chmod +x deploy-local.sh
./deploy-local.sh
```

## 10. 문제 해결

### 포트 충돌 해결
```bash
# 포트 사용 확인
netstat -tulpn | grep :8080
netstat -tulpn | grep :3000

# 프로세스 종료
sudo kill -9 $(lsof -t -i:8080)
sudo kill -9 $(lsof -t -i:3000)
```

### 권한 문제 해결
```bash
# Tomcat 디렉토리 권한 설정
sudo chown -R $USER:$USER /opt/tomcat
sudo chmod +x /opt/tomcat/bin/*.sh
```

### 로그 확인
```bash
# Tomcat 로그
tail -f /opt/tomcat/logs/catalina.out

# 백엔드 로그
pm2 logs haeoreum-api

# 시스템 로그
journalctl -u tomcat -f
```

## 핵심 포인트

**완전 독립 실행**: Replit 없이도 로컬 컴퓨터에서 완전히 독립적으로 실행 가능

**이중 서버 구조**:
- Tomcat (포트 8080): 프론트엔드 웹 페이지 서빙
- Node.js (포트 3000): 백엔드 API 서버

**영구 실행**: PM2와 systemd를 통해 서버 재부팅 후에도 자동으로 서비스 시작

**프로덕션 준비**: 실제 운영 환경에서 사용할 수 있는 완전한 설정

이 방법으로 Replit에 의존하지 않고 로컬 컴퓨터에서 완전히 독립적으로 시스템을 운영할 수 있습니다.