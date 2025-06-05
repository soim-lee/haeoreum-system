#!/bin/bash

# 해오름인포텍 업무시스템 - 자동 GitHub 업로드 스크립트

set -e

echo "============================================"
echo "🌅 자동 GitHub 저장소 업로드"
echo "============================================"

# 기본 설정
GITHUB_USERNAME="soim-lee"
REPO_NAME="haeoreum-system"

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
fi

# 로컬 Git 저장소 초기화 (새 디렉토리에서)
TEMP_DIR="/tmp/haeoreum-upload-$(date +%s)"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "파일 복사 중..."

# 필요한 파일들만 복사
cp -r client server shared "$TEMP_DIR/" 2>/dev/null || true
cp *.json *.ts *.js *.md *.sh *.xml "$TEMP_DIR/" 2>/dev/null || true
cp components.json "$TEMP_DIR/" 2>/dev/null || true

# README.md 업데이트
cat > "$TEMP_DIR/README.md" << 'EOF'
# 해오름인포텍 업무시스템

통합 업무관리 플랫폼으로 프로젝트 관리, 이력서 분석, 계약 관리, 일정 관리 등을 제공합니다.

## 빠른 시작

### Linux/Ubuntu
```bash
git clone https://github.com/haeoreum-infotech/haeoreum-system.git
cd haeoreum-system
chmod +x start-local-tomcat.sh
./start-local-tomcat.sh
```

### macOS
```bash
git clone https://github.com/haeoreum-infotech/haeoreum-system.git
cd haeoreum-system
chmod +x install-macos.sh start-macos-tomcat.sh
./install-macos.sh
./start-macos-tomcat.sh
```

## 접속 URL

- 웹사이트: http://localhost:8080/haeoreum
- 대시보드: http://localhost:8080/haeoreum/dashboard
- API: http://localhost:3000/api

## 주요 기능

- 프로젝트 등록 및 관리
- 이력서 업로드 및 AI 분석
- 프로젝트-이력서 매칭
- 계약서 생성 및 관리
- 일정 관리 및 알림
- 지원서 관리
- 블랙리스트 관리

## 기술 스택

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Drizzle ORM
- UI: Tailwind CSS + shadcn/ui
- Deployment: Tomcat + PM2

## 시스템 요구사항

- Java 11+
- Node.js 18+
- PostgreSQL 12+
- 8GB RAM 이상 권장

## 라이선스

해오름인포텍 © 2024
EOF

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
    echo "3. Linux: ./start-local-tomcat.sh"
    echo "4. macOS: ./install-macos.sh && ./start-macos-tomcat.sh"
else
    echo "❌ GitHub 업로드 실패"
    exit 1
fi

# 임시 디렉토리 정리
cd /
rm -rf "$TEMP_DIR"

echo "임시 파일 정리 완료"