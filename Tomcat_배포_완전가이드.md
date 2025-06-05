# 해오름인포텍 업무시스템 Tomcat 배포 완전 가이드

## 목차
1. [배포 개요](#1-배포-개요)
2. [서버 환경 준비](#2-서버-환경-준비)
3. [Tomcat 설치 및 설정](#3-tomcat-설치-및-설정)
4. [프로젝트 빌드 및 배포](#4-프로젝트-빌드-및-배포)
5. [백엔드 API 서버 설정](#5-백엔드-api-서버-설정)
6. [데이터베이스 설정](#6-데이터베이스-설정)
7. [네트워크 및 보안 설정](#7-네트워크-및-보안-설정)
8. [서비스 시작 및 테스트](#8-서비스-시작-및-테스트)
9. [자동화 스크립트](#9-자동화-스크립트)
10. [문제 해결](#10-문제-해결)
11. [운영 및 유지보수](#11-운영-및-유지보수)

---

## 1. 배포 개요

### 1.1 배포 아키텍처
```
클라이언트 (브라우저)
    ↓ HTTP 요청
Tomcat 서버 (포트 8080)
    ├── 정적 파일 (React 빌드)
    └── API 프록시
         ↓
Node.js API 서버 (포트 8080)
    ↓
PostgreSQL 데이터베이스
```

### 1.2 배포 구성 요소
- **웹 서버**: Apache Tomcat 9.0+
- **애플리케이션 서버**: Node.js + Express.js
- **데이터베이스**: PostgreSQL 14+
- **프로세스 관리**: PM2
- **운영체제**: Ubuntu 20.04+ / CentOS 8+

---

## 2. 서버 환경 준비

### 2.1 시스템 요구사항 확인

#### 하드웨어 요구사항
```bash
# 메모리 확인 (최소 4GB, 권장 8GB+)
free -h

# 디스크 공간 확인 (최소 20GB 여유 공간)
df -h

# CPU 확인
nproc
```

#### 운영체제 정보 확인
```bash
# OS 버전 확인
cat /etc/os-release
uname -a

# 현재 사용자 및 권한 확인
whoami
groups $USER
```

### 2.2 시스템 업데이트

#### Ubuntu/Debian 환경
```bash
# 패키지 목록 업데이트
sudo apt update

# 시스템 패키지 업그레이드
sudo apt upgrade -y

# 필수 도구 설치
sudo apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release
```

#### CentOS/RHEL 환경
```bash
# 패키지 목록 업데이트
sudo yum update -y

# 또는 CentOS 8+ / RHEL 8+
sudo dnf update -y

# 필수 도구 설치
sudo yum install -y curl wget epel-release
```

### 2.3 Java 설치

#### OpenJDK 11 설치 (Ubuntu)
```bash
# OpenJDK 11 설치
sudo apt install -y openjdk-11-jdk

# 설치 확인
java -version
javac -version

# JAVA_HOME 경로 확인
sudo update-alternatives --display java
```

#### OpenJDK 11 설치 (CentOS)
```bash
# OpenJDK 11 설치
sudo yum install -y java-11-openjdk java-11-openjdk-devel

# 또는 dnf 사용
sudo dnf install -y java-11-openjdk java-11-openjdk-devel
```

#### Java 환경 변수 설정
```bash
# JAVA_HOME 설정
echo 'export JAVA_HOME="/usr/lib/jvm/java-11-openjdk-amd64"' >> ~/.bashrc
echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# 설정 확인
echo $JAVA_HOME
```

---

## 3. Tomcat 설치 및 설정

### 3.1 Tomcat 사용자 생성
```bash
# tomcat 전용 사용자 생성
sudo useradd -m -U -d /opt/tomcat -s /bin/false tomcat

# 사용자 확인
id tomcat
```

### 3.2 Tomcat 다운로드 및 설치

#### 최신 버전 확인 및 다운로드
```bash
# 임시 디렉토리로 이동
cd /tmp

# Tomcat 최신 버전 다운로드 (버전은 최신으로 확인 후 변경)
TOMCAT_VERSION="9.0.84"
sudo wget https://downloads.apache.org/tomcat/tomcat-9/v${TOMCAT_VERSION}/bin/apache-tomcat-${TOMCAT_VERSION}.tar.gz

# 다운로드 확인
ls -la apache-tomcat-*.tar.gz
```

#### 압축 해제 및 설치
```bash
# 압축 해제
sudo tar -xzf apache-tomcat-${TOMCAT_VERSION}.tar.gz

# Tomcat 홈 디렉토리 생성 및 파일 이동
sudo mkdir -p /opt/tomcat
sudo mv apache-tomcat-${TOMCAT_VERSION}/* /opt/tomcat/

# 심볼릭 링크 생성 (버전 관리 용이)
sudo ln -sfn /opt/tomcat /opt/tomcat/latest

# 권한 설정
sudo chown -R tomcat:tomcat /opt/tomcat
sudo chmod +x /opt/tomcat/bin/*.sh
```

### 3.3 Tomcat 환경 설정

#### setenv.sh 파일 생성
```bash
# Tomcat 환경 설정 파일 생성
sudo nano /opt/tomcat/bin/setenv.sh
```

다음 내용을 입력:
```bash
#!/bin/bash

# Java 환경 설정
export JAVA_HOME="/usr/lib/jvm/java-11-openjdk-amd64"
export JRE_HOME="$JAVA_HOME"

# Tomcat 환경 설정
export CATALINA_HOME="/opt/tomcat"
export CATALINA_BASE="/opt/tomcat"
export CATALINA_PID="/opt/tomcat/temp/tomcat.pid"

# JVM 메모리 설정
export CATALINA_OPTS="-Xms1024m -Xmx4096m -server"
export CATALINA_OPTS="$CATALINA_OPTS -XX:+UseG1GC"
export CATALINA_OPTS="$CATALINA_OPTS -XX:+UseStringDeduplication"
export CATALINA_OPTS="$CATALINA_OPTS -Djava.awt.headless=true"
export CATALINA_OPTS="$CATALINA_OPTS -Dfile.encoding=UTF-8"
export CATALINA_OPTS="$CATALINA_OPTS -Duser.timezone=Asia/Seoul"

# 성능 최적화 옵션
export JAVA_OPTS="-Djava.awt.headless=true"
export JAVA_OPTS="$JAVA_OPTS -Dfile.encoding=UTF-8"
export JAVA_OPTS="$JAVA_OPTS -Dnet.sf.ehcache.skipUpdateCheck=true"
export JAVA_OPTS="$JAVA_OPTS -server"
```

권한 설정:
```bash
sudo chmod +x /opt/tomcat/bin/setenv.sh
```

#### server.xml 설정 수정
```bash
# 백업 생성
sudo cp /opt/tomcat/conf/server.xml /opt/tomcat/conf/server.xml.backup

# server.xml 편집
sudo nano /opt/tomcat/conf/server.xml
```

다음 설정을 찾아 수정:
```xml
<!-- HTTP 커넥터 설정 -->
<Connector port="8080" protocol="HTTP/1.1"
           connectionTimeout="20000"
           redirectPort="8443"
           maxThreads="200"
           minSpareThreads="10"
           enableLookups="false"
           acceptCount="100"
           debug="0"
           URIEncoding="UTF-8"
           compression="on"
           compressionMinSize="2048"
           compressableMimeType="text/html,text/xml,text/plain,text/css,text/javascript,application/javascript,application/json" />
```

### 3.4 Tomcat 시스템 서비스 등록

#### systemd 서비스 파일 생성
```bash
sudo nano /etc/systemd/system/tomcat.service
```

다음 내용을 입력:
```ini
[Unit]
Description=Apache Tomcat Web Application Container
Documentation=https://tomcat.apache.org/
After=network.target

[Service]
Type=forking

Environment="JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64"
Environment="CATALINA_PID=/opt/tomcat/temp/tomcat.pid"
Environment="CATALINA_HOME=/opt/tomcat"
Environment="CATALINA_BASE=/opt/tomcat"
Environment="CATALINA_OPTS=-Xms1024m -Xmx4096m -server -XX:+UseG1GC"
Environment="JAVA_OPTS=-Djava.awt.headless=true -Dfile.encoding=UTF-8 -Duser.timezone=Asia/Seoul"

ExecStart=/opt/tomcat/bin/startup.sh
ExecStop=/opt/tomcat/bin/shutdown.sh
ExecReload=/bin/kill -s HUP $MAINPID

User=tomcat
Group=tomcat
UMask=0007
RestartSec=10
Restart=always

# 보안 설정
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/tomcat/

[Install]
WantedBy=multi-user.target
```

#### 서비스 활성화
```bash
# systemd 데몬 재로드
sudo systemctl daemon-reload

# Tomcat 서비스 활성화 (부팅 시 자동 시작)
sudo systemctl enable tomcat

# Tomcat 서비스 시작
sudo systemctl start tomcat

# 서비스 상태 확인
sudo systemctl status tomcat

# 로그 확인
sudo journalctl -u tomcat -f
```

---

## 4. 프로젝트 빌드 및 배포

### 4.1 Node.js 설치

#### Node.js 18+ 설치 (Ubuntu)
```bash
# NodeSource 리포지토리 추가
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js 설치
sudo apt-get install -y nodejs

# 설치 확인
node --version
npm --version
```

#### Node.js 18+ 설치 (CentOS)
```bash
# NodeSource 리포지토리 추가
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# Node.js 설치
sudo yum install -y nodejs

# 또는 dnf 사용
sudo dnf install -y nodejs
```

### 4.2 프로젝트 소스 준비

#### 프로젝트 디렉토리 생성
```bash
# 프로젝트 디렉토리 생성
sudo mkdir -p /var/www/haeoreum
sudo chown -R $USER:$USER /var/www/haeoreum
cd /var/www/haeoreum
```

#### 소스 코드 배포 방법

**방법 1: Git 저장소에서 클론**
```bash
# Git 설치 (필요한 경우)
sudo apt install -y git

# 저장소 클론
git clone <your-repository-url> .

# 또는 특정 브랜치
git clone -b main <your-repository-url> .
```

**방법 2: 파일 직접 업로드 (scp 사용)**
```bash
# 로컬 머신에서 서버로 파일 복사
scp -r /path/to/local/project/* username@server-ip:/var/www/haeoreum/

# 또는 rsync 사용 (더 효율적)
rsync -avz --progress /path/to/local/project/ username@server-ip:/var/www/haeoreum/
```

**방법 3: 압축 파일 업로드**
```bash
# 로컬에서 압축
tar -czf haeoreum-project.tar.gz /path/to/project/

# 서버에 업로드
scp haeoreum-project.tar.gz username@server-ip:/tmp/

# 서버에서 압축 해제
cd /var/www/haeoreum
sudo tar -xzf /tmp/haeoreum-project.tar.gz --strip-components=1
```

### 4.3 프로젝트 의존성 설치 및 빌드

#### 의존성 설치
```bash
cd /var/www/haeoreum

# package.json 확인
cat package.json

# npm 캐시 정리 (선택사항)
npm cache clean --force

# 의존성 설치
npm install

# 설치 확인
npm list --depth=0
```

#### 환경 설정 파일 생성
```bash
# 환경 변수 파일 생성
nano .env
```

다음 내용을 입력:
```bash
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://haeoreum_user:your_password@localhost:5432/haeoreum_db
OPENAI_API_KEY=your_openai_api_key_here
```

#### 프로덕션 빌드
```bash
# TypeScript 컴파일 확인
npm run check

# 프로덕션 빌드 실행
npm run build

# 빌드 결과 확인
ls -la dist/
ls -la dist/public/
```

### 4.4 웹 애플리케이션 배포

#### Tomcat 웹앱 디렉토리 생성
```bash
# 웹앱 디렉토리 생성
sudo mkdir -p /opt/tomcat/webapps/haeoreum
sudo mkdir -p /opt/tomcat/webapps/haeoreum/WEB-INF

# 기존 ROOT 웹앱 백업 (선택사항)
sudo mv /opt/tomcat/webapps/ROOT /opt/tomcat/webapps/ROOT.backup
```

#### 빌드된 파일 복사
```bash
# React 빌드 파일을 Tomcat 웹앱 디렉토리로 복사
sudo cp -r /var/www/haeoreum/dist/public/* /opt/tomcat/webapps/haeoreum/

# web.xml 파일 복사
sudo cp /var/www/haeoreum/web.xml /opt/tomcat/webapps/haeoreum/WEB-INF/

# 복사 확인
sudo ls -la /opt/tomcat/webapps/haeoreum/
sudo ls -la /opt/tomcat/webapps/haeoreum/WEB-INF/
```

#### 권한 설정
```bash
# Tomcat 사용자 권한 설정
sudo chown -R tomcat:tomcat /opt/tomcat/webapps/haeoreum

# 적절한 파일 권한 설정
sudo find /opt/tomcat/webapps/haeoreum -type f -exec chmod 644 {} \;
sudo find /opt/tomcat/webapps/haeoreum -type d -exec chmod 755 {} \;
```

---

## 5. 백엔드 API 서버 설정

### 5.1 PM2 설치 및 설정

#### PM2 설치
```bash
# PM2 전역 설치
sudo npm install -g pm2

# 설치 확인
pm2 --version
which pm2
```

#### PM2 설정 파일 확인 및 수정
```bash
cd /var/www/haeoreum

# ecosystem.config.js 파일 확인
cat ecosystem.config.js
```

설정 파일이 없으면 생성:
```bash
nano ecosystem.config.js
```

다음 내용을 입력:
```javascript
module.exports = {
  apps: [{
    name: 'haeoreum-api',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    env_file: '.env',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

#### PM2 로그 디렉토리 생성
```bash
# 로그 디렉토리 생성
mkdir -p /var/www/haeoreum/logs

# 권한 설정
chmod 755 /var/www/haeoreum/logs
```

### 5.2 백엔드 서버 시작

#### PM2로 애플리케이션 시작
```bash
cd /var/www/haeoreum

# 환경 변수 로드
export $(grep -v '^#' .env | xargs)

# PM2로 애플리케이션 시작
pm2 start ecosystem.config.js

# 상태 확인
pm2 status
pm2 list
```

#### PM2 자동 시작 설정
```bash
# PM2 시스템 부팅 시 자동 시작 설정
pm2 startup

# 위 명령어 실행 후 출력되는 명령어를 복사해서 실행
# 예: sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# 현재 PM2 프로세스 목록 저장
pm2 save
```

#### PM2 모니터링
```bash
# 실시간 모니터링
pm2 monit

# 로그 확인
pm2 logs haeoreum-api

# 특정 라인 수만큼 로그 확인
pm2 logs haeoreum-api --lines 100

# 실시간 로그 스트리밍
pm2 logs haeoreum-api --lines 0
```

---

## 6. 데이터베이스 설정

### 6.1 PostgreSQL 설치

#### Ubuntu에서 PostgreSQL 설치
```bash
# PostgreSQL 설치
sudo apt install -y postgresql postgresql-contrib

# 설치 확인
postgres --version
psql --version
```

#### CentOS에서 PostgreSQL 설치
```bash
# PostgreSQL 설치
sudo yum install -y postgresql postgresql-server postgresql-contrib

# 또는 dnf 사용
sudo dnf install -y postgresql postgresql-server postgresql-contrib

# 데이터베이스 초기화 (CentOS만)
sudo postgresql-setup initdb
```

### 6.2 PostgreSQL 서비스 설정

#### 서비스 시작 및 활성화
```bash
# PostgreSQL 서비스 시작
sudo systemctl start postgresql

# 부팅 시 자동 시작 설정
sudo systemctl enable postgresql

# 서비스 상태 확인
sudo systemctl status postgresql
```

### 6.3 데이터베이스 및 사용자 생성

#### PostgreSQL 관리자로 접속
```bash
# postgres 사용자로 전환
sudo -i -u postgres

# PostgreSQL 콘솔 접속
psql
```

#### 데이터베이스 및 사용자 생성
```sql
-- 데이터베이스 생성
CREATE DATABASE haeoreum_db;

-- 사용자 생성
CREATE USER haeoreum_user WITH PASSWORD 'your_secure_password_here';

-- 사용자에게 데이터베이스 권한 부여
GRANT ALL PRIVILEGES ON DATABASE haeoreum_db TO haeoreum_user;

-- 스키마 권한 부여
\c haeoreum_db
GRANT ALL ON SCHEMA public TO haeoreum_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO haeoreum_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO haeoreum_user;

-- 기본 권한 설정
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO haeoreum_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO haeoreum_user;

-- 설정 확인
\l
\du

-- 종료
\q
exit
```

### 6.4 PostgreSQL 보안 설정

#### pg_hba.conf 설정
```bash
# 설정 파일 위치 확인
sudo -u postgres psql -c "SHOW hba_file;"

# 설정 파일 편집
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

다음 라인을 찾아 수정:
```
# 로컬 연결 설정
local   all             postgres                                peer
local   all             all                                     md5

# IPv4 로컬 연결
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

#### postgresql.conf 설정
```bash
# 설정 파일 편집
sudo nano /etc/postgresql/14/main/postgresql.conf
```

다음 설정 확인/수정:
```
# 연결 설정
listen_addresses = 'localhost'
port = 5432

# 메모리 설정
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 4MB

# 로그 설정
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'error'
log_min_error_statement = error
```

#### PostgreSQL 재시작
```bash
# PostgreSQL 재시작
sudo systemctl restart postgresql

# 상태 확인
sudo systemctl status postgresql
```

### 6.5 데이터베이스 스키마 적용

#### 환경 변수 설정 확인
```bash
cd /var/www/haeoreum

# .env 파일 확인
cat .env

# 환경 변수 로드
export $(grep -v '^#' .env | xargs)

# 데이터베이스 연결 테스트
psql $DATABASE_URL -c "SELECT version();"
```

#### Drizzle 스키마 적용
```bash
# 스키마 파일 확인
cat shared/schema.ts

# 데이터베이스 스키마 푸시
npm run db:push

# 스키마 적용 확인
psql $DATABASE_URL -c "\dt"
```

---

## 7. 네트워크 및 보안 설정

### 7.1 방화벽 설정

#### UFW 방화벽 설정 (Ubuntu)
```bash
# UFW 상태 확인
sudo ufw status

# UFW 활성화
sudo ufw enable

# 기본 정책 설정
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 필요한 포트 열기
sudo ufw allow ssh                    # SSH (22)
sudo ufw allow 8080/tcp              # Tomcat
sudo ufw allow 80/tcp                # HTTP
sudo ufw allow 443/tcp               # HTTPS

# 특정 IP에서만 접근 허용 (선택사항)
# sudo ufw allow from 192.168.1.0/24 to any port 8080

# 설정 확인
sudo ufw status numbered
```

#### firewalld 설정 (CentOS)
```bash
# firewalld 상태 확인
sudo systemctl status firewalld

# firewalld 시작 및 활성화
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 포트 열기
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp

# 설정 리로드
sudo firewall-cmd --reload

# 설정 확인
sudo firewall-cmd --list-all
```

### 7.2 시스템 보안 강화

#### 시스템 업데이트 자동화
```bash
# unattended-upgrades 설치 (Ubuntu)
sudo apt install -y unattended-upgrades

# 자동 업데이트 설정
sudo dpkg-reconfigure -plow unattended-upgrades
```

#### SSH 보안 설정
```bash
# SSH 설정 파일 백업
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# SSH 설정 편집
sudo nano /etc/ssh/sshd_config
```

다음 설정 적용:
```
# 기본 보안 설정
Port 22
PermitRootLogin no
PasswordAuthentication yes
PubkeyAuthentication yes
PermitEmptyPasswords no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
```

SSH 서비스 재시작:
```bash
sudo systemctl restart sshd
```

### 7.3 로그 모니터링 설정

#### Fail2ban 설치 및 설정
```bash
# Fail2ban 설치
sudo apt install -y fail2ban

# 설정 파일 생성
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# SSH 보호 설정
sudo nano /etc/fail2ban/jail.local
```

다음 설정 추가:
```ini
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
```

Fail2ban 시작:
```bash
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
sudo systemctl status fail2ban
```

---

## 8. 서비스 시작 및 테스트

### 8.1 모든 서비스 시작 순서

#### 1단계: 데이터베이스 서비스 확인
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# 필요시 재시작
sudo systemctl restart postgresql

# 연결 테스트
psql -h localhost -U haeoreum_user -d haeoreum_db -c "SELECT 1;"
```

#### 2단계: 백엔드 API 서버 시작
```bash
cd /var/www/haeoreum

# PM2 상태 확인
pm2 status

# 필요시 재시작
pm2 restart haeoreum-api

# 로그 확인
pm2 logs haeoreum-api --lines 20
```

#### 3단계: Tomcat 웹 서버 시작
```bash
# Tomcat 상태 확인
sudo systemctl status tomcat

# 필요시 재시작
sudo systemctl restart tomcat

# 로그 확인
sudo tail -f /opt/tomcat/logs/catalina.out
```

### 8.2 서비스 연결 테스트

#### 포트 및 프로세스 확인
```bash
# 포트 사용 현황 확인
sudo netstat -tulpn | grep :8080
sudo netstat -tulpn | grep :5432

# 프로세스 확인
sudo lsof -i :8080
ps aux | grep tomcat
ps aux | grep node
```

#### API 서버 테스트
```bash
# 로컬 API 테스트
curl -i http://localhost:8080/api/health

# JSON 응답 확인
curl -s http://localhost:8080/api/health | python3 -m json.tool
```

#### 웹 애플리케이션 테스트
```bash
# 웹 사이트 접근 테스트
curl -I http://localhost:8080/haeoreum

# HTML 응답 확인
curl -s http://localhost:8080/haeoreum | head -20
```

### 8.3 외부 접근 테스트

#### 서버 IP 확인
```bash
# 공인 IP 확인
curl -4 ifconfig.co

# 또는
wget -qO- http://ipecho.net/plain
```

#### 브라우저 테스트
```
# 웹 브라우저에서 접속
http://your-server-ip:8080/haeoreum
```

---

## 9. 자동화 스크립트

### 9.1 완전 자동 배포 스크립트

#### deploy-complete.sh 생성
```bash
nano /var/www/haeoreum/deploy-complete.sh
```

다음 내용을 입력:
```bash
#!/bin/bash

# 해오름인포텍 업무시스템 완전 자동 배포 스크립트
# 사용법: ./deploy-complete.sh

set -e  # 오류 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 설정 변수
PROJECT_DIR="/var/www/haeoreum"
TOMCAT_HOME="/opt/tomcat"
APP_NAME="haeoreum"
BACKUP_DIR="/backup/$(date +%Y%m%d_%H%M%S)"

log_info "해오름인포텍 업무시스템 배포 시작..."

# 0. 백업 생성
log_info "기존 배포 백업 생성 중..."
sudo mkdir -p $BACKUP_DIR
if [ -d "$TOMCAT_HOME/webapps/$APP_NAME" ]; then
    sudo cp -r $TOMCAT_HOME/webapps/$APP_NAME $BACKUP_DIR/
    log_success "기존 배포 백업 완료: $BACKUP_DIR"
fi

# 1. 서비스 중지
log_info "서비스 중지 중..."
pm2 stop haeoreum-api || log_warning "PM2 서비스 중지 실패 (정상적일 수 있음)"
sudo systemctl stop tomcat || log_error "Tomcat 중지 실패"

# 2. 소스 코드 업데이트
log_info "소스 코드 업데이트 중..."
cd $PROJECT_DIR
if [ -d ".git" ]; then
    git pull origin main || log_warning "Git pull 실패"
else
    log_warning "Git 저장소가 아닙니다. 수동으로 코드를 업데이트하세요."
fi

# 3. 의존성 설치
log_info "의존성 설치 중..."
npm ci --production=false

# 4. 프로젝트 빌드
log_info "프로젝트 빌드 중..."
npm run build || {
    log_error "빌드 실패"
    exit 1
}

# 5. 웹앱 배포
log_info "웹 애플리케이션 배포 중..."
sudo rm -rf $TOMCAT_HOME/webapps/$APP_NAME
sudo mkdir -p $TOMCAT_HOME/webapps/$APP_NAME/WEB-INF
sudo cp -r dist/public/* $TOMCAT_HOME/webapps/$APP_NAME/
sudo cp web.xml $TOMCAT_HOME/webapps/$APP_NAME/WEB-INF/
sudo chown -R tomcat:tomcat $TOMCAT_HOME/webapps/$APP_NAME

# 6. 데이터베이스 스키마 업데이트
log_info "데이터베이스 스키마 업데이트 중..."
export $(grep -v '^#' .env | xargs)
npm run db:push || log_warning "데이터베이스 스키마 업데이트 실패"

# 7. 서비스 시작
log_info "서비스 시작 중..."
sudo systemctl start tomcat
sleep 5

pm2 restart haeoreum-api || pm2 start ecosystem.config.js

# 8. 서비스 확인
log_info "서비스 상태 확인 중..."
sleep 10

# Tomcat 확인
if sudo systemctl is-active --quiet tomcat; then
    log_success "Tomcat 서비스 정상 실행 중"
else
    log_error "Tomcat 서비스 실행 실패"
fi

# PM2 확인
if pm2 list | grep -q "haeoreum-api.*online"; then
    log_success "백엔드 API 서버 정상 실행 중"
else
    log_error "백엔드 API 서버 실행 실패"
fi

# 웹사이트 접근 테스트
if curl -f -s http://localhost:8080/$APP_NAME >/dev/null; then
    log_success "웹사이트 접근 가능"
else
    log_error "웹사이트 접근 실패"
fi

# API 서버 테스트
if curl -f -s http://localhost:8080/api/health >/dev/null; then
    log_success "API 서버 접근 가능"
else
    log_warning "API 서버 접근 실패"
fi

log_success "배포 완료!"
echo ""
echo "========================================"
echo "배포 정보:"
echo "- 웹사이트: http://$(curl -s ifconfig.co):8080/$APP_NAME"
echo "- API 서버: http://$(curl -s ifconfig.co):8080/api"
echo "- 백업 위치: $BACKUP_DIR"
echo "========================================"
echo ""
echo "로그 확인 명령어:"
echo "- Tomcat: sudo tail -f $TOMCAT_HOME/logs/catalina.out"
echo "- API: pm2 logs haeoreum-api"
echo "- 시스템: sudo journalctl -u tomcat -f"
```

실행 권한 부여:
```bash
chmod +x /var/www/haeoreum/deploy-complete.sh
```

### 9.2 모니터링 스크립트

#### health-monitor.sh 생성
```bash
nano /var/www/haeoreum/health-monitor.sh
```

다음 내용을 입력:
```bash
#!/bin/bash

# 시스템 상태 모니터링 스크립트

# 설정
APP_NAME="haeoreum"
API_URL="http://localhost:8080/api/health"
WEB_URL="http://localhost:8080/$APP_NAME"
EMAIL="admin@company.com"  # 알림 받을 이메일 주소

# 로그 파일
LOG_FILE="/var/log/haeoreum-monitor.log"

# 로그 함수
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | sudo tee -a $LOG_FILE
}

# 알림 함수
send_alert() {
    local message="$1"
    log_message "ALERT: $message"
    
    # 이메일 알림 (postfix/sendmail 설정 필요)
    if command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "해오름 시스템 알림" $EMAIL
    fi
    
    # Slack 알림 (Webhook URL 설정 필요)
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"$message\"}" \
    #     YOUR_SLACK_WEBHOOK_URL
}

# 서비스 상태 확인
check_service() {
    local service_name="$1"
    if sudo systemctl is-active --quiet $service_name; then
        log_message "$service_name 서비스 정상"
        return 0
    else
        send_alert "$service_name 서비스가 중지되었습니다!"
        return 1
    fi
}

# HTTP 상태 확인
check_http() {
    local url="$1"
    local name="$2"
    local response=$(curl -s -o /dev/null -w "%{http_code}" $url)
    
    if [ "$response" = "200" ]; then
        log_message "$name HTTP 상태 정상 (200)"
        return 0
    else
        send_alert "$name HTTP 응답 오류 ($response)"
        return 1
    fi
}

# 디스크 사용량 확인
check_disk_usage() {
    local usage=$(df / | grep -vE '^Filesystem|tmpfs|cdrom' | awk '{print $5}' | sed 's/%//g')
    local threshold=80
    
    if [ $usage -gt $threshold ]; then
        send_alert "디스크 사용량이 ${usage}%입니다 (임계값: ${threshold}%)"
    else
        log_message "디스크 사용량 정상 (${usage}%)"
    fi
}

# 메모리 사용량 확인
check_memory_usage() {
    local usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    local threshold=85
    
    if [ $usage -gt $threshold ]; then
        send_alert "메모리 사용량이 ${usage}%입니다 (임계값: ${threshold}%)"
    else
        log_message "메모리 사용량 정상 (${usage}%)"
    fi
}

# PM2 프로세스 확인
check_pm2() {
    if pm2 list | grep -q "haeoreum-api.*online"; then
        log_message "PM2 백엔드 프로세스 정상"
        return 0
    else
        send_alert "PM2 백엔드 프로세스가 중지되었습니다!"
        # 자동 복구 시도
        pm2 restart haeoreum-api
        return 1
    fi
}

# 데이터베이스 연결 확인
check_database() {
    if pg_isready -h localhost -U haeoreum_user >/dev/null 2>&1; then
        log_message "데이터베이스 연결 정상"
        return 0
    else
        send_alert "데이터베이스 연결 실패!"
        return 1
    fi
}

# 메인 모니터링 실행
main() {
    log_message "=== 시스템 상태 점검 시작 ==="
    
    # 서비스 상태 확인
    check_service "tomcat"
    check_service "postgresql"
    
    # HTTP 상태 확인
    check_http "$WEB_URL" "웹사이트"
    check_http "$API_URL" "API서버"
    
    # 시스템 리소스 확인
    check_disk_usage
    check_memory_usage
    
    # 애플리케이션 상태 확인
    check_pm2
    check_database
    
    log_message "=== 시스템 상태 점검 완료 ==="
}

# 스크립트 실행
main
```

실행 권한 부여:
```bash
chmod +x /var/www/haeoreum/health-monitor.sh
```

#### Cron 작업 등록
```bash
# crontab 편집
crontab -e

# 다음 라인 추가 (5분마다 모니터링 실행)
*/5 * * * * /var/www/haeoreum/health-monitor.sh

# 매일 새벽 2시에 전체 배포 (선택사항)
# 0 2 * * * /var/www/haeoreum/deploy-complete.sh
```

---

## 10. 문제 해결

### 10.1 일반적인 문제들

#### 10.1.1 Tomcat이 시작되지 않는 경우

**증상**: `systemctl start tomcat` 실행 시 실패

**진단 방법**:
```bash
# 서비스 상태 확인
sudo systemctl status tomcat

# 상세 로그 확인
sudo journalctl -u tomcat -n 50

# Tomcat 로그 확인
sudo tail -f /opt/tomcat/logs/catalina.out
```

**일반적인 해결방법**:

1. **Java 경로 문제**:
```bash
# JAVA_HOME 확인
echo $JAVA_HOME
java -version

# setenv.sh에서 Java 경로 수정
sudo nano /opt/tomcat/bin/setenv.sh
```

2. **포트 충돌**:
```bash
# 8080 포트 사용 프로세스 확인
sudo lsof -i :8080

# 프로세스 종료
sudo kill -9 <PID>
```

3. **권한 문제**:
```bash
# Tomcat 디렉토리 권한 확인
ls -la /opt/tomcat/

# 권한 수정
sudo chown -R tomcat:tomcat /opt/tomcat
sudo chmod +x /opt/tomcat/bin/*.sh
```

#### 10.1.2 웹 애플리케이션 404 오류

**증상**: 브라우저에서 404 Not Found 오류

**진단 방법**:
```bash
# 웹앱 파일 존재 확인
ls -la /opt/tomcat/webapps/haeoreum/

# web.xml 파일 확인
cat /opt/tomcat/webapps/haeoreum/WEB-INF/web.xml

# Tomcat 배포 로그 확인
sudo tail -f /opt/tomcat/logs/localhost.*.log
```

**해결방법**:

1. **파일 복사 재실행**:
```bash
# 기존 웹앱 삭제
sudo rm -rf /opt/tomcat/webapps/haeoreum

# 다시 배포
sudo mkdir -p /opt/tomcat/webapps/haeoreum/WEB-INF
sudo cp -r /var/www/haeoreum/dist/public/* /opt/tomcat/webapps/haeoreum/
sudo cp /var/www/haeoreum/web.xml /opt/tomcat/webapps/haeoreum/WEB-INF/
sudo chown -R tomcat:tomcat /opt/tomcat/webapps/haeoreum
```

2. **SPA 라우팅 문제**:
web.xml에 다음 설정이 있는지 확인:
```xml
<error-page>
    <error-code>404</error-code>
    <location>/index.html</location>
</error-page>
```

#### 10.1.3 백엔드 API 연결 오류

**증상**: API 호출 시 500 오류 또는 연결 실패

**진단 방법**:
```bash
# PM2 상태 확인
pm2 status

# API 서버 로그 확인
pm2 logs haeoreum-api

# 포트 확인
sudo netstat -tulpn | grep :8080
```

**해결방법**:

1. **환경 변수 문제**:
```bash
# .env 파일 확인
cat /var/www/haeoreum/.env

# 환경 변수 로드 테스트
cd /var/www/haeoreum
export $(grep -v '^#' .env | xargs)
echo $DATABASE_URL
```

2. **데이터베이스 연결 문제**:
```bash
# 데이터베이스 연결 테스트
psql $DATABASE_URL -c "SELECT 1;"

# PostgreSQL 상태 확인
sudo systemctl status postgresql
```

3. **PM2 재시작**:
```bash
# PM2 프로세스 재시작
pm2 restart haeoreum-api

# 또는 완전 재시작
pm2 delete haeoreum-api
pm2 start ecosystem.config.js
```

#### 10.1.4 데이터베이스 연결 오류

**증상**: 데이터베이스 연결 실패 오류

**진단 방법**:
```bash
# PostgreSQL 서비스 상태
sudo systemctl status postgresql

# 연결 테스트
psql -h localhost -U haeoreum_user -d haeoreum_db

# PostgreSQL 로그 확인
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

**해결방법**:

1. **서비스 재시작**:
```bash
sudo systemctl restart postgresql
```

2. **인증 설정 확인**:
```bash
# pg_hba.conf 확인
sudo cat /etc/postgresql/14/main/pg_hba.conf | grep -v "^#"

# 필요시 md5 인증으로 변경
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

3. **사용자 권한 확인**:
```sql
-- PostgreSQL 콘솔에서
\c haeoreum_db
\du haeoreum_user
```

### 10.2 성능 문제 해결

#### 10.2.1 메모리 부족 문제

**증상**: 시스템이 느려지거나 서비스가 자주 중단됨

**진단**:
```bash
# 메모리 사용량 확인
free -h
top -o %MEM

# 스왑 사용량 확인
swapon --show
```

**해결방법**:

1. **스왑 파일 생성**:
```bash
# 2GB 스왑 파일 생성
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 영구 설정
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

2. **JVM 메모리 조정**:
```bash
# setenv.sh에서 메모리 설정 조정
sudo nano /opt/tomcat/bin/setenv.sh

# 메모리 설정 예시 (사용 가능한 메모리에 따라 조정)
export CATALINA_OPTS="-Xms512m -Xmx2048m -server"
```

#### 10.2.2 디스크 공간 부족

**증상**: 디스크 사용률 90% 이상

**진단**:
```bash
# 디스크 사용량 확인
df -h

# 큰 파일 찾기
du -sh /* | sort -hr
find /var/log -name "*.log" -type f -size +100M
```

**해결방법**:

1. **로그 파일 정리**:
```bash
# 오래된 로그 파일 삭제
sudo find /var/log -name "*.log" -type f -mtime +30 -delete
sudo find /opt/tomcat/logs -name "*.log" -type f -mtime +7 -delete

# PM2 로그 정리
pm2 flush
```

2. **로그 로테이션 설정**:
```bash
# logrotate 설정
sudo nano /etc/logrotate.d/haeoreum

# 내용:
/var/www/haeoreum/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    postrotate
        pm2 reload haeoreum-api
    endscript
}
```

---

## 11. 운영 및 유지보수

### 11.1 정기 백업

#### 11.1.1 데이터베이스 백업 스크립트

```bash
# 백업 스크립트 생성
nano /var/www/haeoreum/backup-database.sh
```

다음 내용을 입력:
```bash
#!/bin/bash

# 데이터베이스 백업 스크립트

# 설정
BACKUP_DIR="/backup/database"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="haeoreum_db"
DB_USER="haeoreum_user"
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_$DATE.sql"

# 백업 디렉토리 생성
mkdir -p $BACKUP_DIR

# 데이터베이스 백업 실행
echo "데이터베이스 백업 시작: $(date)"
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# 백업 파일 압축
gzip $BACKUP_FILE

echo "백업 완료: ${BACKUP_FILE}.gz"

# 오래된 백업 파일 삭제
find $BACKUP_DIR -name "${DB_NAME}_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "오래된 백업 파일 정리 완료"
echo "백업 완료: $(date)"
```

실행 권한 부여:
```bash
chmod +x /var/www/haeoreum/backup-database.sh
```

#### 11.1.2 전체 시스템 백업 스크립트

```bash
# 전체 백업 스크립트 생성
nano /var/www/haeoreum/backup-full.sh
```

다음 내용을 입력:
```bash
#!/bin/bash

# 전체 시스템 백업 스크립트

# 설정
BACKUP_BASE="/backup/full"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE/backup_$DATE"

# 백업 디렉토리 생성
mkdir -p $BACKUP_DIR

echo "전체 시스템 백업 시작: $(date)"

# 1. 애플리케이션 소스 백업
echo "애플리케이션 소스 백업 중..."
tar -czf $BACKUP_DIR/application_source.tar.gz \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='logs' \
    /var/www/haeoreum

# 2. Tomcat 웹앱 백업
echo "Tomcat 웹앱 백업 중..."
tar -czf $BACKUP_DIR/tomcat_webapp.tar.gz /opt/tomcat/webapps/haeoreum

# 3. 설정 파일 백업
echo "설정 파일 백업 중..."
mkdir -p $BACKUP_DIR/configs
cp /var/www/haeoreum/.env $BACKUP_DIR/configs/
cp /var/www/haeoreum/ecosystem.config.js $BACKUP_DIR/configs/
cp /opt/tomcat/bin/setenv.sh $BACKUP_DIR/configs/
cp /etc/systemd/system/tomcat.service $BACKUP_DIR/configs/

# 4. 데이터베이스 백업
echo "데이터베이스 백업 중..."
pg_dump -h localhost -U haeoreum_user -d haeoreum_db | gzip > $BACKUP_DIR/database_backup.sql.gz

# 5. PM2 설정 백업
echo "PM2 설정 백업 중..."
pm2 save
cp ~/.pm2/dump.pm2 $BACKUP_DIR/configs/ 2>/dev/null || true

# 백업 정보 파일 생성
cat > $BACKUP_DIR/backup_info.txt << EOF
백업 생성 시간: $(date)
서버 정보: $(hostname) ($(uname -a))
애플리케이션 버전: $(cd /var/www/haeoreum && git rev-parse HEAD 2>/dev/null || echo "Git 정보 없음")
백업 내용:
- 애플리케이션 소스 코드
- Tomcat 웹 애플리케이션
- 시스템 설정 파일
- 데이터베이스 전체
- PM2 프로세스 설정
EOF

# 오래된 백업 삭제 (30일 이상)
find $BACKUP_BASE -name "backup_*" -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true

echo "전체 시스템 백업 완료: $BACKUP_DIR"
echo "백업 완료 시간: $(date)"

# 백업 크기 정보
du -sh $BACKUP_DIR
```

실행 권한 부여:
```bash
chmod +x /var/www/haeoreum/backup-full.sh
```

### 11.2 정기 작업 스케줄링

#### crontab 설정
```bash
# crontab 편집
crontab -e

# 다음 내용 추가
# 매일 새벽 2시에 데이터베이스 백업
0 2 * * * /var/www/haeoreum/backup-database.sh >> /var/log/haeoreum-backup.log 2>&1

# 매주 일요일 새벽 3시에 전체 백업
0 3 * * 0 /var/www/haeoreum/backup-full.sh >> /var/log/haeoreum-backup.log 2>&1

# 매 5분마다 시스템 상태 모니터링
*/5 * * * * /var/www/haeoreum/health-monitor.sh

# 매일 새벽 1시에 로그 정리
0 1 * * * find /var/log -name "*.log" -type f -mtime +7 -delete

# PM2 프로세스 저장 (매시간)
0 * * * * pm2 save
```

### 11.3 업데이트 절차

#### 11.3.1 애플리케이션 업데이트 프로세스

```bash
# 업데이트 스크립트 생성
nano /var/www/haeoreum/update-application.sh
```

다음 내용을 입력:
```bash
#!/bin/bash

# 애플리케이션 업데이트 스크립트

set -e

# 설정
PROJECT_DIR="/var/www/haeoreum"
BACKUP_DIR="/backup/update_$(date +%Y%m%d_%H%M%S)"

echo "애플리케이션 업데이트 시작: $(date)"

# 1. 현재 상태 백업
echo "현재 상태 백업 중..."
mkdir -p $BACKUP_DIR
cp -r $PROJECT_DIR $BACKUP_DIR/
pm2 save

# 2. 서비스 중지
echo "서비스 중지 중..."
pm2 stop haeoreum-api
sudo systemctl stop tomcat

# 3. 소스 코드 업데이트
echo "소스 코드 업데이트 중..."
cd $PROJECT_DIR

if [ -d ".git" ]; then
    git stash
    git pull origin main
    git stash pop 2>/dev/null || true
else
    echo "Git 저장소가 아닙니다. 수동으로 소스를 업데이트하세요."
    exit 1
fi

# 4. 의존성 업데이트
echo "의존성 업데이트 중..."
npm ci

# 5. 데이터베이스 마이그레이션
echo "데이터베이스 스키마 업데이트 중..."
export $(grep -v '^#' .env | xargs)
npm run db:push

# 6. 빌드
echo "애플리케이션 빌드 중..."
npm run build

# 7. 웹앱 배포
echo "웹 애플리케이션 배포 중..."
sudo rm -rf /opt/tomcat/webapps/haeoreum
sudo mkdir -p /opt/tomcat/webapps/haeoreum/WEB-INF
sudo cp -r dist/public/* /opt/tomcat/webapps/haeoreum/
sudo cp web.xml /opt/tomcat/webapps/haeoreum/WEB-INF/
sudo chown -R tomcat:tomcat /opt/tomcat/webapps/haeoreum

# 8. 서비스 시작
echo "서비스 시작 중..."
sudo systemctl start tomcat
sleep 5
pm2 restart haeoreum-api

# 9. 상태 확인
echo "서비스 상태 확인 중..."
sleep 10

if curl -f -s http://localhost:8080/haeoreum >/dev/null; then
    echo "웹사이트 정상 작동"
else
    echo "웹사이트 오류 발생"
    exit 1
fi

if curl -f -s http://localhost:8080/api/health >/dev/null; then
    echo "API 서버 정상 작동"
else
    echo "API 서버 오류 발생"
    exit 1
fi

echo "업데이트 완료: $(date)"
echo "백업 위치: $BACKUP_DIR"
```

실행 권한 부여:
```bash
chmod +x /var/www/haeoreum/update-application.sh
```

### 11.4 성능 최적화

#### 11.4.1 Tomcat 성능 튜닝

```bash
# setenv.sh 최적화 설정
sudo nano /opt/tomcat/bin/setenv.sh
```

다음 내용으로 업데이트:
```bash
#!/bin/bash

# Java 환경 설정
export JAVA_HOME="/usr/lib/jvm/java-11-openjdk-amd64"
export JRE_HOME="$JAVA_HOME"

# Tomcat 환경 설정
export CATALINA_HOME="/opt/tomcat"
export CATALINA_BASE="/opt/tomcat"
export CATALINA_PID="/opt/tomcat/temp/tomcat.pid"

# 시스템 메모리에 따른 JVM 설정 (8GB 서버 기준)
export CATALINA_OPTS="-Xms2048m -Xmx6144m -server"
export CATALINA_OPTS="$CATALINA_OPTS -XX:+UseG1GC"
export CATALINA_OPTS="$CATALINA_OPTS -XX:MaxGCPauseMillis=200"
export CATALINA_OPTS="$CATALINA_OPTS -XX:+UseStringDeduplication"
export CATALINA_OPTS="$CATALINA_OPTS -XX:+OptimizeStringConcat"
export CATALINA_OPTS="$CATALINA_OPTS -Djava.awt.headless=true"
export CATALINA_OPTS="$CATALINA_OPTS -Dfile.encoding=UTF-8"
export CATALINA_OPTS="$CATALINA_OPTS -Duser.timezone=Asia/Seoul"
export CATALINA_OPTS="$CATALINA_OPTS -Djava.security.egd=file:/dev/./urandom"

# 네트워크 성능 최적화
export CATALINA_OPTS="$CATALINA_OPTS -Djava.net.preferIPv4Stack=true"
export CATALINA_OPTS="$CATALINA_OPTS -Dnetworkaddress.cache.ttl=60"

# 성능 모니터링 (필요시 활성화)
# export CATALINA_OPTS="$CATALINA_OPTS -Dcom.sun.management.jmxremote"
# export CATALINA_OPTS="$CATALINA_OPTS -Dcom.sun.management.jmxremote.port=8999"
# export CATALINA_OPTS="$CATALINA_OPTS -Dcom.sun.management.jmxremote.authenticate=false"
# export CATALINA_OPTS="$CATALINA_OPTS -Dcom.sun.management.jmxremote.ssl=false"
```

#### 11.4.2 PostgreSQL 성능 튜닝

```bash
# PostgreSQL 설정 백업
sudo cp /etc/postgresql/14/main/postgresql.conf /etc/postgresql/14/main/postgresql.conf.backup

# 설정 파일 편집
sudo nano /etc/postgresql/14/main/postgresql.conf
```

주요 성능 설정 (8GB 메모리 서버 기준):
```ini
# 메모리 설정
shared_buffers = 2GB                    # 전체 메모리의 25%
effective_cache_size = 6GB              # 전체 메모리의 75%
maintenance_work_mem = 256MB
work_mem = 16MB

# 체크포인트 설정
checkpoint_completion_target = 0.9
wal_buffers = 64MB
checkpoint_timeout = 15min

# 쿼리 플래너 설정
default_statistics_target = 100
random_page_cost = 1.1

# 로깅 설정
log_min_duration_statement = 1000       # 1초 이상 걸리는 쿼리 로깅
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# 연결 설정
max_connections = 200
```

설정 적용:
```bash
# PostgreSQL 재시작
sudo systemctl restart postgresql

# 설정 확인
sudo -u postgres psql -c "SHOW shared_buffers;"
sudo -u postgres psql -c "SHOW effective_cache_size;"
```

이 완전한 Tomcat 배포 가이드를 통해 해오름인포텍 업무시스템을 안정적으로 운영할 수 있습니다. 각 단계를 순서대로 따라하면 프로덕션 환경에서 안정적으로 서비스를 제공할 수 있습니다.

추가 질문이나 특정 단계에서 문제가 발생하면 언제든 문의해 주세요.