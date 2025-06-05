#!/bin/bash

# 해오름인포텍 업무시스템 - macOS 문제 해결 스크립트

echo "============================================"
echo "🔧 해오름인포텍 시스템 macOS 문제 해결"
echo "============================================"

# 아키텍처 감지
ARCH=$(uname -m)
if [[ "$ARCH" == "arm64" ]]; then
    BREW_PREFIX="/opt/homebrew"
    echo "Apple Silicon (M1/M2) Mac 감지"
else
    BREW_PREFIX="/usr/local"
    echo "Intel Mac 감지"
fi

# 1. 환경 진단
check_environment() {
    echo "=== 환경 진단 ==="
    
    echo "macOS 버전: $(sw_vers -productVersion)"
    echo "아키텍처: $ARCH"
    
    # Homebrew 확인
    if command -v brew &> /dev/null; then
        echo "✅ Homebrew 설치됨 ($(brew --version | head -1))"
    else
        echo "❌ Homebrew 미설치"
        echo "설치 방법: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    fi
    
    # Java 확인
    if command -v java &> /dev/null; then
        echo "✅ Java 설치됨 ($(java -version 2>&1 | head -1))"
        echo "JAVA_HOME: ${JAVA_HOME:-"설정되지 않음"}"
    else
        echo "❌ Java 미설치"
        echo "설치 방법: brew install openjdk@11"
    fi
    
    # Node.js 확인
    if command -v node &> /dev/null; then
        echo "✅ Node.js 설치됨 ($(node --version))"
        echo "npm 버전: $(npm --version)"
    else
        echo "❌ Node.js 미설치"
        echo "설치 방법: brew install node"
    fi
    
    # PM2 확인
    if command -v pm2 &> /dev/null; then
        echo "✅ PM2 설치됨 ($(pm2 --version))"
    else
        echo "❌ PM2 미설치"
        echo "설치 방법: npm install -g pm2"
    fi
}

# 2. 서비스 상태 확인
check_services() {
    echo "=== 서비스 상태 확인 ==="
    
    # Homebrew 서비스
    echo "Homebrew 서비스:"
    brew services list | grep -E "(tomcat|postgresql)" || echo "관련 서비스 없음"
    
    # PM2 프로세스
    echo "PM2 프로세스:"
    pm2 status 2>/dev/null || echo "PM2 프로세스 없음"
    
    # 포트 사용 확인
    echo "포트 사용 상태:"
    echo "포트 8080: $(lsof -i :8080 | grep LISTEN || echo "사용되지 않음")"
    echo "포트 3000: $(lsof -i :3000 | grep LISTEN || echo "사용되지 않음")"
    echo "포트 5432: $(lsof -i :5432 | grep LISTEN || echo "사용되지 않음")"
}

# 3. 포트 충돌 해결
fix_port_conflicts() {
    echo "=== 포트 충돌 해결 ==="
    
    # 8080 포트 정리
    TOMCAT_PID=$(lsof -t -i:8080 2>/dev/null)
    if [ -n "$TOMCAT_PID" ]; then
        echo "포트 8080에서 실행 중인 프로세스 발견 (PID: $TOMCAT_PID)"
        read -p "프로세스를 종료하시겠습니까? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo kill -9 $TOMCAT_PID
            echo "포트 8080 프로세스 종료됨"
        fi
    fi
    
    # 3000 포트 정리
    API_PID=$(lsof -t -i:3000 2>/dev/null)
    if [ -n "$API_PID" ]; then
        echo "포트 3000에서 실행 중인 프로세스 발견 (PID: $API_PID)"
        read -p "프로세스를 종료하시겠습니까? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo kill -9 $API_PID
            echo "포트 3000 프로세스 종료됨"
        fi
    fi
}

# 4. 권한 문제 해결
fix_permissions() {
    echo "=== 권한 문제 해결 ==="
    
    TOMCAT_HOME="$BREW_PREFIX/var/lib/tomcat@9"
    
    # Tomcat 디렉토리 권한
    if [ -d "$TOMCAT_HOME" ]; then
        echo "Tomcat 디렉토리 권한 수정 중..."
        sudo chown -R $(whoami):staff "$TOMCAT_HOME"
        echo "✅ Tomcat 권한 수정 완료"
    fi
    
    # 프로젝트 스크립트 권한
    echo "프로젝트 스크립트 실행 권한 설정 중..."
    chmod +x *.sh 2>/dev/null
    
    # Quarantine 제거
    echo "macOS 보안 제한 해제 중..."
    xattr -d com.apple.quarantine *.sh 2>/dev/null || true
    echo "✅ 권한 문제 해결 완료"
}

# 5. 서비스 재시작
restart_services() {
    echo "=== 서비스 재시작 ==="
    
    # PM2 프로세스 정리
    echo "PM2 프로세스 정리 중..."
    pm2 kill 2>/dev/null || true
    
    # Homebrew 서비스 재시작
    echo "Homebrew 서비스 재시작 중..."
    brew services restart postgresql@14 2>/dev/null || true
    brew services restart tomcat@9 2>/dev/null || true
    
    sleep 3
    
    echo "✅ 서비스 재시작 완료"
}

# 6. 네트워크 진단
check_network() {
    echo "=== 네트워크 진단 ==="
    
    # 로컬 접속 테스트
    echo "로컬 접속 테스트:"
    
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200\|302\|404"; then
        echo "✅ 포트 8080 응답"
    else
        echo "❌ 포트 8080 응답 없음"
    fi
    
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|404"; then
        echo "✅ 포트 3000 응답"
    else
        echo "❌ 포트 3000 응답 없음"
    fi
    
    # DNS 확인
    echo "DNS 확인:"
    if ping -c 1 localhost >/dev/null 2>&1; then
        echo "✅ localhost 접속 가능"
    else
        echo "❌ localhost 접속 불가"
    fi
}

# 7. 로그 분석
analyze_logs() {
    echo "=== 로그 분석 ==="
    
    # PM2 로그
    if command -v pm2 &> /dev/null; then
        echo "PM2 로그 (최근 10줄):"
        pm2 logs --lines 10 2>/dev/null || echo "PM2 로그 없음"
    fi
    
    # Homebrew 서비스 로그
    echo "Homebrew 서비스 정보:"
    brew services info tomcat@9 2>/dev/null || echo "Tomcat 서비스 정보 없음"
    
    # 시스템 로그 (Console.app에서 확인 권장)
    echo "시스템 로그는 Console.app에서 'tomcat' 또는 'haeoreum'로 검색하세요"
}

# 8. 자동 복구 시도
auto_repair() {
    echo "=== 자동 복구 시도 ==="
    
    # Homebrew 업데이트
    echo "Homebrew 업데이트 중..."
    brew update >/dev/null 2>&1 || true
    
    # 손상된 심볼릭 링크 수정
    echo "심볼릭 링크 확인 및 수정 중..."
    brew link --overwrite openjdk@11 2>/dev/null || true
    
    # 캐시 정리
    echo "시스템 캐시 정리 중..."
    npm cache clean --force 2>/dev/null || true
    
    echo "✅ 자동 복구 완료"
}

# 메인 메뉴
show_menu() {
    echo ""
    echo "문제 해결 옵션을 선택하세요:"
    echo "1) 전체 환경 진단"
    echo "2) 서비스 상태 확인"
    echo "3) 포트 충돌 해결"
    echo "4) 권한 문제 해결"
    echo "5) 서비스 재시작"
    echo "6) 네트워크 진단"
    echo "7) 로그 분석"
    echo "8) 자동 복구"
    echo "9) 전체 복구 (1-8 모두 실행)"
    echo "0) 종료"
    echo ""
    read -p "선택 (0-9): " choice
    
    case $choice in
        1) check_environment ;;
        2) check_services ;;
        3) fix_port_conflicts ;;
        4) fix_permissions ;;
        5) restart_services ;;
        6) check_network ;;
        7) analyze_logs ;;
        8) auto_repair ;;
        9) 
            echo "전체 복구 실행 중..."
            check_environment
            check_services
            fix_port_conflicts
            fix_permissions
            auto_repair
            restart_services
            check_network
            analyze_logs
            echo "✅ 전체 복구 완료"
            ;;
        0) echo "문제 해결 스크립트를 종료합니다."; exit 0 ;;
        *) echo "잘못된 선택입니다." ;;
    esac
    
    echo ""
    read -p "메인 메뉴로 돌아가려면 Enter를 누르세요..."
    show_menu
}

# 스크립트 시작
main() {
    check_environment
    show_menu
}

main