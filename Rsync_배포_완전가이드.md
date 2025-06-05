# 해오름인포텍 업무시스템 Rsync 배포 완전 가이드

## 목차
1. [Rsync 배포 개요](#1-rsync-배포-개요)
2. [Replit 환경 준비](#2-replit-환경-준비)
3. [배포 대상 환경 설정](#3-배포-대상-환경-설정)
4. [SSH 키 설정](#4-ssh-키-설정)
5. [Rsync 배포 스크립트](#5-rsync-배포-스크립트)
6. [실제 배포 과정](#6-실제-배포-과정)
7. [고급 Rsync 옵션](#7-고급-rsync-옵션)
8. [문제 해결 가이드](#8-문제-해결-가이드)
9. [자동화 및 모니터링](#9-자동화-및-모니터링)
10. [보안 강화](#10-보안-강화)

---

## 1. Rsync 배포 개요

### 1.1 Rsync 배포의 장점
- **증분 동기화**: 변경된 파일만 전송하여 시간 단축
- **압축 전송**: 네트워크 대역폭 효율적 사용
- **권한 유지**: 파일 권한과 타임스탬프 보존
- **중단 후 재개**: 전송 중단 시 이어서 진행 가능
- **실시간 진행률**: 상세한 전송 상태 표시

### 1.2 배포 아키텍처
```
┌─────────────────┐    rsync     ┌─────────────────┐
│   Replit 환경    │ ──────────→ │  로컬 컴퓨터     │
│   (소스 코드)    │             │  (중계 서버)    │
└─────────────────┘             └─────────────────┘
                                         │
                                    rsync over SSH
                                         ↓
                                ┌─────────────────┐
                                │   배포 서버      │
                                │  (Ubuntu/CentOS)│
                                └─────────────────┘
```

### 1.3 배포 플로우
1. **Replit → 로컬**: 소스 코드 다운로드 (Git 또는 압축파일)
2. **로컬 → 서버**: Rsync를 통한 파일 동기화
3. **서버**: 의존성 설치 및 빌드
4. **서버**: 서비스 시작 및 배포 완료

---

## 2. Replit 환경 준비

### 2.1 소스 코드 정리 및 압축

#### Git 저장소 설정 (권장 방법)
```bash
# Replit 터미널에서 실행
git init
git add .
git commit -m "Initial commit - 해오름인포텍 업무시스템"

# GitHub 저장소 생성 후 연결
git remote add origin https://github.com/your-username/haeoreum-system.git
git branch -M main
git push -u origin main
```

#### 압축 파일 생성 (대안 방법)
```bash
# Replit 터미널에서 실행
tar -czf haeoreum-source.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='logs' \
    --exclude='.replit*' \
    --exclude='replit.nix' \
    .

# 압축 파일 크기 확인
ls -lh haeoreum-source.tar.gz

# 압축 내용 확인
tar -tzf haeoreum-source.tar.gz | head -20
```

### 2.2 필수 파일 체크리스트

#### 핵심 파일 구조
```
haeoreum-project/
├── client/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── lib/
│   └── index.html
├── server/                    # Node.js 백엔드
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   ├── db.ts
│   └── vite.ts
├── shared/                    # 공통 스키마
│   └── schema.ts
├── package.json              # 의존성 정보
├── package-lock.json
├── web.xml                   # Tomcat 설정
├── ecosystem.config.js       # PM2 설정
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
└── .env.example             # 환경 변수 예시
```

#### 환경 설정 템플릿 생성
```bash
# .env.example 파일 생성
cat > .env.example << 'EOF'
# 프로덕션 환경 설정
NODE_ENV=production
PORT=8080

# 데이터베이스 설정
DATABASE_URL=postgresql://username:password@localhost:5432/haeoreum_db

# OpenAI API 설정
OPENAI_API_KEY=your_openai_api_key_here

# 기타 설정
TZ=Asia/Seoul
EOF
```

### 2.3 Replit에서 파일 다운로드

#### 방법 1: Git Clone (권장)
```bash
# 로컬 컴퓨터에서 실행
git clone https://github.com/your-username/haeoreum-system.git
cd haeoreum-system
```

#### 방법 2: 압축 파일 다운로드
1. **Files 패널에서 다운로드**:
   - 좌측 파일 탐색기에서 `haeoreum-source.tar.gz` 파일 찾기
   - 파일 우클릭 → "Download" 선택

2. **웹 URL로 직접 다운로드**:
   ```
   https://replit.com/@your-username/project-name/~/haeoreum-source.tar.gz
   ```

---

## 3. 배포 대상 환경 설정

### 3.1 Ubuntu/Debian 환경 설정

#### 시스템 업데이트 및 필수 패키지 설치
```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 도구 설치
sudo apt install -y \
    curl \
    wget \
    git \
    rsync \
    openssh-client \
    openssh-server \
    build-essential

# 설치 확인
rsync --version
ssh -V
```

#### Node.js 18+ 설치
```bash
# NodeSource 저장소 추가
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js 설치
sudo apt-get install -y nodejs

# 설치 확인
node --version
npm --version
```

#### Java 11 설치 (Tomcat용)
```bash
# OpenJDK 11 설치
sudo apt install -y openjdk-11-jdk

# JAVA_HOME 설정
echo 'export JAVA_HOME="/usr/lib/jvm/java-11-openjdk-amd64"' >> ~/.bashrc
source ~/.bashrc

# 설치 확인
java -version
echo $JAVA_HOME
```

#### PostgreSQL 설치
```bash
# PostgreSQL 설치
sudo apt install -y postgresql postgresql-contrib

# 서비스 시작
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 설치 확인
sudo systemctl status postgresql
```

### 3.2 CentOS/RHEL 환경 설정

#### 시스템 업데이트 및 필수 패키지 설치
```bash
# 시스템 업데이트
sudo yum update -y

# EPEL 저장소 설치
sudo yum install -y epel-release

# 필수 도구 설치
sudo yum install -y \
    curl \
    wget \
    git \
    rsync \
    openssh-clients \
    openssh-server \
    gcc-c++ \
    make

# 서비스 시작
sudo systemctl start sshd
sudo systemctl enable sshd
```

#### Node.js 18+ 설치
```bash
# NodeSource 저장소 추가
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# Node.js 설치
sudo yum install -y nodejs

# 설치 확인
node --version
npm --version
```

### 3.3 디렉토리 구조 준비
```bash
# 프로젝트 디렉토리 생성
sudo mkdir -p /var/www/haeoreum
sudo chown -R $USER:$USER /var/www/haeoreum

# 로그 디렉토리 생성
sudo mkdir -p /var/log/haeoreum
sudo chown -R $USER:$USER /var/log/haeoreum

# 백업 디렉토리 생성
sudo mkdir -p /backup/haeoreum
sudo chown -R $USER:$USER /backup/haeoreum
```

---

## 4. SSH 키 설정

### 4.1 SSH 키 생성 (로컬 컴퓨터)

#### RSA 키 생성
```bash
# SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "haeoreum-deploy@yourdomain.com"

# 키 저장 위치 (기본값 사용 권장)
# Enter file in which to save the key (/home/user/.ssh/id_rsa): [Enter]

# 패스프레이즈 설정 (보안을 위해 권장)
# Enter passphrase (empty for no passphrase): [your_passphrase]

# 생성된 키 확인
ls -la ~/.ssh/
cat ~/.ssh/id_rsa.pub
```

#### Ed25519 키 생성 (더 보안적)
```bash
# Ed25519 키 생성 (더 보안적이고 빠름)
ssh-keygen -t ed25519 -C "haeoreum-deploy@yourdomain.com"

# 생성된 키 확인
cat ~/.ssh/id_ed25519.pub
```

### 4.2 SSH 키 배포 (서버)

#### 공개키 복사
```bash
# ssh-copy-id 사용 (권장)
ssh-copy-id -i ~/.ssh/id_rsa.pub username@server-ip

# 또는 포트 지정
ssh-copy-id -i ~/.ssh/id_rsa.pub -p 2222 username@server-ip

# 수동으로 복사 (ssh-copy-id가 없는 경우)
cat ~/.ssh/id_rsa.pub | ssh username@server-ip "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

#### SSH 연결 테스트
```bash
# 키 기반 연결 테스트
ssh -i ~/.ssh/id_rsa username@server-ip "echo 'SSH 키 연결 성공'"

# 연결 설정 저장 (~/.ssh/config)
cat >> ~/.ssh/config << EOF
Host haeoreum-server
    HostName server-ip
    User username
    Port 22
    IdentityFile ~/.ssh/id_rsa
    IdentitiesOnly yes
EOF

# 저장된 설정으로 연결 테스트
ssh haeoreum-server "echo 'SSH 설정 연결 성공'"
```

### 4.3 SSH 보안 강화

#### 서버 SSH 설정 강화
```bash
# SSH 설정 파일 백업
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# SSH 설정 수정
sudo nano /etc/ssh/sshd_config
```

권장 SSH 설정:
```bash
# 기본 보안 설정
Port 22
Protocol 2
PermitRootLogin no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PasswordAuthentication no
PermitEmptyPasswords no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# 특정 사용자만 허용
AllowUsers your-username

# 특정 IP에서만 접근 허용 (선택사항)
# AllowUsers your-username@192.168.1.0/24
```

SSH 서비스 재시작:
```bash
# 설정 문법 확인
sudo sshd -t

# SSH 서비스 재시작
sudo systemctl restart sshd

# 새 터미널에서 연결 테스트 (기존 세션 유지)
ssh haeoreum-server
```

---

## 5. Rsync 배포 스크립트

### 5.1 기본 배포 스크립트 (deploy-rsync.sh)

```bash
#!/bin/bash

# 해오름인포텍 업무시스템 Rsync 배포 스크립트
# 버전: 2.0
# 작성일: $(date +%Y-%m-%d)

set -e  # 오류 발생 시 스크립트 중단

# ==================== 설정 변수 ====================
# 로컬 환경 설정
LOCAL_SOURCE="$(pwd)"                    # 현재 디렉토리
PROJECT_NAME="haeoreum"

# 원격 서버 설정
REMOTE_SERVER="username@server-ip"       # 서버 주소
REMOTE_DIR="/var/www/$PROJECT_NAME"      # 배포 디렉토리
SSH_KEY="~/.ssh/id_rsa"                  # SSH 키 경로
SSH_PORT="22"                            # SSH 포트

# rsync 옵션
RSYNC_OPTIONS="--archive --verbose --compress --progress --delete"
EXCLUDE_PATTERNS=(
    'node_modules/'
    '.git/'
    'dist/'
    'logs/'
    '*.log'
    '.replit*'
    'replit.nix'
    '.env'
    'backup-*'
    '*.tar.gz'
    '*.zip'
)

# ==================== 색상 정의 ====================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $(date '+%H:%M:%S') $1"
}

# ==================== 유틸리티 함수 ====================
show_banner() {
    echo -e "${CYAN}"
    echo "=================================================="
    echo "  해오름인포텍 업무시스템 Rsync 배포 스크립트"
    echo "=================================================="
    echo -e "${NC}"
}

confirm_deployment() {
    echo ""
    echo "배포 설정 확인:"
    echo "- 소스: $LOCAL_SOURCE"
    echo "- 대상: $REMOTE_SERVER:$REMOTE_DIR"
    echo "- SSH 키: $SSH_KEY"
    echo ""
    read -p "배포를 진행하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "배포가 취소되었습니다."
        exit 0
    fi
}

cleanup_on_error() {
    log_error "배포 중 오류가 발생했습니다."
    log_info "이전 상태로 복구를 위해 서버 관리자에게 문의하세요."
    exit 1
}

# ==================== 검증 함수 ====================
validate_local_environment() {
    log_step "로컬 환경 검증 중..."
    
    # 소스 디렉토리 확인
    if [ ! -d "$LOCAL_SOURCE" ]; then
        log_error "소스 디렉토리가 존재하지 않습니다: $LOCAL_SOURCE"
        exit 1
    fi
    
    # package.json 확인
    if [ ! -f "$LOCAL_SOURCE/package.json" ]; then
        log_error "package.json 파일이 없습니다. 올바른 프로젝트 디렉토리인지 확인하세요."
        exit 1
    fi
    
    # 필수 명령어 확인
    for cmd in rsync ssh; do
        if ! command -v $cmd >/dev/null 2>&1; then
            log_error "$cmd 명령어를 찾을 수 없습니다. 설치해주세요."
            exit 1
        fi
    done
    
    log_success "로컬 환경 검증 완료"
}

validate_remote_connection() {
    log_step "서버 연결 테스트 중..."
    
    # SSH 키 파일 확인
    if [ ! -f "${SSH_KEY/#\~/$HOME}" ]; then
        log_error "SSH 키 파일이 존재하지 않습니다: $SSH_KEY"
        exit 1
    fi
    
    # 서버 연결 테스트
    if ! ssh -p $SSH_PORT -i $SSH_KEY -o ConnectTimeout=10 -o BatchMode=yes $REMOTE_SERVER "echo '연결 성공'" >/dev/null 2>&1; then
        log_error "서버 연결 실패. SSH 설정을 확인하세요."
        log_info "연결 테스트: ssh -p $SSH_PORT -i $SSH_KEY $REMOTE_SERVER"
        exit 1
    fi
    
    log_success "서버 연결 테스트 완료"
}

# ==================== 배포 함수 ====================
prepare_remote_directory() {
    log_step "서버 디렉토리 준비 중..."
    
    ssh -p $SSH_PORT -i $SSH_KEY $REMOTE_SERVER << EOF
        # 기존 디렉토리 백업
        if [ -d '$REMOTE_DIR' ]; then
            BACKUP_DIR='${REMOTE_DIR}.backup.\$(date +%Y%m%d_%H%M%S)'
            echo "기존 디렉토리 백업: \$BACKUP_DIR"
            sudo mv '$REMOTE_DIR' "\$BACKUP_DIR"
        fi
        
        # 새 디렉토리 생성
        sudo mkdir -p '$REMOTE_DIR'
        sudo chown -R \$USER:\$USER '$REMOTE_DIR'
        
        # 로그 디렉토리 생성
        mkdir -p '$REMOTE_DIR/logs'
        
        echo "서버 디렉토리 준비 완료"
EOF
    
    log_success "서버 디렉토리 준비 완료"
}

sync_files() {
    log_step "파일 동기화 시작..."
    
    # exclude 패턴을 rsync 옵션으로 변환
    local exclude_opts=""
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        exclude_opts="$exclude_opts --exclude='$pattern'"
    done
    
    # rsync 실행
    eval rsync $RSYNC_OPTIONS \
        $exclude_opts \
        -e \"ssh -p $SSH_PORT -i $SSH_KEY\" \
        \"$LOCAL_SOURCE/\" \
        \"$REMOTE_SERVER:$REMOTE_DIR/\"
    
    if [ $? -eq 0 ]; then
        log_success "파일 동기화 완료"
    else
        log_error "파일 동기화 실패"
        exit 1
    fi
}

build_and_deploy() {
    log_step "서버에서 빌드 및 배포 시작..."
    
    ssh -p $SSH_PORT -i $SSH_KEY $REMOTE_SERVER << 'EOF'
        cd /var/www/haeoreum
        
        # 현재 디렉토리 확인
        echo "현재 작업 디렉토리: $(pwd)"
        echo "디렉토리 내용:"
        ls -la
        
        # 환경 변수 파일 확인 및 생성
        if [ ! -f ".env" ]; then
            echo "환경 변수 파일(.env)을 생성합니다."
            if [ -f ".env.example" ]; then
                cp .env.example .env
                echo "환경 변수 파일을 수정해주세요: nano .env"
            else
                echo "NODE_ENV=production" > .env
                echo "PORT=8080" >> .env
                echo "환경 변수 파일이 생성되었습니다. 설정을 완료해주세요."
            fi
        fi
        
        # Node.js 버전 확인
        echo "Node.js 버전: $(node --version)"
        echo "NPM 버전: $(npm --version)"
        
        # package-lock.json 확인
        if [ -f "package-lock.json" ]; then
            echo "의존성 설치 중 (npm ci)..."
            npm ci
        else
            echo "의존성 설치 중 (npm install)..."
            npm install
        fi
        
        # TypeScript 컴파일 확인
        if command -v npx >/dev/null 2>&1; then
            echo "TypeScript 컴파일 확인 중..."
            npm run check || echo "TypeScript 체크 완료"
        fi
        
        # 프로젝트 빌드
        echo "프로젝트 빌드 시작..."
        npm run build
        
        # 빌드 결과 확인
        if [ -d "dist" ]; then
            echo "빌드 성공! 결과:"
            ls -la dist/
        else
            echo "빌드 실패: dist 디렉토리가 생성되지 않았습니다."
            exit 1
        fi
        
        echo "서버 빌드 및 배포 완료!"
EOF
    
    if [ $? -eq 0 ]; then
        log_success "서버 빌드 및 배포 완료"
    else
        log_error "서버 빌드 또는 배포 실패"
        exit 1
    fi
}

show_deployment_summary() {
    local end_time=$(date)
    local server_ip=$(echo $REMOTE_SERVER | cut -d'@' -f2)
    
    echo ""
    echo -e "${CYAN}=================================================="
    echo "             배포 완료 요약"
    echo "==================================================${NC}"
    echo "배포 시간: $end_time"
    echo "소스 위치: $LOCAL_SOURCE"
    echo "배포 대상: $REMOTE_SERVER:$REMOTE_DIR"
    echo "접속 URL: http://$server_ip:8080/haeoreum"
    echo ""
    echo -e "${YELLOW}다음 단계:${NC}"
    echo "1. 서버 접속: ssh -p $SSH_PORT -i $SSH_KEY $REMOTE_SERVER"
    echo "2. 환경 변수 설정: nano $REMOTE_DIR/.env"
    echo "3. 데이터베이스 스키마 적용: cd $REMOTE_DIR && npm run db:push"
    echo "4. Tomcat 웹앱 배포 (필요시)"
    echo "5. PM2로 백엔드 서버 시작 (필요시)"
    echo ""
    echo -e "${GREEN}배포가 성공적으로 완료되었습니다!${NC}"
    echo ""
}

# ==================== 메인 실행 함수 ====================
main() {
    # 에러 트랩 설정
    trap cleanup_on_error ERR
    
    local start_time=$(date)
    
    # 배너 표시
    show_banner
    
    # 사전 검증
    validate_local_environment
    validate_remote_connection
    
    # 배포 확인
    confirm_deployment
    
    # 배포 실행
    log_info "배포 시작: $start_time"
    
    prepare_remote_directory
    sync_files
    build_and_deploy
    
    # 배포 완료 요약
    show_deployment_summary
}

# ==================== 스크립트 실행 ====================
# 스크립트가 직접 실행될 때만 main 함수 호출
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

### 5.2 스크립트 실행 권한 부여
```bash
# 실행 권한 부여
chmod +x deploy-rsync.sh

# 스크립트 테스트 (dry-run)
./deploy-rsync.sh --dry-run  # 실제 구현시 이 옵션 추가
```

### 5.3 고급 배포 스크립트 (deploy-rsync-advanced.sh)

```bash
#!/bin/bash

# 고급 Rsync 배포 스크립트 (롤백 기능 포함)

# 추가 기능들
ENABLE_ROLLBACK=true
ENABLE_HEALTH_CHECK=true
HEALTH_CHECK_URL="http://server-ip:8080/haeoreum"
MAX_BACKUP_COUNT=5

# 롤백 함수
rollback_deployment() {
    log_warning "배포 롤백을 시작합니다..."
    
    ssh -p $SSH_PORT -i $SSH_KEY $REMOTE_SERVER << 'EOF'
        cd /var/www
        
        # 최신 백업 찾기
        LATEST_BACKUP=$(ls -td haeoreum.backup.* 2>/dev/null | head -1)
        
        if [ -n "$LATEST_BACKUP" ]; then
            echo "롤백 대상: $LATEST_BACKUP"
            
            # 현재 실패한 배포 임시 저장
            mv haeoreum haeoreum.failed.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
            
            # 백업으로 복원
            mv "$LATEST_BACKUP" haeoreum
            
            echo "롤백 완료"
        else
            echo "롤백할 백업이 없습니다."
        fi
EOF
    
    log_success "롤백이 완료되었습니다."
}

# 헬스 체크 함수
health_check() {
    log_step "배포 상태 확인 중..."
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
            log_success "헬스 체크 통과 (시도 $attempt/$max_attempts)"
            return 0
        fi
        
        log_info "헬스 체크 실패 - 재시도 $attempt/$max_attempts"
        sleep 5
        ((attempt++))
    done
    
    log_error "헬스 체크 실패"
    return 1
}

# 백업 정리 함수
cleanup_old_backups() {
    log_step "오래된 백업 정리 중..."
    
    ssh -p $SSH_PORT -i $SSH_KEY $REMOTE_SERVER << EOF
        cd /var/www
        
        # 백업 개수 확인
        BACKUP_COUNT=\$(ls -1d haeoreum.backup.* 2>/dev/null | wc -l)
        
        if [ \$BACKUP_COUNT -gt $MAX_BACKUP_COUNT ]; then
            echo "백업 개수: \$BACKUP_COUNT (최대: $MAX_BACKUP_COUNT)"
            
            # 가장 오래된 백업들 삭제
            ls -td haeoreum.backup.* | tail -n +\$((MAX_BACKUP_COUNT + 1)) | xargs rm -rf
            
            echo "오래된 백업 정리 완료"
        fi
EOF
}
```

---

## 6. 실제 배포 과정

### 6.1 초기 설정

#### 스크립트 설정 파일 생성
```bash
# 배포 설정 파일 생성
cat > deploy-config.sh << 'EOF'
#!/bin/bash

# 해오름인포텍 배포 설정 파일

# 서버 정보
export REMOTE_SERVER="ubuntu@your-server-ip"
export REMOTE_DIR="/var/www/haeoreum"
export SSH_KEY="~/.ssh/id_rsa"
export SSH_PORT="22"

# 프로젝트 정보
export PROJECT_NAME="haeoreum"
export LOCAL_SOURCE="$(pwd)"

# 배포 옵션
export ENABLE_BACKUP=true
export ENABLE_HEALTH_CHECK=true
export HEALTH_CHECK_URL="http://your-server-ip:8080/haeoreum"

echo "배포 설정이 로드되었습니다."
echo "대상 서버: $REMOTE_SERVER"
echo "배포 디렉토리: $REMOTE_DIR"
EOF

# 설정 파일 권한 설정
chmod +x deploy-config.sh

# 설정 로드
source deploy-config.sh
```

### 6.2 단계별 배포 실행

#### 1단계: 사전 검증
```bash
# 로컬 환경 확인
echo "현재 디렉토리: $(pwd)"
ls -la package.json

# 서버 연결 확인
ssh $REMOTE_SERVER "echo 'SSH 연결 성공: $(date)'"

# 디스크 공간 확인
ssh $REMOTE_SERVER "df -h /"
```

#### 2단계: 배포 실행
```bash
# 배포 스크립트 실행
./deploy-rsync.sh

# 또는 설정과 함께 실행
source deploy-config.sh && ./deploy-rsync.sh
```

#### 3단계: 배포 후 설정
```bash
# 서버 접속
ssh $REMOTE_SERVER

# 배포 디렉토리로 이동
cd /var/www/haeoreum

# 환경 변수 설정
nano .env
```

환경 변수 예시:
```bash
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://haeoreum_user:your_password@localhost:5432/haeoreum_db
OPENAI_API_KEY=your_openai_api_key_here
TZ=Asia/Seoul
```

#### 4단계: 데이터베이스 설정
```bash
# 데이터베이스 스키마 적용
npm run db:push

# 연결 테스트
psql $DATABASE_URL -c "SELECT 1;"
```

### 6.3 서비스 시작

#### Tomcat 웹앱 배포
```bash
# Tomcat 웹앱 디렉토리에 복사
sudo cp -r dist/public/* /opt/tomcat/webapps/haeoreum/
sudo cp web.xml /opt/tomcat/webapps/haeoreum/WEB-INF/
sudo chown -R tomcat:tomcat /opt/tomcat/webapps/haeoreum

# Tomcat 재시작
sudo systemctl restart tomcat
```

#### PM2로 백엔드 서버 시작
```bash
# PM2로 백엔드 시작
pm2 start ecosystem.config.js

# 자동 시작 설정
pm2 startup
pm2 save

# 상태 확인
pm2 status
```

---

## 7. 고급 Rsync 옵션

### 7.1 성능 최적화 옵션

#### 대역폭 제한
```bash
# 1MB/s로 대역폭 제한
rsync -avz --progress --bwlimit=1000 \
    -e "ssh -p $SSH_PORT -i $SSH_KEY" \
    "$LOCAL_SOURCE/" \
    "$REMOTE_SERVER:$REMOTE_DIR/"
```

#### 압축 레벨 조정
```bash
# 압축 레벨 설정 (1-9, 기본값 6)
rsync -avz --compress-level=9 \
    -e "ssh -p $SSH_PORT -i $SSH_KEY" \
    "$LOCAL_SOURCE/" \
    "$REMOTE_SERVER:$REMOTE_DIR/"
```

#### 병렬 처리 (rsync 3.2.0+)
```bash
# 여러 프로세스로 병렬 전송
rsync -avz --progress --inplace --whole-file \
    -e "ssh -p $SSH_PORT -i $SSH_KEY" \
    "$LOCAL_SOURCE/" \
    "$REMOTE_SERVER:$REMOTE_DIR/"
```

### 7.2 선택적 동기화

#### 특정 파일만 동기화
```bash
# 특정 디렉토리만 포함
rsync -avz --progress \
    --include='client/' \
    --include='client/**' \
    --include='server/' \
    --include='server/**' \
    --include='shared/' \
    --include='shared/**' \
    --include='package*.json' \
    --include='*.config.*' \
    --exclude='*' \
    -e "ssh -p $SSH_PORT -i $SSH_KEY" \
    "$LOCAL_SOURCE/" \
    "$REMOTE_SERVER:$REMOTE_DIR/"
```

#### 파일 크기 기반 필터링
```bash
# 10MB 이하 파일만 동기화
rsync -avz --progress --max-size=10M \
    -e "ssh -p $SSH_PORT -i $SSH_KEY" \
    "$LOCAL_SOURCE/" \
    "$REMOTE_SERVER:$REMOTE_DIR/"
```

### 7.3 백업 및 버전 관리

#### 증분 백업
```bash
# 백업 디렉토리에 변경된 파일 저장
rsync -avz --progress \
    --backup \
    --backup-dir="/backup/haeoreum/$(date +%Y%m%d_%H%M%S)" \
    -e "ssh -p $SSH_PORT -i $SSH_KEY" \
    "$LOCAL_SOURCE/" \
    "$REMOTE_SERVER:$REMOTE_DIR/"
```

#### 링크 기반 백업 (하드링크)
```bash
# 이전 백업과 동일한 파일은 하드링크로 연결
rsync -avz --progress \
    --link-dest="/backup/haeoreum/latest" \
    -e "ssh -p $SSH_PORT -i $SSH_KEY" \
    "$LOCAL_SOURCE/" \
    "$REMOTE_SERVER:/backup/haeoreum/$(date +%Y%m%d_%H%M%S)/"
```

---

## 8. 문제 해결 가이드

### 8.1 연결 관련 문제

#### SSH 연결 실패
```bash
# 상세한 SSH 디버그 정보
ssh -vvv -p $SSH_PORT -i $SSH_KEY $REMOTE_SERVER

# SSH 에이전트 확인
ssh-add -l

# SSH 키 권한 확인
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
chmod 700 ~/.ssh
```

#### 포트 연결 문제
```bash
# 포트 연결 테스트
telnet server-ip 22

# 방화벽 상태 확인 (서버에서)
sudo ufw status
sudo iptables -L

# 포트 열기 (서버에서)
sudo ufw allow 22/tcp
```

### 8.2 권한 관련 문제

#### 파일 권한 오류
```bash
# 서버에서 권한 확인
ssh $REMOTE_SERVER "ls -la /var/www/"

# 권한 수정
ssh $REMOTE_SERVER "sudo chown -R \$USER:\$USER /var/www/haeoreum"

# 디렉토리 권한 확인
ssh $REMOTE_SERVER "ls -ld /var/www/haeoreum"
```

#### sudo 권한 문제
```bash
# 사용자의 sudo 권한 확인
ssh $REMOTE_SERVER "sudo -l"

# sudoers 그룹 확인
ssh $REMOTE_SERVER "groups \$USER"
```

### 8.3 rsync 특정 오류

#### "No space left on device" 오류
```bash
# 디스크 공간 확인
ssh $REMOTE_SERVER "df -h"

# 임시 파일 정리
ssh $REMOTE_SERVER "sudo rm -rf /tmp/* /var/tmp/*"

# 로그 파일 정리
ssh $REMOTE_SERVER "sudo find /var/log -name '*.log' -mtime +7 -delete"
```

#### "Permission denied" 오류
```bash
# SELinux 확인 (CentOS/RHEL)
ssh $REMOTE_SERVER "getenforce"

# SELinux 컨텍스트 수정 (필요시)
ssh $REMOTE_SERVER "sudo setsebool -P rsync_full_access on"
```

#### 파일 전송 중단
```bash
# 부분 전송 파일 확인
ssh $REMOTE_SERVER "find $REMOTE_DIR -name '.~tmp~*'"

# 부분 전송 파일 정리
ssh $REMOTE_SERVER "find $REMOTE_DIR -name '.~tmp~*' -delete"

# 재시작 가능한 rsync 옵션
rsync -avz --progress --partial --partial-dir=.rsync-partial \
    -e "ssh -p $SSH_PORT -i $SSH_KEY" \
    "$LOCAL_SOURCE/" \
    "$REMOTE_SERVER:$REMOTE_DIR/"
```

### 8.4 성능 문제

#### 느린 전송 속도
```bash
# 네트워크 속도 테스트
ssh $REMOTE_SERVER "curl -s https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python -"

# rsync 통계 정보 확인
rsync -avz --progress --stats \
    -e "ssh -p $SSH_PORT -i $SSH_KEY" \
    "$LOCAL_SOURCE/" \
    "$REMOTE_SERVER:$REMOTE_DIR/"

# SSH 압축 비활성화 (고속 네트워크에서)
rsync -av --progress \
    -e "ssh -p $SSH_PORT -i $SSH_KEY -o Compression=no" \
    "$LOCAL_SOURCE/" \
    "$REMOTE_SERVER:$REMOTE_DIR/"
```

#### 메모리 부족
```bash
# 서버 메모리 확인
ssh $REMOTE_SERVER "free -h"

# rsync 메모리 사용량 제한
rsync -avz --progress --max-size=100M \
    -e "ssh -p $SSH_PORT -i $SSH_KEY" \
    "$LOCAL_SOURCE/" \
    "$REMOTE_SERVER:$REMOTE_DIR/"
```

---

## 9. 자동화 및 모니터링

### 9.1 자동 배포 스케줄링

#### Cron을 사용한 정기 배포
```bash
# crontab 편집
crontab -e

# 매일 새벽 2시에 자동 배포
0 2 * * * /path/to/deploy-rsync.sh > /var/log/haeoreum-deploy.log 2>&1

# 매주 일요일 새벽 3시에 전체 백업과 함께 배포
0 3 * * 0 /path/to/deploy-rsync.sh --full-backup >> /var/log/haeoreum-deploy.log 2>&1
```

#### Git 훅을 사용한 자동 배포
```bash
# Git 저장소의 post-receive 훅 설정
cat > .git/hooks/post-receive << 'EOF'
#!/bin/bash

echo "Git push 감지 - 자동 배포 시작"

# 작업 디렉토리로 이동
cd /path/to/haeoreum-project

# 최신 코드 받기
git pull origin main

# 자동 배포 실행
./deploy-rsync.sh --auto

echo "자동 배포 완료"
EOF

chmod +x .git/hooks/post-receive
```

### 9.2 배포 모니터링

#### 배포 상태 모니터링 스크립트
```bash
#!/bin/bash

# deploy-monitor.sh
# 배포 상태 모니터링 스크립트

MONITOR_URL="http://server-ip:8080/haeoreum"
LOG_FILE="/var/log/haeoreum-monitor.log"
ALERT_EMAIL="admin@company.com"

check_deployment() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" $MONITOR_URL)
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ "$response" = "200" ]; then
        echo "[$timestamp] OK - 서비스 정상 작동 (HTTP $response)" >> $LOG_FILE
        return 0
    else
        echo "[$timestamp] ERROR - 서비스 오류 (HTTP $response)" >> $LOG_FILE
        
        # 이메일 알림 발송
        echo "해오름인포텍 시스템 오류 발생: HTTP $response" | \
            mail -s "시스템 알림: 서비스 오류" $ALERT_EMAIL
        
        return 1
    fi
}

# 5분마다 체크
while true; do
    check_deployment
    sleep 300
done
```

#### 배포 로그 분석
```bash
# 배포 로그 실시간 모니터링
tail -f /var/log/haeoreum-deploy.log

# 배포 성공/실패 통계
grep -c "SUCCESS" /var/log/haeoreum-deploy.log
grep -c "ERROR" /var/log/haeoreum-deploy.log

# 최근 10회 배포 상태
tail -20 /var/log/haeoreum-deploy.log | grep -E "(SUCCESS|ERROR)"
```

### 9.3 알림 시스템

#### Slack 알림 설정
```bash
# Slack 웹훅을 사용한 알림 함수
send_slack_notification() {
    local message="$1"
    local webhook_url="YOUR_SLACK_WEBHOOK_URL"
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$message\"}" \
        $webhook_url
}

# 배포 성공 알림
send_slack_notification "✅ 해오름인포텍 시스템 배포 성공 ($(date))"

# 배포 실패 알림
send_slack_notification "❌ 해오름인포텍 시스템 배포 실패 ($(date))"
```

#### 이메일 알림 설정
```bash
# 이메일 알림 함수
send_email_notification() {
    local subject="$1"
    local message="$2"
    local email="admin@company.com"
    
    echo "$message" | mail -s "$subject" $email
}

# 사용 예시
send_email_notification "배포 완료" "해오름인포텍 시스템이 성공적으로 배포되었습니다."
```

---

## 10. 보안 강화

### 10.1 SSH 보안 설정

#### SSH 키 회전
```bash
# 새로운 SSH 키 생성
ssh-keygen -t ed25519 -f ~/.ssh/haeoreum_deploy_new -C "haeoreum-deploy-new@$(date +%Y%m%d)"

# 새 키를 서버에 추가
ssh-copy-id -i ~/.ssh/haeoreum_deploy_new.pub $REMOTE_SERVER

# 새 키로 연결 테스트
ssh -i ~/.ssh/haeoreum_deploy_new $REMOTE_SERVER "echo 'New key works'"

# 기존 키 비활성화 (서버에서)
ssh $REMOTE_SERVER "grep -v 'old-key-comment' ~/.ssh/authorized_keys > ~/.ssh/authorized_keys.new && mv ~/.ssh/authorized_keys.new ~/.ssh/authorized_keys"
```

#### SSH 접근 제한
```bash
# IP 기반 접근 제한 설정
cat >> ~/.ssh/config << EOF
Host haeoreum-production
    HostName production-server-ip
    User deploy-user
    Port 22
    IdentityFile ~/.ssh/haeoreum_deploy
    IdentitiesOnly yes
    # 특정 IP에서만 접근 허용
    ProxyCommand none
EOF
```

### 10.2 rsync 보안 설정

#### rsyncd 데몬 설정 (서버)
```bash
# rsyncd.conf 설정
sudo cat > /etc/rsyncd.conf << 'EOF'
# Global settings
uid = rsync
gid = rsync
use chroot = yes
max connections = 4
syslog facility = local5
pid file = /var/run/rsyncd.pid

# Module for haeoreum deployment
[haeoreum]
    path = /var/www/haeoreum
    comment = Haeoreum deployment module
    read only = no
    list = no
    uid = www-data
    gid = www-data
    auth users = deploy
    secrets file = /etc/rsyncd.secrets
    hosts allow = client-ip/32
    hosts deny = *
EOF

# 인증 파일 생성
sudo echo "deploy:secure_password" > /etc/rsyncd.secrets
sudo chmod 600 /etc/rsyncd.secrets

# rsyncd 서비스 시작
sudo systemctl enable rsync
sudo systemctl start rsync
```

### 10.3 배포 감사 로깅

#### 배포 활동 로깅
```bash
# 배포 로그 감사 함수
audit_deployment() {
    local action="$1"
    local result="$2"
    local user=$(whoami)
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local client_ip=$(curl -s ifconfig.me)
    
    echo "[$timestamp] USER:$user IP:$client_ip ACTION:$action RESULT:$result" >> /var/log/haeoreum-audit.log
}

# 사용 예시
audit_deployment "DEPLOY_START" "SUCCESS"
audit_deployment "FILE_SYNC" "SUCCESS"
audit_deployment "BUILD" "FAILED"
```

#### 로그 보안 설정
```bash
# 로그 파일 권한 설정
sudo chmod 640 /var/log/haeoreum-*.log
sudo chown root:adm /var/log/haeoreum-*.log

# 로그 로테이션 설정
sudo cat > /etc/logrotate.d/haeoreum << 'EOF'
/var/log/haeoreum-*.log {
    daily
    missingok
    rotate 90
    compress
    delaycompress
    notifempty
    create 640 root adm
    postrotate
        # 로그 로테이션 후 알림
        echo "Haeoreum logs rotated on $(date)" | mail -s "Log Rotation" admin@company.com
    endscript
}
EOF
```

이 완전한 Rsync 배포 가이드는 Replit 환경에서 개발한 프로젝트를 안전하고 효율적으로 배포할 수 있는 모든 과정을 포함하고 있습니다. 초기 설정부터 고급 자동화까지 단계별로 따라하면 프로덕션 환경에서 안정적인 배포 시스템을 구축할 수 있습니다.