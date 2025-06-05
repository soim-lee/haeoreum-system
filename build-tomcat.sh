#!/bin/bash

# 해오름인포텍 업무시스템 Tomcat 빌드 스크립트

set -e

echo "🚀 Tomcat 배포를 위한 빌드 시작..."

# 1. 프론트엔드 빌드
echo "📦 프론트엔드 빌드 중..."
npm run build

# 2. 백엔드 빌드
echo "🔧 백엔드 빌드 중..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# 3. Tomcat 웹앱 디렉토리 구조 생성
echo "📁 Tomcat 웹앱 구조 생성 중..."
mkdir -p tomcat-webapp/WEB-INF

# 4. 빌드된 프론트엔드 파일을 Tomcat 웹앱 루트로 복사
echo "📋 프론트엔드 파일 복사 중..."
cp -r dist/public/* tomcat-webapp/

# 5. web.xml을 WEB-INF 디렉토리로 복사
echo "⚙️ web.xml 설정 파일 복사 중..."
cp web.xml tomcat-webapp/WEB-INF/

# 6. 백엔드 실행 스크립트 생성
echo "📝 백엔드 실행 스크립트 생성 중..."
cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "백엔드 API 서버 시작 중..."
NODE_ENV=production PORT=3000 node dist/index.js
EOF

chmod +x start-backend.sh

# 7. PM2 설정 파일 확인
if [ ! -f "ecosystem.config.cjs" ]; then
    echo "📄 PM2 설정 파일 생성 중..."
    cat > ecosystem.config.cjs << 'EOF'
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
fi

echo "✅ Tomcat 빌드 완료!"
echo ""
echo "배포 방법:"
echo "1. tomcat-webapp/ 디렉토리를 Tomcat의 webapps/haeoreum/으로 복사"
echo "2. 백엔드 API 서버 시작: ./start-backend.sh 또는 pm2 start ecosystem.config.cjs"
echo "3. Tomcat 접속: http://localhost:8080/haeoreum"
echo ""