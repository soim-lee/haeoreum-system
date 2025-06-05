#!/bin/bash

# 해오름인포텍 업무시스템 - 로컬 Tomcat 서버 시작 스크립트

set -e

echo "============================================"
echo "🌅 해오름인포텍 업무시스템 로컬 서버 시작"
echo "============================================"

# 설정값
PROJECT_DIR="$(pwd)"
TOMCAT_PORT=8080
API_PORT=3000

# 환경 확인
check_requirements() {
    echo "환경 요구사항 확인 중..."
    
    # Java 확인
    if ! command -v java &> /dev/null; then
        echo "❌ Java가 설치되지 않았습니다. Java 11 이상을 설치해주세요."
        exit 1
    fi
    
    # Node.js 확인
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js가 설치되지 않았습니다. Node.js 18 이상을 설치해주세요."
        exit 1
    fi
    
    # npm 확인
    if ! command -v npm &> /dev/null; then
        echo "❌ npm이 설치되지 않았습니다."
        exit 1
    fi
    
    echo "✅ 환경 요구사항 충족"
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

# 로컬 Tomcat 서버 설정
setup_local_tomcat() {
    echo "로컬 Tomcat 서버 설정 중..."
    
    # 웹앱 디렉토리 생성
    mkdir -p webapps/haeoreum/WEB-INF
    
    # 빌드된 파일 복사
    cp -r dist/public/* webapps/haeoreum/
    cp web.xml webapps/haeoreum/WEB-INF/
    
    echo "✅ 웹앱 배포 완료"
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

# 백엔드 API 서버 시작
start_api_server() {
    echo "백엔드 API 서버 시작 중..."
    
    # 기존 프로세스 중지
    pm2 stop haeoreum-api 2>/dev/null || echo "기존 API 서버가 실행되지 않고 있습니다."
    
    # API 서버 시작
    pm2 start ecosystem.config.cjs
    
    echo "✅ 백엔드 API 서버 시작됨 (포트: $API_PORT)"
}

# 내장 Tomcat 서버 시작 (Node.js 기반)
start_tomcat_server() {
    echo "Tomcat 스타일 웹서버 시작 중..."
    
    # 기존 프로세스 중지
    pm2 stop haeoreum-tomcat 2>/dev/null || echo "기존 Tomcat 서버가 실행되지 않고 있습니다."
    
    # Tomcat 스타일 서버 시작
    pm2 start tomcat-server.js --name haeoreum-tomcat
    
    echo "✅ Tomcat 스타일 웹서버 시작됨 (포트: $TOMCAT_PORT)"
}

# 서비스 상태 확인
check_services() {
    echo "서비스 상태 확인 중..."
    
    sleep 3
    
    # PM2 상태 확인
    pm2 status
    
    # 포트 확인
    if netstat -tuln 2>/dev/null | grep -q ":$TOMCAT_PORT "; then
        echo "✅ Tomcat 서버 (포트 $TOMCAT_PORT) 실행 중"
    else
        echo "❌ Tomcat 서버 시작 실패"
    fi
    
    if netstat -tuln 2>/dev/null | grep -q ":$API_PORT "; then
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

# 메인 실행
main() {
    check_requirements
    install_dependencies
    build_project
    setup_environment
    setup_local_tomcat
    start_api_server
    start_tomcat_server
    check_services
    
    echo "============================================"
    echo "🎉 해오름인포텍 업무시스템 로컬 서버 시작 완료!"
    echo "============================================"
    echo "🖥️  웹사이트: http://localhost:$TOMCAT_PORT/haeoreum"
    echo "🔧 API 서버: http://localhost:$API_PORT/api"
    echo "📊 대시보드: http://localhost:$TOMCAT_PORT/haeoreum/dashboard"
    echo "============================================"
    echo ""
    echo "서비스 관리 명령어:"
    echo "  pm2 status        - 서비스 상태 확인"
    echo "  pm2 logs          - 로그 확인"
    echo "  pm2 restart all   - 모든 서비스 재시작"
    echo "  pm2 stop all      - 모든 서비스 중지"
    echo ""
    echo "로그 실시간 확인: pm2 logs --lines 50"
}

# 스크립트 실행
main