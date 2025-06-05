#!/bin/bash

# 해오름인포텍 업무시스템 - macOS Tomcat 서버 시작 스크립트

set -e

echo "============================================"
echo "🌅 해오름인포텍 업무시스템 macOS 서버 시작"
echo "============================================"

# macOS 버전 및 아키텍처 감지
MACOS_VERSION=$(sw_vers -productVersion)
ARCH=$(uname -m)

if [[ "$ARCH" == "arm64" ]]; then
    BREW_PREFIX="/opt/homebrew"
    echo "✅ Apple Silicon (M1/M2) Mac 감지"
else
    BREW_PREFIX="/usr/local"
    echo "✅ Intel Mac 감지"
fi

# 설정값
PROJECT_DIR="$(pwd)"
TOMCAT_PORT=8080
API_PORT=3000
TOMCAT_HOME="$BREW_PREFIX/var/lib/tomcat@9"

# 환경 확인
check_requirements() {
    echo "macOS 환경 요구사항 확인 중..."
    
    # macOS 버전 확인
    echo "macOS 버전: $MACOS_VERSION"
    
    # Homebrew 확인
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew가 설치되지 않았습니다."
        echo "다음 명령어로 설치하세요:"
        echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
        exit 1
    fi
    
    # Java 확인
    if ! command -v java &> /dev/null; then
        echo "❌ Java가 설치되지 않았습니다. 'brew install openjdk@11'로 설치하세요."
        exit 1
    fi
    
    # Node.js 확인
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js가 설치되지 않았습니다. 'brew install node'로 설치하세요."
        exit 1
    fi
    
    # Tomcat 확인
    if [ ! -d "$TOMCAT_HOME" ]; then
        echo "❌ Tomcat이 설치되지 않았습니다. 'brew install tomcat@9'로 설치하세요."
        exit 1
    fi
    
    echo "✅ 환경 요구사항 충족"
}

# Homebrew 서비스 상태 확인
check_homebrew_services() {
    echo "Homebrew 서비스 상태 확인 중..."
    
    # PostgreSQL 상태 확인
    if brew services list | grep -q "postgresql.*started"; then
        echo "✅ PostgreSQL 서비스 실행 중"
    else
        echo "⚠️ PostgreSQL 서비스 시작 중..."
        brew services start postgresql@14
    fi
    
    # Tomcat 상태 확인
    if brew services list | grep -q "tomcat.*started"; then
        echo "✅ Tomcat 서비스 실행 중"
    else
        echo "⚠️ Tomcat 서비스 시작 중..."
        brew services start tomcat@9
    fi
}

# 의존성 설치
install_dependencies() {
    echo "의존성 설치 중..."
    
    if [ ! -d "node_modules" ]; then
        npm install
    else
        echo "✅ 의존성이 이미 설치되어 있습니다."
    fi
    
    # PM2 전역 설치 확인
    if ! command -v pm2 &> /dev/null; then
        echo "PM2 설치 중..."
        npm install -g pm2
    fi
}

# 프로젝트 빌드
build_project() {
    echo "프로젝트 빌드 중..."
    
    # TypeScript 컴파일
    npm run build
    
    if [ -d "dist" ] && [ -d "dist/public" ]; then
        echo "✅ 빌드 성공"
    else
        echo "❌ 빌드 실패"
        exit 1
    fi
}

# 환경변수 설정
setup_environment() {
    echo "환경변수 설정 중..."
    
    if [ ! -f ".env" ]; then
        cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://haeoreum_user:haeoreum2024!@localhost:5432/haeoreum_db
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
TZ=Asia/Seoul
EOF
        echo "⚠️ .env 파일을 생성했습니다. API 키를 설정해주세요."
    else
        echo "✅ .env 파일이 이미 존재합니다."
    fi
}

# macOS Tomcat 웹앱 배포
setup_macos_tomcat() {
    echo "macOS Tomcat 웹앱 배포 중..."
    
    # 웹앱 디렉토리 생성
    WEBAPP_DIR="$TOMCAT_HOME/webapps/haeoreum"
    
    if [ -d "$WEBAPP_DIR" ]; then
        echo "기존 웹앱 백업 중..."
        sudo mv "$WEBAPP_DIR" "$WEBAPP_DIR.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    sudo mkdir -p "$WEBAPP_DIR/WEB-INF"
    
    # 빌드된 파일 복사
    sudo cp -r dist/public/* "$WEBAPP_DIR/"
    sudo cp web.xml "$WEBAPP_DIR/WEB-INF/"
    
    # 권한 설정 (macOS 특화)
    sudo chown -R $(whoami):staff "$WEBAPP_DIR"
    
    echo "✅ macOS Tomcat 웹앱 배포 완료"
}

# 백엔드 API 서버 시작
start_api_server() {
    echo "백엔드 API 서버 시작 중..."
    
    # 기존 프로세스 중지
    pm2 stop haeoreum-api 2>/dev/null || echo "기존 API 서버가 실행되지 않고 있습니다."
    
    # API 서버 시작
    pm2 start ecosystem.config.js
    
    echo "✅ 백엔드 API 서버 시작됨 (포트: $API_PORT)"
}

# Tomcat 서버 재시작
restart_tomcat_server() {
    echo "Tomcat 서버 재시작 중..."
    
    # Homebrew 서비스로 Tomcat 재시작
    brew services restart tomcat@9
    
    echo "✅ Tomcat 서버 재시작됨 (포트: $TOMCAT_PORT)"
}

# 서비스 상태 확인
check_services() {
    echo "서비스 상태 확인 중..."
    
    sleep 5
    
    # Homebrew 서비스 상태
    echo "=== Homebrew 서비스 상태 ==="
    brew services list | grep -E "(tomcat|postgresql)"
    
    # PM2 상태 확인
    echo "=== PM2 프로세스 상태 ==="
    pm2 status
    
    # 포트 확인
    if lsof -i :$TOMCAT_PORT | grep -q LISTEN; then
        echo "✅ Tomcat 서버 (포트 $TOMCAT_PORT) 실행 중"
    else
        echo "❌ Tomcat 서버 시작 실패"
    fi
    
    if lsof -i :$API_PORT | grep -q LISTEN; then
        echo "✅ API 서버 (포트 $API_PORT) 실행 중"
    else
        echo "❌ API 서버 시작 실패"
    fi
    
    # 접속 테스트
    echo "접속 테스트 중..."
    
    if curl -f -s http://localhost:$TOMCAT_PORT/haeoreum >/dev/null 2>&1; then
        echo "✅ 웹사이트 접속 성공"
    else
        echo "⚠️ 웹사이트 접속 확인 필요"
    fi
    
    if curl -f -s http://localhost:$API_PORT/api/projects >/dev/null 2>&1; then
        echo "✅ API 서버 접속 성공"
    else
        echo "⚠️ API 서버 접속 확인 필요"
    fi
}

# macOS 특화 설정
setup_macos_specific() {
    echo "macOS 특화 설정 적용 중..."
    
    # 보안 설정으로 인한 실행 제한 해제
    if [ -f "start-macos-tomcat.sh" ]; then
        xattr -d com.apple.quarantine start-macos-tomcat.sh 2>/dev/null || true
    fi
    
    # LaunchAgent 설정 (선택사항)
    setup_launch_agent
    
    echo "✅ macOS 특화 설정 완료"
}

# LaunchAgent 설정 (부팅시 자동 시작)
setup_launch_agent() {
    LAUNCH_AGENT_DIR="$HOME/Library/LaunchAgents"
    PLIST_FILE="$LAUNCH_AGENT_DIR/com.haeoreum.system.plist"
    
    if [ ! -f "$PLIST_FILE" ]; then
        echo "LaunchAgent 설정 중..."
        
        mkdir -p "$LAUNCH_AGENT_DIR"
        
        cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.haeoreum.system</string>
    <key>ProgramArguments</key>
    <array>
        <string>$PROJECT_DIR/start-macos-tomcat.sh</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>
    <key>RunAtLoad</key>
    <false/>
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>
EOF
        
        echo "✅ LaunchAgent 설정 파일 생성됨"
        echo "부팅시 자동 시작을 원하시면 다음 명령어를 실행하세요:"
        echo "launchctl load $PLIST_FILE"
    fi
}

# 메인 실행
main() {
    check_requirements
    check_homebrew_services
    install_dependencies
    build_project
    setup_environment
    setup_macos_tomcat
    start_api_server
    restart_tomcat_server
    setup_macos_specific
    check_services
    
    echo "============================================"
    echo "🎉 해오름인포텍 업무시스템 macOS 서버 시작 완료!"
    echo "============================================"
    echo "시스템 정보:"
    echo "  - macOS 버전: $MACOS_VERSION"
    echo "  - 아키텍처: $ARCH"
    echo "  - Homebrew 경로: $BREW_PREFIX"
    echo ""
    echo "접속 URL:"
    echo "🖥️  웹사이트: http://localhost:$TOMCAT_PORT/haeoreum"
    echo "🔧 API 서버: http://localhost:$API_PORT/api"
    echo "📊 대시보드: http://localhost:$TOMCAT_PORT/haeoreum/dashboard"
    echo "============================================"
    echo ""
    echo "macOS 서비스 관리 명령어:"
    echo "  brew services list                    - Homebrew 서비스 상태"
    echo "  brew services restart tomcat@9        - Tomcat 재시작"
    echo "  brew services restart postgresql@14   - PostgreSQL 재시작"
    echo "  pm2 status                           - PM2 프로세스 상태"
    echo "  pm2 logs                             - PM2 로그 확인"
    echo ""
    echo "브라우저에서 자동 열기:"
    echo "  open http://localhost:$TOMCAT_PORT/haeoreum"
    echo ""
    echo "로그 실시간 확인: pm2 logs --lines 50"
    
    # 자동으로 브라우저에서 열기 (선택사항)
    read -p "브라우저에서 자동으로 웹사이트를 여시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open http://localhost:$TOMCAT_PORT/haeoreum
    fi
}

# 스크립트 실행
main