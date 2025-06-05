#!/bin/bash

# 해오름인포텍 업무시스템 Tomcat 배포 스크립트

# 설정 변수
TOMCAT_HOME="${TOMCAT_HOME:-/opt/tomcat}"
APP_NAME="haeoreum"
BACKEND_PORT="8080"

echo "🚀 해오름인포텍 업무시스템 Tomcat 배포 시작..."

# 1. 프론트엔드 빌드
echo "📦 프론트엔드 빌드 중..."
npm run build:frontend

if [ $? -ne 0 ]; then
    echo "❌ 프론트엔드 빌드 실패"
    exit 1
fi

# 2. Tomcat 웹앱 디렉토리 생성
echo "📁 Tomcat 웹앱 디렉토리 준비 중..."
WEBAPP_DIR="$TOMCAT_HOME/webapps/$APP_NAME"

# 기존 배포 정리
if [ -d "$WEBAPP_DIR" ]; then
    echo "🗑️  기존 배포 정리 중..."
    rm -rf "$WEBAPP_DIR"
fi

# 새 디렉토리 생성
mkdir -p "$WEBAPP_DIR"
mkdir -p "$WEBAPP_DIR/WEB-INF"

# 3. 빌드된 파일 복사
echo "📋 빌드 파일 복사 중..."
cp -r dist/public/* "$WEBAPP_DIR/"

# 4. web.xml 복사
echo "⚙️  웹 설정 파일 복사 중..."
cp web.xml "$WEBAPP_DIR/WEB-INF/"

# 5. 백엔드 빌드
echo "🔧 백엔드 빌드 중..."
npm run build:backend

if [ $? -ne 0 ]; then
    echo "❌ 백엔드 빌드 실패"
    exit 1
fi

# 6. 백엔드 서버 재시작 (PM2 사용)
echo "🔄 백엔드 서버 재시작 중..."
if command -v npx pm2 >/dev/null 2>&1; then
    npx pm2 stop haeoreum-api 2>/dev/null || true
    npx pm2 delete haeoreum-api 2>/dev/null || true
    npx pm2 start ecosystem.config.cjs
    echo "✅ PM2로 백엔드 서버 시작됨 (포트: $BACKEND_PORT)"
else
    echo "⚠️  PM2가 설치되지 않음. 수동으로 백엔드 서버를 시작하세요:"
    echo "   PORT=$BACKEND_PORT npm start"
fi

# 7. Tomcat 재시작
echo "🔄 Tomcat 서버 재시작 중..."
if [ -f "$TOMCAT_HOME/bin/catalina.sh" ]; then
    $TOMCAT_HOME/bin/catalina.sh stop
    sleep 3
    $TOMCAT_HOME/bin/catalina.sh start
    echo "✅ Tomcat 서버 재시작 완료"
else
    echo "⚠️  Tomcat 경로를 확인하고 수동으로 재시작하세요"
fi

echo ""
echo "🎉 배포 완료!"
echo "📍 웹사이트 URL: http://localhost:8080/$APP_NAME"
echo "🔌 API 서버: http://localhost:$BACKEND_PORT"
echo ""
echo "📊 서버 상태 확인:"
echo "   - Tomcat 로그: tail -f $TOMCAT_HOME/logs/catalina.out"
echo "   - 백엔드 로그: npx pm2 logs haeoreum-api"
echo ""