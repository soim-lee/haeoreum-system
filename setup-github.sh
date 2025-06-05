#!/bin/bash

# 해오름인포텍 업무시스템 - GitHub 저장소 설정 스크립트

set -e

echo "============================================"
echo "🌅 GitHub 저장소 설정"
echo "============================================"

# 환경변수 확인
if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    echo "❌ GITHUB_PERSONAL_ACCESS_TOKEN이 설정되지 않았습니다."
    echo "GitHub Personal Access Token을 환경변수로 설정해주세요."
    exit 1
fi

# 사용자 정보 입력
read -p "GitHub 사용자명을 입력하세요: " GITHUB_USERNAME
read -p "저장소 이름을 입력하세요 (예: haeoreum-system): " REPO_NAME

if [ -z "$GITHUB_USERNAME" ] || [ -z "$REPO_NAME" ]; then
    echo "❌ 사용자명과 저장소 이름을 모두 입력해주세요."
    exit 1
fi

# GitHub API를 통한 저장소 생성
echo "GitHub 저장소 생성 중..."

REPO_DATA=$(cat <<EOF
{
  "name": "$REPO_NAME",
  "description": "해오름인포텍 업무시스템 - 통합 업무관리 플랫폼",
  "private": false,
  "auto_init": false
}
EOF
)

# 저장소 생성 API 호출
HTTP_STATUS=$(curl -s -o /tmp/github_response.json -w "%{http_code}" \
  -X POST \
  -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d "$REPO_DATA" \
  "https://api.github.com/user/repos")

if [ "$HTTP_STATUS" = "201" ]; then
    echo "✅ GitHub 저장소 생성 성공"
elif [ "$HTTP_STATUS" = "422" ]; then
    echo "⚠️ 저장소가 이미 존재합니다. 기존 저장소를 사용합니다."
else
    echo "❌ 저장소 생성 실패 (HTTP $HTTP_STATUS)"
    cat /tmp/github_response.json
    exit 1
fi

# 로컬 Git 저장소 초기화 (새 디렉토리에서)
TEMP_DIR="/tmp/haeoreum-upload"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "파일 복사 중..."

# 필요한 파일들만 복사
cp -r client server shared "$TEMP_DIR/" 2>/dev/null || true
cp *.json *.ts *.js *.md *.sh *.xml "$TEMP_DIR/" 2>/dev/null || true
cp components.json "$TEMP_DIR/" 2>/dev/null || true

# .gitignore 생성
cat > "$TEMP_DIR/.gitignore" << 'EOF'
node_modules/
dist/
.env
.DS_Store
*.log
webapps/
.replit
.config/
.npm/
.cache/
coverage/
.vscode/
.idea/
*.tmp
*.temp
.git/
EOF

cd "$TEMP_DIR"

# Git 초기화
git init
git config user.name "haeoreum-system"
git config user.email "sunrise050716@haeoreum.com"

# 원격 저장소 추가
REPO_URL="https://$GITHUB_USERNAME:$GITHUB_PERSONAL_ACCESS_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git"
git remote add origin "$REPO_URL"

# 파일 추가 및 커밋
git add .
git commit -m "Initial commit: 해오름인포텍 업무시스템

- React + TypeScript 프론트엔드
- Node.js + Express 백엔드  
- PostgreSQL 데이터베이스 지원
- 프로젝트 관리 및 이력서 매칭 시스템
- 계약서 관리 및 캘린더 기능
- macOS/Linux 배포 스크립트 포함
- Tomcat 서버 배포 지원"

# GitHub에 푸시
echo "GitHub에 업로드 중..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "============================================"
    echo "✅ GitHub 업로드 완료!"
    echo "============================================"
    echo "저장소 URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo "Clone 명령어: git clone https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    echo ""
    echo "로컬 배포 방법:"
    echo "1. git clone https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    echo "2. cd $REPO_NAME"
    echo "3. chmod +x start-local-tomcat.sh (Linux) 또는 start-macos-tomcat.sh (macOS)"
    echo "4. ./start-local-tomcat.sh 또는 ./start-macos-tomcat.sh"
else
    echo "❌ GitHub 업로드 실패"
    exit 1
fi

# 임시 디렉토리 정리
cd /
rm -rf "$TEMP_DIR"

echo "임시 파일 정리 완료"