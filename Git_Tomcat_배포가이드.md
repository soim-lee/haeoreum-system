# Git을 이용한 Tomcat 배포 완전 가이드

## 목차
1. [Git 배포 개요](#1-git-배포-개요)
2. [Git 저장소 설정](#2-git-저장소-설정)
3. [서버 환경 준비](#3-서버-환경-준비)
4. [Git 기반 배포 스크립트](#4-git-기반-배포-스크립트)
5. [자동 배포 시스템](#5-자동-배포-시스템)
6. [CI/CD 파이프라인](#6-cicd-파이프라인)
7. [운영 및 모니터링](#7-운영-및-모니터링)
8. [문제 해결](#8-문제-해결)

---

## 1. Git 배포 개요

### 1.1 Git 배포의 장점
- **버전 관리**: 배포 이력 추적 및 롤백 용이
- **자동화**: Git 훅을 통한 자동 배포
- **협업**: 여러 개발자의 동시 작업 지원
- **브랜치 전략**: 개발/스테이징/프로덕션 환경 분리

### 1.2 배포 아키텍처
```
┌─────────────────┐    git push     ┌─────────────────┐
│   Replit 개발    │ ──────────────→ │   Git Repository │
│     환경        │                 │   (GitHub/GitLab)│
└─────────────────┘                 └─────────────────┘
                                             │
                                       git pull/clone
                                             ↓
                                    ┌─────────────────┐
                                    │   배포 서버      │
                                    │   (Tomcat)      │
                                    └─────────────────┘
```

### 1.3 배포 전략
- **단순 배포**: git pull → build → deploy
- **Blue-Green**: 무중단 배포
- **Rolling**: 점진적 배포
- **Canary**: 일부 트래픽으로 테스트

---

## 2. Git 저장소 설정

### 2.1 Replit에서 Git 저장소 초기화

#### GitHub 저장소 생성 및 연결
```bash
# Replit 터미널에서 실행

# Git 초기화
git init

# 사용자 정보 설정
git config user.name "Your Name"
git config user.email "your.email@example.com"

# .gitignore 파일 생성
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Replit specific
.replit
replit.nix
.breakpoints

# IDE
.vscode/
.idea/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
EOF

# 파일 추가
git add .

# 초기 커밋
git commit -m "Initial commit: 해오름인포텍 업무시스템"

# GitHub 저장소 연결 (미리 생성 필요)
git remote add origin https://github.com/your-username/haeoreum-system.git

# main 브랜치로 설정
git branch -M main

# 첫 푸시
git push -u origin main
```

### 2.2 브랜치 전략 설정

#### Git Flow 브랜치 전략
```bash
# 개발 브랜치 생성
git checkout -b develop
git push -u origin develop

# 기능 브랜치 생성 예시
git checkout -b feature/new-dashboard develop

# 릴리즈 브랜치 생성
git checkout -b release/1.0.0 develop

# 핫픽스 브랜치 생성
git checkout -b hotfix/urgent-fix main
```

#### 환경별 브랜치 설정
```bash
# 스테이징 환경 브랜치
git checkout -b staging
git push -u origin staging

# 프로덕션 환경 브랜치 (main 사용)
# 개발 환경 브랜치 (develop 사용)
```

### 2.3 배포용 태그 관리

#### 시맨틱 버전닝
```bash
# 버전 태그 생성
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 모든 태그 푸시
git push origin --tags

# 태그 목록 확인
git tag -l

# 특정 태그로 체크아웃
git checkout v1.0.0
```

---

## 3. 서버 환경 준비

### 3.1 서버 기본 설정

#### Ubuntu 서버 환경 구성
```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y \
    git \
    curl \
    wget \
    openjdk-11-jdk \
    nodejs \
    npm \
    postgresql \
    postgresql-contrib

# Git 버전 확인
git --version
```

#### Git 사용자 설정
```bash
# 전역 Git 설정
git config --global user.name "Deploy Server"
git config --global user.email "deploy@haeoreum-system.com"

# 설정 확인
git config --list
```

### 3.2 Tomcat 설치 및 설정

#### Tomcat 9 설치
```bash
# Tomcat 사용자 생성
sudo useradd -m -U -d /opt/tomcat -s /bin/false tomcat

# Tomcat 다운로드
cd /tmp
sudo wget https://downloads.apache.org/tomcat/tomcat-9/v9.0.84/bin/apache-tomcat-9.0.84.tar.gz

# 압축 해제 및 설치
sudo tar -xzf apache-tomcat-9.0.84.tar.gz
sudo mv apache-tomcat-9.0.84/* /opt/tomcat/
sudo chown -R tomcat:tomcat /opt/tomcat
sudo chmod +x /opt/tomcat/bin/*.sh
```

#### Tomcat 환경 설정
```bash
# setenv.sh 생성
sudo nano /opt/tomcat/bin/setenv.sh
```

다음 내용 입력:
```bash
#!/bin/bash
export JAVA_HOME="/usr/lib/jvm/java-11-openjdk-amd64"
export CATALINA_HOME="/opt/tomcat"
export CATALINA_BASE="/opt/tomcat"
export CATALINA_PID="/opt/tomcat/temp/tomcat.pid"
export CATALINA_OPTS="-Xms1024m -Xmx4096m -server -XX:+UseG1GC"
export JAVA_OPTS="-Djava.awt.headless=true -Dfile.encoding=UTF-8"
```

권한 설정:
```bash
sudo chmod +x /opt/tomcat/bin/setenv.sh
```

#### Tomcat 서비스 등록
```bash
# systemd 서비스 파일 생성
sudo nano /etc/systemd/system/tomcat.service
```

다음 내용 입력:
```ini
[Unit]
Description=Apache Tomcat Web Application Container
After=network.target

[Service]
Type=forking
Environment="JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64"
Environment="CATALINA_PID=/opt/tomcat/temp/tomcat.pid"
Environment="CATALINA_HOME=/opt/tomcat"
Environment="CATALINA_BASE=/opt/tomcat"
Environment="CATALINA_OPTS=-Xms1024m -Xmx4096m -server -XX:+UseG1GC"
Environment="JAVA_OPTS=-Djava.awt.headless=true -Dfile.encoding=UTF-8"

ExecStart=/opt/tomcat/bin/startup.sh
ExecStop=/opt/tomcat/bin/shutdown.sh

User=tomcat
Group=tomcat
UMask=0007
RestartSec=10
Restart=always

[Install]
WantedBy=multi-user.target
```

서비스 활성화:
```bash
sudo systemctl daemon-reload
sudo systemctl enable tomcat
sudo systemctl start tomcat
sudo systemctl status tomcat
```

### 3.3 배포 디렉토리 구조 설정

#### 디렉토리 생성
```bash
# 프로젝트 디렉토리 생성
sudo mkdir -p /var/deploy/haeoreum
sudo chown -R $USER:$USER /var/deploy/haeoreum

# 배포 스크립트 디렉토리
mkdir -p /var/deploy/haeoreum/scripts

# 백업 디렉토리
sudo mkdir -p /backup/haeoreum
sudo chown -R $USER:$USER /backup/haeoreum

# 로그 디렉토리
sudo mkdir -p /var/log/haeoreum
sudo chown -R $USER:$USER /var/log/haeoreum
```

#### 디렉토리 구조
```
/var/deploy/haeoreum/
├── current/           # 현재 배포된 버전
├── releases/          # 릴리즈 히스토리
├── shared/           # 공유 파일 (환경변수 등)
└── scripts/          # 배포 스크립트
```

---

## 4. Git 기반 배포 스크립트

### 4.1 기본 배포 스크립트 (deploy-git.sh)

```bash
#!/bin/bash

# Git 기반 Tomcat 배포 스크립트
# 버전: 1.0

set -e

# ==================== 설정 변수 ====================
PROJECT_NAME="haeoreum"
DEPLOY_DIR="/var/deploy/$PROJECT_NAME"
TOMCAT_WEBAPPS="/opt/tomcat/webapps"
GIT_REPO="https://github.com/your-username/haeoreum-system.git"
BRANCH="main"
RELEASE_DIR="$DEPLOY_DIR/releases/$(date +%Y%m%d_%H%M%S)"
CURRENT_DIR="$DEPLOY_DIR/current"
SHARED_DIR="$DEPLOY_DIR/shared"

# ==================== 색상 정의 ====================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ==================== 로그 함수 ====================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%H:%M:%S') $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%H:%M:%S') $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%H:%M:%S') $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') $1"
}

# ==================== 유틸리티 함수 ====================
cleanup_on_error() {
    log_error "배포 중 오류 발생 - 정리 작업 시작"
    if [ -d "$RELEASE_DIR" ]; then
        rm -rf "$RELEASE_DIR"
        log_info "실패한 릴리즈 디렉토리 삭제: $RELEASE_DIR"
    fi
    exit 1
}

# 에러 트랩 설정
trap cleanup_on_error ERR

# ==================== 사전 검증 ====================
validate_environment() {
    log_info "환경 검증 시작..."
    
    # 필수 명령어 확인
    for cmd in git node npm java; do
        if ! command -v $cmd >/dev/null 2>&1; then
            log_error "$cmd 명령어를 찾을 수 없습니다."
            exit 1
        fi
    done
    
    # Tomcat 상태 확인
    if ! sudo systemctl is-active --quiet tomcat; then
        log_warning "Tomcat이 실행되지 않고 있습니다. 시작합니다..."
        sudo systemctl start tomcat
    fi
    
    # 디렉토리 확인
    mkdir -p "$DEPLOY_DIR/releases" "$SHARED_DIR"
    
    log_success "환경 검증 완료"
}

# ==================== Git 클론 및 체크아웃 ====================
clone_repository() {
    log_info "Git 저장소 클론 시작..."
    
    # 릴리즈 디렉토리 생성
    mkdir -p "$RELEASE_DIR"
    
    # 저장소 클론
    git clone --depth 1 --branch "$BRANCH" "$GIT_REPO" "$RELEASE_DIR"
    
    cd "$RELEASE_DIR"
    
    # 커밋 정보 로깅
    COMMIT_HASH=$(git rev-parse HEAD)
    COMMIT_MESSAGE=$(git log -1 --pretty=%B)
    
    log_info "배포 커밋: $COMMIT_HASH"
    log_info "커밋 메시지: $COMMIT_MESSAGE"
    
    log_success "Git 저장소 클론 완료"
}

# ==================== 의존성 설치 및 빌드 ====================
build_application() {
    log_info "애플리케이션 빌드 시작..."
    
    cd "$RELEASE_DIR"
    
    # 환경 변수 설정
    if [ -f "$SHARED_DIR/.env" ]; then
        cp "$SHARED_DIR/.env" ./
        log_info "공유 환경 변수 파일 복사 완료"
    else
        log_warning "환경 변수 파일이 없습니다. .env.example을 참고하세요."
        cp .env.example .env 2>/dev/null || true
    fi
    
    # Node.js 의존성 설치
    log_info "Node.js 의존성 설치 중..."
    npm ci --production=false
    
    # TypeScript 컴파일 확인
    log_info "TypeScript 컴파일 확인 중..."
    npm run check || log_warning "TypeScript 체크에서 경고가 있습니다."
    
    # 프로젝트 빌드
    log_info "프로젝트 빌드 실행 중..."
    npm run build
    
    # 빌드 결과 확인
    if [ ! -d "dist" ] || [ ! -d "dist/public" ]; then
        log_error "빌드 실패: dist 디렉토리가 생성되지 않았습니다."
        exit 1
    fi
    
    log_success "애플리케이션 빌드 완료"
}

# ==================== Tomcat 웹앱 배포 ====================
deploy_to_tomcat() {
    log_info "Tomcat 웹앱 배포 시작..."
    
    local webapp_dir="$TOMCAT_WEBAPPS/$PROJECT_NAME"
    local backup_dir="/backup/haeoreum/webapp_$(date +%Y%m%d_%H%M%S)"
    
    # 기존 웹앱 백업
    if [ -d "$webapp_dir" ]; then
        log_info "기존 웹앱 백업 중..."
        sudo mkdir -p "$backup_dir"
        sudo cp -r "$webapp_dir" "$backup_dir/"
    fi
    
    # Tomcat 정지
    log_info "Tomcat 서비스 정지 중..."
    sudo systemctl stop tomcat
    
    # 기존 웹앱 제거
    sudo rm -rf "$webapp_dir"
    
    # 새 웹앱 디렉토리 생성
    sudo mkdir -p "$webapp_dir/WEB-INF"
    
    # 빌드된 파일 복사
    sudo cp -r "$RELEASE_DIR/dist/public/"* "$webapp_dir/"
    
    # web.xml 파일 복사
    if [ -f "$RELEASE_DIR/web.xml" ]; then
        sudo cp "$RELEASE_DIR/web.xml" "$webapp_dir/WEB-INF/"
    else
        log_error "web.xml 파일이 없습니다."
        exit 1
    fi
    
    # 권한 설정
    sudo chown -R tomcat:tomcat "$webapp_dir"
    sudo find "$webapp_dir" -type f -exec chmod 644 {} \;
    sudo find "$webapp_dir" -type d -exec chmod 755 {} \;
    
    # Tomcat 시작
    log_info "Tomcat 서비스 시작 중..."
    sudo systemctl start tomcat
    
    # 서비스 상태 확인
    sleep 5
    if sudo systemctl is-active --quiet tomcat; then
        log_success "Tomcat 서비스 시작 완료"
    else
        log_error "Tomcat 서비스 시작 실패"
        exit 1
    fi
    
    log_success "Tomcat 웹앱 배포 완료"
}

# ==================== 백엔드 API 서버 배포 ====================
deploy_backend() {
    log_info "백엔드 API 서버 배포 시작..."
    
    cd "$RELEASE_DIR"
    
    # PM2 프로세스 중지
    pm2 stop haeoreum-api 2>/dev/null || log_warning "PM2 프로세스가 실행되지 않고 있습니다."
    
    # PM2로 새 프로세스 시작
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js --env production
        log_success "PM2로 백엔드 서버 시작 완료"
    else
        log_warning "ecosystem.config.js가 없습니다. 수동으로 백엔드를 시작하세요."
    fi
    
    # PM2 설정 저장
    pm2 save
    
    log_success "백엔드 API 서버 배포 완료"
}

# ==================== 심볼릭 링크 업데이트 ====================
update_current_link() {
    log_info "현재 버전 링크 업데이트 중..."
    
    # 기존 current 링크 제거
    if [ -L "$CURRENT_DIR" ]; then
        rm "$CURRENT_DIR"
    elif [ -d "$CURRENT_DIR" ]; then
        mv "$CURRENT_DIR" "$CURRENT_DIR.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # 새 심볼릭 링크 생성
    ln -sf "$RELEASE_DIR" "$CURRENT_DIR"
    
    log_success "현재 버전 링크 업데이트 완료"
}

# ==================== 헬스 체크 ====================
health_check() {
    log_info "헬스 체크 시작..."
    
    local max_attempts=12
    local attempt=1
    local health_url="http://localhost:8080/$PROJECT_NAME"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$health_url" >/dev/null 2>&1; then
            log_success "헬스 체크 성공 (시도 $attempt/$max_attempts)"
            return 0
        fi
        
        log_info "헬스 체크 대기 중... ($attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    log_error "헬스 체크 실패 - 서비스가 정상적으로 시작되지 않았습니다."
    return 1
}

# ==================== 정리 작업 ====================
cleanup_old_releases() {
    log_info "오래된 릴리즈 정리 중..."
    
    local releases_dir="$DEPLOY_DIR/releases"
    local keep_releases=5
    
    if [ -d "$releases_dir" ]; then
        local release_count=$(ls -1 "$releases_dir" | wc -l)
        
        if [ $release_count -gt $keep_releases ]; then
            log_info "릴리즈 개수: $release_count (유지: $keep_releases)"
            
            # 가장 오래된 릴리즈들 삭제
            ls -1t "$releases_dir" | tail -n +$((keep_releases + 1)) | while read old_release; do
                rm -rf "$releases_dir/$old_release"
                log_info "오래된 릴리즈 삭제: $old_release"
            done
        fi
    fi
    
    log_success "정리 작업 완료"
}

# ==================== 배포 요약 ====================
show_deployment_summary() {
    local end_time=$(date)
    
    echo ""
    echo "=================================================="
    echo "             배포 완료 요약"
    echo "=================================================="
    echo "배포 시간: $end_time"
    echo "Git 브랜치: $BRANCH"
    echo "릴리즈 디렉토리: $RELEASE_DIR"
    echo "웹 사이트: http://$(hostname -I | awk '{print $1}'):8080/$PROJECT_NAME"
    echo ""
    echo "서비스 상태 확인:"
    echo "- Tomcat: sudo systemctl status tomcat"
    echo "- PM2: pm2 status"
    echo "- 로그: sudo tail -f /opt/tomcat/logs/catalina.out"
    echo ""
    echo "배포가 성공적으로 완료되었습니다!"
    echo ""
}

# ==================== 메인 실행 함수 ====================
main() {
    local start_time=$(date)
    
    log_info "Git 기반 배포 시작: $start_time"
    
    # 배포 실행
    validate_environment
    clone_repository
    build_application
    deploy_to_tomcat
    deploy_backend
    update_current_link
    
    # 헬스 체크
    if health_check; then
        cleanup_old_releases
        show_deployment_summary
    else
        log_error "배포는 완료되었지만 헬스 체크에 실패했습니다."
        log_info "수동으로 서비스 상태를 확인해주세요."
    fi
}

# ==================== 스크립트 실행 ====================
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

### 4.2 스크립트 설정 및 실행

#### 실행 권한 부여
```bash
chmod +x /var/deploy/haeoreum/scripts/deploy-git.sh
```

#### 환경 변수 설정
```bash
# 공유 환경 변수 파일 생성
nano /var/deploy/haeoreum/shared/.env
```

다음 내용 입력:
```bash
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://haeoreum_user:password@localhost:5432/haeoreum_db
OPENAI_API_KEY=your_openai_api_key_here
TZ=Asia/Seoul
```

### 4.3 배포 실행

#### 수동 배포
```bash
# 배포 스크립트 실행
/var/deploy/haeoreum/scripts/deploy-git.sh

# 특정 브랜치 배포
BRANCH=develop /var/deploy/haeoreum/scripts/deploy-git.sh
```

#### 배포 상태 확인
```bash
# Tomcat 상태 확인
sudo systemctl status tomcat

# PM2 프로세스 확인
pm2 status

# 웹사이트 접근 테스트
curl -I http://localhost:8080/haeoreum

# 로그 확인
sudo tail -f /opt/tomcat/logs/catalina.out
```

---

## 5. 자동 배포 시스템

### 5.1 Git 훅을 이용한 자동 배포

#### 서버에서 Bare 저장소 생성
```bash
# Bare 저장소 생성
sudo mkdir -p /var/git/haeoreum.git
sudo chown -R $USER:$USER /var/git/haeoreum.git
cd /var/git/haeoreum.git
git init --bare

# post-receive 훅 생성
nano hooks/post-receive
```

다음 내용 입력:
```bash
#!/bin/bash

# Git post-receive 훅 - 자동 배포

PROJECT_NAME="haeoreum"
DEPLOY_SCRIPT="/var/deploy/$PROJECT_NAME/scripts/deploy-git.sh"
LOG_FILE="/var/log/$PROJECT_NAME/auto-deploy.log"

echo "Git push 감지 - 자동 배포 시작" | tee -a $LOG_FILE

# 브랜치 확인
while read oldrev newrev refname; do
    branch=$(git rev-parse --symbolic --abbrev-ref $refname)
    
    echo "브랜치: $branch" | tee -a $LOG_FILE
    
    # main 브랜치만 자동 배포
    if [[ $branch == "main" ]]; then
        echo "프로덕션 배포 시작..." | tee -a $LOG_FILE
        
        # 배포 스크립트 실행
        BRANCH=$branch $DEPLOY_SCRIPT >> $LOG_FILE 2>&1
        
        if [ $? -eq 0 ]; then
            echo "자동 배포 성공!" | tee -a $LOG_FILE
        else
            echo "자동 배포 실패!" | tee -a $LOG_FILE
        fi
    else
        echo "브랜치 $branch는 자동 배포하지 않습니다." | tee -a $LOG_FILE
    fi
done
```

실행 권한 부여:
```bash
chmod +x hooks/post-receive
```

#### 로컬에서 서버 저장소 연결
```bash
# 로컬 프로젝트에서 서버 저장소 추가
git remote add production username@server-ip:/var/git/haeoreum.git

# 프로덕션 서버로 배포
git push production main
```

### 5.2 GitHub Actions를 이용한 CI/CD

#### .github/workflows/deploy.yml 생성
```yaml
name: Deploy to Tomcat Server

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/deploy/haeoreum/scripts
          ./deploy-git.sh
```

#### GitHub Secrets 설정
GitHub 저장소 Settings → Secrets → Actions에서 다음 설정:
- `HOST`: 서버 IP 주소
- `USERNAME`: SSH 사용자명
- `SSH_KEY`: SSH 개인키 내용

### 5.3 GitLab CI/CD 설정

#### .gitlab-ci.yml 생성
```yaml
stages:
  - build
  - test
  - deploy

variables:
  NODE_VERSION: "18"

build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test

deploy_production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan $SERVER_HOST >> ~/.ssh/known_hosts
    - chmod 644 ~/.ssh/known_hosts
  script:
    - ssh $SERVER_USER@$SERVER_HOST "cd /var/deploy/haeoreum/scripts && ./deploy-git.sh"
  only:
    - main
```

---

## 6. CI/CD 파이프라인

### 6.1 Jenkins 파이프라인 설정

#### Jenkinsfile 생성
```groovy
pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        PROJECT_NAME = 'haeoreum'
        DEPLOY_SERVER = 'your-server-ip'
        DEPLOY_USER = 'deploy-user'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Code Quality Check') {
            steps {
                sh 'npm run lint'
                sh 'npm run check'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test'
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'test-results.xml'
                }
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
            post {
                success {
                    archiveArtifacts artifacts: 'dist/**/*', fingerprint: true
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                sshagent(['deploy-ssh-key']) {
                    sh """
                        ssh ${DEPLOY_USER}@${DEPLOY_SERVER} '
                            cd /var/deploy/${PROJECT_NAME}/scripts
                            BRANCH=develop ./deploy-git.sh
                        '
                    """
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                sshagent(['deploy-ssh-key']) {
                    sh """
                        ssh ${DEPLOY_USER}@${DEPLOY_SERVER} '
                            cd /var/deploy/${PROJECT_NAME}/scripts
                            ./deploy-git.sh
                        '
                    """
                }
            }
        }
    }
    
    post {
        success {
            slackSend channel: '#deployments',
                     color: 'good',
                     message: "✅ ${PROJECT_NAME} 배포 성공 - ${env.BRANCH_NAME} 브랜치"
        }
        failure {
            slackSend channel: '#deployments',
                     color: 'danger',
                     message: "❌ ${PROJECT_NAME} 배포 실패 - ${env.BRANCH_NAME} 브랜치"
        }
    }
}
```

### 6.2 Docker를 이용한 배포 (선택사항)

#### Dockerfile 생성
```dockerfile
# 멀티 스테이지 빌드
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 프로덕션 이미지
FROM tomcat:9.0-jdk11-openjdk

# 빌드된 파일 복사
COPY --from=builder /app/dist/public/ /usr/local/tomcat/webapps/haeoreum/
COPY --from=builder /app/web.xml /usr/local/tomcat/webapps/haeoreum/WEB-INF/

# 포트 노출
EXPOSE 8080

# Tomcat 시작
CMD ["catalina.sh", "run"]
```

#### docker-compose.yml 생성
```yaml
version: '3.8'

services:
  haeoreum-app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
    volumes:
      - ./logs:/usr/local/tomcat/logs
    restart: unless-stopped

  haeoreum-db:
    image: postgres:14
    environment:
      POSTGRES_DB: haeoreum_db
      POSTGRES_USER: haeoreum_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## 7. 운영 및 모니터링

### 7.1 배포 모니터링 스크립트

#### 배포 상태 모니터링
```bash
#!/bin/bash

# deploy-monitor.sh
# 배포 상태 실시간 모니터링

PROJECT_NAME="haeoreum"
MONITOR_URL="http://localhost:8080/$PROJECT_NAME"
LOG_FILE="/var/log/$PROJECT_NAME/monitor.log"
ALERT_EMAIL="admin@company.com"

monitor_deployment() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # HTTP 상태 확인
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" $MONITOR_URL)
    
    # Tomcat 프로세스 확인
    local tomcat_status=$(systemctl is-active tomcat)
    
    # PM2 프로세스 확인
    local pm2_status=$(pm2 list | grep -c "online" || echo "0")
    
    # 로그 기록
    echo "[$timestamp] HTTP: $http_status, Tomcat: $tomcat_status, PM2: $pm2_status processes" >> $LOG_FILE
    
    # 알림 조건 확인
    if [ "$http_status" != "200" ] || [ "$tomcat_status" != "active" ]; then
        send_alert "시스템 오류 감지: HTTP($http_status), Tomcat($tomcat_status)"
    fi
}

send_alert() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 이메일 알림
    echo "[$timestamp] $message" | mail -s "해오름시스템 알림" $ALERT_EMAIL
    
    # Slack 알림 (웹훅 URL 설정 필요)
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"$message\"}" \
    #     YOUR_SLACK_WEBHOOK_URL
}

# 5분마다 모니터링
while true; do
    monitor_deployment
    sleep 300
done
```

### 7.2 로그 관리

#### 로그 로테이션 설정
```bash
# /etc/logrotate.d/haeoreum 생성
sudo nano /etc/logrotate.d/haeoreum
```

다음 내용 입력:
```
/var/log/haeoreum/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        # 로그 로테이션 알림
        echo "Haeoreum logs rotated on $(date)" | mail -s "Log Rotation" admin@company.com
    endscript
}

/opt/tomcat/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 tomcat tomcat
    postrotate
        sudo systemctl reload tomcat
    endscript
}
```

### 7.3 백업 전략

#### 자동 백업 스크립트
```bash
#!/bin/bash

# backup-system.sh
# 전체 시스템 백업

BACKUP_DIR="/backup/haeoreum/$(date +%Y%m%d_%H%M%S)"
PROJECT_DIR="/var/deploy/haeoreum/current"
TOMCAT_WEBAPPS="/opt/tomcat/webapps/haeoreum"

# 백업 디렉토리 생성
mkdir -p $BACKUP_DIR

# 소스 코드 백업
tar -czf $BACKUP_DIR/source_code.tar.gz $PROJECT_DIR

# Tomcat 웹앱 백업
tar -czf $BACKUP_DIR/tomcat_webapp.tar.gz $TOMCAT_WEBAPPS

# 데이터베이스 백업
pg_dump -h localhost -U haeoreum_user haeoreum_db | gzip > $BACKUP_DIR/database.sql.gz

# 설정 파일 백업
cp /var/deploy/haeoreum/shared/.env $BACKUP_DIR/
cp /opt/tomcat/bin/setenv.sh $BACKUP_DIR/

# 오래된 백업 삭제 (30일 이상)
find /backup/haeoreum -name "20*" -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null

echo "백업 완료: $BACKUP_DIR"
```

---

## 8. 문제 해결

### 8.1 일반적인 배포 오류

#### Git 관련 오류
```bash
# SSL 인증서 오류
git config --global http.sslVerify false

# 권한 오류
sudo chown -R $USER:$USER /var/deploy/haeoreum

# Git 저장소 정리
cd /var/deploy/haeoreum/current
git reset --hard HEAD
git clean -fd
```

#### 빌드 오류
```bash
# Node.js 버전 확인
node --version
npm --version

# npm 캐시 정리
npm cache clean --force

# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
```

#### Tomcat 배포 오류
```bash
# Tomcat 로그 확인
sudo tail -f /opt/tomcat/logs/catalina.out

# 권한 문제 해결
sudo chown -R tomcat:tomcat /opt/tomcat/webapps/haeoreum

# 포트 충돌 확인
sudo netstat -tulpn | grep :8080
```

### 8.2 롤백 처리

#### 이전 버전으로 롤백
```bash
#!/bin/bash

# rollback.sh
# 이전 버전으로 롤백

DEPLOY_DIR="/var/deploy/haeoreum"
RELEASES_DIR="$DEPLOY_DIR/releases"
CURRENT_DIR="$DEPLOY_DIR/current"

# 이전 릴리즈 찾기
PREVIOUS_RELEASE=$(ls -1t $RELEASES_DIR | sed -n '2p')

if [ -n "$PREVIOUS_RELEASE" ]; then
    echo "이전 버전으로 롤백: $PREVIOUS_RELEASE"
    
    # 심볼릭 링크 업데이트
    rm $CURRENT_DIR
    ln -sf "$RELEASES_DIR/$PREVIOUS_RELEASE" $CURRENT_DIR
    
    # Tomcat 재배포
    sudo systemctl stop tomcat
    sudo rm -rf /opt/tomcat/webapps/haeoreum
    sudo mkdir -p /opt/tomcat/webapps/haeoreum/WEB-INF
    sudo cp -r $CURRENT_DIR/dist/public/* /opt/tomcat/webapps/haeoreum/
    sudo cp $CURRENT_DIR/web.xml /opt/tomcat/webapps/haeoreum/WEB-INF/
    sudo chown -R tomcat:tomcat /opt/tomcat/webapps/haeoreum
    sudo systemctl start tomcat
    
    echo "롤백 완료!"
else
    echo "롤백할 이전 버전이 없습니다."
fi
```

### 8.3 성능 최적화

#### Tomcat 튜닝
```bash
# setenv.sh 최적화
export CATALINA_OPTS="-Xms2048m -Xmx8192m -server"
export CATALINA_OPTS="$CATALINA_OPTS -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
export CATALINA_OPTS="$CATALINA_OPTS -XX:+UseStringDeduplication"
```

#### 데이터베이스 최적화
```sql
-- postgresql.conf 주요 설정
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 4MB
```

이 Git 기반 Tomcat 배포 가이드를 통해 버전 관리와 함께 체계적이고 안정적인 배포 시스템을 구축할 수 있습니다. 자동화된 CI/CD 파이프라인과 모니터링 시스템으로 운영 효율성도 크게 향상될 것입니다.