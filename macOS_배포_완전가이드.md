# 해오름인포텍 업무시스템 - macOS 배포 완전 가이드

## 사전 준비사항

### 시스템 요구사항
- **macOS**: 10.15 (Catalina) 이상
- **메모리**: 최소 8GB RAM 권장
- **저장공간**: 최소 15GB 여유공간
- **네트워크**: 인터넷 연결 (패키지 다운로드용)

---

## 1단계: 개발 도구 설치 (소요시간: 15분)

### 1.1 Xcode Command Line Tools 설치
```bash
# 터미널에서 실행
xcode-select --install
```
설치 팝업이 나타나면 "설치" 버튼을 클릭하고 완료까지 기다립니다.

### 1.2 Homebrew 설치 (macOS 패키지 관리자)
```bash
# Homebrew 설치
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 설치 후 PATH 설정 (M1/M2 Mac의 경우)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc

# Intel Mac의 경우
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc

# 설치 확인
brew --version
```

---

## 2단계: Java 설치 (소요시간: 5분)

### 2.1 OpenJDK 11 설치
```bash
# Homebrew를 통한 OpenJDK 11 설치
brew install openjdk@11

# Java 11을 기본 Java로 설정
sudo ln -sfn /opt/homebrew/opt/openjdk@11/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-11.jdk

# Intel Mac의 경우
sudo ln -sfn /usr/local/opt/openjdk@11/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-11.jdk
```

### 2.2 JAVA_HOME 환경변수 설정
```bash
# zsh 사용자 (macOS 기본)
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v11)' >> ~/.zshrc
echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# bash 사용자
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v11)' >> ~/.bash_profile
echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> ~/.bash_profile
source ~/.bash_profile

# 설치 확인
java -version
javac -version
echo $JAVA_HOME
```

---

## 3단계: Node.js 설치 (소요시간: 5분)

### 3.1 Node.js LTS 버전 설치
```bash
# Homebrew를 통한 Node.js 설치
brew install node

# 설치 확인
node --version
npm --version
```

### 3.2 npm 글로벌 권한 설정
```bash
# npm 글로벌 디렉토리 생성
mkdir ~/.npm-global

# npm 설정
npm config set prefix '~/.npm-global'

# PATH 설정
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

---

## 4단계: PostgreSQL 설치 (소요시간: 10분)

### 4.1 PostgreSQL 설치
```bash
# Homebrew를 통한 PostgreSQL 설치
brew install postgresql@14

# PostgreSQL 서비스 시작
brew services start postgresql@14

# PATH 설정
echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Intel Mac의 경우
echo 'export PATH="/usr/local/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 4.2 데이터베이스 설정
```bash
# PostgreSQL 접속 (기본 사용자)
psql postgres

# 데이터베이스 및 사용자 생성
CREATE DATABASE haeoreum_db;
CREATE USER haeoreum_user WITH PASSWORD 'haeoreum2024!';
GRANT ALL PRIVILEGES ON DATABASE haeoreum_db TO haeoreum_user;
\q

# 연결 테스트
psql -h localhost -U haeoreum_user -d haeoreum_db
# 비밀번호 입력: haeoreum2024!
\q
```

---

## 5단계: Apache Tomcat 설치 (소요시간: 10분)

### 5.1 Tomcat 설치
```bash
# Homebrew를 통한 Tomcat 설치
brew install tomcat@9

# Tomcat 디렉토리 확인
ls -la /opt/homebrew/var/lib/tomcat@9/
# Intel Mac: /usr/local/var/lib/tomcat@9/
```

### 5.2 Tomcat 환경변수 설정
```bash
# M1/M2 Mac
echo 'export CATALINA_HOME="/opt/homebrew/var/lib/tomcat@9"' >> ~/.zshrc
echo 'export CATALINA_BASE="/opt/homebrew/var/lib/tomcat@9"' >> ~/.zshrc

# Intel Mac
echo 'export CATALINA_HOME="/usr/local/var/lib/tomcat@9"' >> ~/.zshrc
echo 'export CATALINA_BASE="/usr/local/var/lib/tomcat@9"' >> ~/.zshrc

source ~/.zshrc
```

### 5.3 Tomcat 서비스 관리
```bash
# Tomcat 시작
brew services start tomcat@9

# Tomcat 상태 확인
brew services list | grep tomcat

# 브라우저에서 접속 테스트
open http://localhost:8080
```

---

## 6단계: 프로젝트 다운로드 및 설정 (소요시간: 10분)

### 6.1 Git 설치 및 프로젝트 클론
```bash
# Git 설치 (보통 Xcode Command Line Tools와 함께 설치됨)
git --version

# 프로젝트 클론
cd ~/Documents
git clone https://github.com/your-repo/haeoreum-system.git
cd haeoreum-system

# 또는 압축파일 다운로드 후 압축 해제
tar -xzf haeoreum-complete.tar.gz
cd haeoreum-complete
```

### 6.2 프로젝트 의존성 설치
```bash
# npm 의존성 설치
npm install

# PM2 글로벌 설치
npm install -g pm2

# 설치 확인
pm2 --version
```

---

## 7단계: 환경 설정 (소요시간: 5분)

### 7.1 환경변수 파일 생성
```bash
# .env 파일 생성
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://haeoreum_user:haeoreum2024!@localhost:5432/haeoreum_db
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
TZ=Asia/Seoul
EOF
```

### 7.2 API 키 설정 (선택사항)
```bash
# .env 파일 편집
nano .env
# 또는
open -e .env

# OPENAI_API_KEY와 GEMINI_API_KEY를 실제 키로 변경
```

---

## 8단계: 프로젝트 빌드 (소요시간: 5분)

### 8.1 TypeScript 빌드
```bash
# 프로젝트 빌드
npm run build

# 빌드 결과 확인
ls -la dist/
ls -la dist/public/
```

### 8.2 데이터베이스 스키마 적용
```bash
# 데이터베이스 스키마 적용
npm run db:push

# 스키마 확인
psql -h localhost -U haeoreum_user -d haeoreum_db -c "\dt"
```

---

## 9단계: macOS용 자동 배포 스크립트 실행 (소요시간: 2분)

### 9.1 배포 스크립트 실행 권한 부여
```bash
# 실행 권한 부여
chmod +x start-local-tomcat.sh

# macOS 보안 설정으로 인한 실행 제한 해제 (필요시)
xattr -d com.apple.quarantine start-local-tomcat.sh
```

### 9.2 자동 배포 실행
```bash
# 자동 배포 스크립트 실행
./start-local-tomcat.sh
```

---

## 10단계: macOS용 Tomcat 웹앱 배포 (소요시간: 5분)

### 10.1 웹앱 디렉토리 생성
```bash
# M1/M2 Mac
sudo mkdir -p /opt/homebrew/var/lib/tomcat@9/webapps/haeoreum/WEB-INF

# Intel Mac
sudo mkdir -p /usr/local/var/lib/tomcat@9/webapps/haeoreum/WEB-INF
```

### 10.2 빌드된 파일 배포
```bash
# M1/M2 Mac
sudo cp -r dist/public/* /opt/homebrew/var/lib/tomcat@9/webapps/haeoreum/
sudo cp web.xml /opt/homebrew/var/lib/tomcat@9/webapps/haeoreum/WEB-INF/
sudo chown -R $(whoami):staff /opt/homebrew/var/lib/tomcat@9/webapps/haeoreum

# Intel Mac
sudo cp -r dist/public/* /usr/local/var/lib/tomcat@9/webapps/haeoreum/
sudo cp web.xml /usr/local/var/lib/tomcat@9/webapps/haeoreum/WEB-INF/
sudo chown -R $(whoami):staff /usr/local/var/lib/tomcat@9/webapps/haeoreum
```

### 10.3 Tomcat 재시작
```bash
# Tomcat 재시작
brew services restart tomcat@9

# 상태 확인
brew services list | grep tomcat
```

---

## 11단계: 백엔드 API 서버 시작 (소요시간: 2분)

### 11.1 PM2로 백엔드 서버 관리
```bash
# 기존 프로세스 중지 (있는 경우)
pm2 stop all

# 백엔드 API 서버 시작
pm2 start ecosystem.config.cjs

# 프로세스 상태 확인
pm2 status

# 로그 확인
pm2 logs haeoreum-api

# 부팅시 자동 시작 설정
pm2 startup
# 표시되는 명령어를 복사해서 실행 (예: sudo env PATH=...)
pm2 save
```

---

## 12단계: 서비스 접속 확인 (소요시간: 3분)

### 12.1 웹 브라우저 접속 테스트
```bash
# 자동으로 브라우저에서 열기
open http://localhost:8080/haeoreum

# 또는 curl로 테스트
curl -I http://localhost:8080/haeoreum
```

### 12.2 API 서버 접속 테스트
```bash
# API 서버 테스트
curl http://localhost:3000/api/projects

# 상세 응답 확인
curl -s http://localhost:3000/api/projects | python3 -m json.tool
```

### 12.3 주요 페이지 접속 확인
- **메인 페이지**: http://localhost:8080/haeoreum
- **대시보드**: http://localhost:8080/haeoreum/dashboard
- **관리자 포털**: http://localhost:8080/haeoreum/access
- **API 엔드포인트**: http://localhost:3000/api

---

## macOS 전용 서비스 관리

### Tomcat 서비스 관리
```bash
# Tomcat 시작
brew services start tomcat@9

# Tomcat 중지
brew services stop tomcat@9

# Tomcat 재시작
brew services restart tomcat@9

# Tomcat 상태 확인
brew services info tomcat@9
```

### PostgreSQL 서비스 관리
```bash
# PostgreSQL 시작
brew services start postgresql@14

# PostgreSQL 중지
brew services stop postgresql@14

# PostgreSQL 상태 확인
brew services info postgresql@14
```

### PM2 프로세스 관리
```bash
# 모든 프로세스 상태 확인
pm2 status

# 특정 프로세스 재시작
pm2 restart haeoreum-api

# 로그 실시간 확인
pm2 logs --lines 50

# 프로세스 중지
pm2 stop haeoreum-api

# 프로세스 완전 삭제
pm2 delete haeoreum-api
```

---

## macOS 특화 문제 해결

### 권한 문제 해결
```bash
# Tomcat 디렉토리 권한 설정
sudo chown -R $(whoami):staff /opt/homebrew/var/lib/tomcat@9  # M1/M2
sudo chown -R $(whoami):staff /usr/local/var/lib/tomcat@9     # Intel

# 실행 파일 권한 설정
chmod +x *.sh
```

### 포트 충돌 해결
```bash
# 포트 사용 확인
lsof -i :8080
lsof -i :3000

# 프로세스 종료
sudo kill -9 $(lsof -t -i:8080)
sudo kill -9 $(lsof -t -i:3000)
```

### Homebrew 서비스 문제
```bash
# Homebrew 서비스 목록 확인
brew services list

# 서비스 로그 확인
brew services info tomcat@9
brew services info postgresql@14

# Homebrew 업데이트
brew update && brew upgrade
```

### macOS 보안 설정 관련
```bash
# Gatekeeper 설정으로 인한 실행 제한 해제
sudo spctl --master-disable  # 주의: 보안상 권장하지 않음

# 특정 파일만 허용
xattr -d com.apple.quarantine start-local-tomcat.sh
```

---

## macOS용 자동 시작 설정

### LaunchAgent 생성 (부팅시 자동 시작)
```bash
# LaunchAgent 디렉토리 생성
mkdir -p ~/Library/LaunchAgents

# Tomcat 자동 시작 설정
cat > ~/Library/LaunchAgents/com.haeoreum.tomcat.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.haeoreum.tomcat</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/brew</string>
        <string>services</string>
        <string>start</string>
        <string>tomcat@9</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

# LaunchAgent 등록
launchctl load ~/Library/LaunchAgents/com.haeoreum.tomcat.plist
```

### 시스템 재부팅 후 자동 시작 확인
```bash
# 재부팅 후 실행
sudo reboot

# 부팅 완료 후 서비스 상태 확인
brew services list
pm2 status
```

---

## 성능 최적화 (macOS)

### JVM 메모리 설정
```bash
# Tomcat JVM 옵션 설정
echo 'export CATALINA_OPTS="-Xms2048m -Xmx4096m -server"' >> ~/.zshrc
source ~/.zshrc
```

### 네트워크 설정
```bash
# 네트워크 인터페이스 확인
ifconfig | grep inet

# 방화벽 설정 (필요시)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

---

## 완료 체크리스트

- [ ] Xcode Command Line Tools 설치
- [ ] Homebrew 설치
- [ ] Java 11 설치 및 JAVA_HOME 설정
- [ ] Node.js 및 npm 설치
- [ ] PostgreSQL 설치 및 데이터베이스 생성
- [ ] Apache Tomcat 설치 및 서비스 등록
- [ ] 프로젝트 다운로드 및 의존성 설치
- [ ] 환경변수 설정
- [ ] 프로젝트 빌드 및 데이터베이스 스키마 적용
- [ ] Tomcat 웹앱 배포
- [ ] PM2 백엔드 서버 시작
- [ ] 웹 브라우저 접속 테스트
- [ ] 자동 시작 설정 (선택사항)

## 최종 확인

배포가 완료되면 다음 URL에서 시스템에 접속할 수 있습니다:

- **메인 웹사이트**: http://localhost:8080/haeoreum
- **관리 대시보드**: http://localhost:8080/haeoreum/dashboard  
- **백엔드 API**: http://localhost:3000/api

이제 macOS에서 완전히 독립적으로 해오름인포텍 업무시스템을 운영할 수 있습니다!

---

**기술 지원**: sunrise050716@company.com  
**해오름인포텍 업무시스템** - macOS 완전 지원