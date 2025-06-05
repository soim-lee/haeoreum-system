#!/bin/bash

# 해오름인포텍 업무시스템 - macOS 원클릭 설치 스크립트

set -e

echo "============================================"
echo "🌅 해오름인포텍 업무시스템 macOS 설치"
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

# Homebrew 설치
install_homebrew() {
    if ! command -v brew &> /dev/null; then
        echo "Homebrew 설치 중..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # PATH 설정
        echo "PATH 설정 중..."
        echo "eval \"\$(${BREW_PREFIX}/bin/brew shellenv)\"" >> ~/.zshrc
        eval "$(${BREW_PREFIX}/bin/brew shellenv)"
    else
        echo "✅ Homebrew 이미 설치됨"
    fi
}

# 필수 패키지 설치
install_packages() {
    echo "필수 패키지 설치 중..."
    
    # Java
    brew install openjdk@11
    
    # Java 심볼릭 링크
    sudo ln -sfn ${BREW_PREFIX}/opt/openjdk@11/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-11.jdk
    
    # Node.js
    brew install node
    
    # PostgreSQL
    brew install postgresql@14
    
    # Tomcat
    brew install tomcat@9
    
    echo "✅ 패키지 설치 완료"
}

# 환경변수 설정
setup_environment() {
    echo "환경변수 설정 중..."
    
    # JAVA_HOME
    echo 'export JAVA_HOME=$(/usr/libexec/java_home -v11)' >> ~/.zshrc
    echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> ~/.zshrc
    
    # PostgreSQL PATH
    echo "export PATH=\"${BREW_PREFIX}/opt/postgresql@14/bin:\$PATH\"" >> ~/.zshrc
    
    # Tomcat 환경변수
    echo "export CATALINA_HOME=\"${BREW_PREFIX}/var/lib/tomcat@9\"" >> ~/.zshrc
    echo "export CATALINA_BASE=\"${BREW_PREFIX}/var/lib/tomcat@9\"" >> ~/.zshrc
    
    # npm 글로벌 설정
    echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
    
    source ~/.zshrc
    
    echo "✅ 환경변수 설정 완료"
}

# 서비스 시작
start_services() {
    echo "서비스 시작 중..."
    
    # PostgreSQL 시작
    brew services start postgresql@14
    
    # Tomcat 시작
    brew services start tomcat@9
    
    echo "✅ 서비스 시작 완료"
}

# 데이터베이스 설정
setup_database() {
    echo "데이터베이스 설정 중..."
    
    sleep 3  # PostgreSQL 시작 대기
    
    # 데이터베이스 생성
    createdb haeoreum_db 2>/dev/null || true
    
    # 사용자 생성
    psql haeoreum_db -c "CREATE USER haeoreum_user WITH PASSWORD 'haeoreum2024!';" 2>/dev/null || true
    psql haeoreum_db -c "GRANT ALL PRIVILEGES ON DATABASE haeoreum_db TO haeoreum_user;" 2>/dev/null || true
    
    echo "✅ 데이터베이스 설정 완료"
}

# PM2 설치
install_pm2() {
    echo "PM2 설치 중..."
    
    # npm 글로벌 디렉토리 생성
    mkdir -p ~/.npm-global
    npm config set prefix '~/.npm-global'
    
    # PM2 설치
    npm install -g npx pm2
    
    echo "✅ PM2 설치 완료"
}

# 설치 확인
verify_installation() {
    echo "설치 확인 중..."
    
    # Java 확인
    java -version
    
    # Node.js 확인
    node --version
    npm --version
    
    # PostgreSQL 확인
    psql --version
    
    # Tomcat 확인
    brew services list | grep tomcat
    
    # PM2 확인
    npx pm2 --version
    
    echo "✅ 설치 확인 완료"
}

# 메인 설치 프로세스
main() {
    echo "macOS 버전: $(sw_vers -productVersion)"
    echo "아키텍처: $ARCH"
    echo ""
    
    install_homebrew
    install_packages
    setup_environment
    start_services
    setup_database
    install_pm2
    verify_installation
    
    echo "============================================"
    echo "🎉 macOS 환경 설치 완료!"
    echo "============================================"
    echo ""
    echo "다음 단계:"
    echo "1. 터미널을 재시작하거나 'source ~/.zshrc' 실행"
    echo "2. 프로젝트 디렉토리에서 './start-macos-tomcat.sh' 실행"
    echo ""
    echo "접속 URL (설치 완료 후):"
    echo "- 웹사이트: http://localhost:8080/haeoreum"
    echo "- API: http://localhost:3000/api"
    echo ""
    echo "문제 발생시: './macos-troubleshoot.sh' 실행"
}

main