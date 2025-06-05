#!/bin/bash

# 해오름인포텍 업무시스템 - GitHub 업데이트 스크립트

set -e

echo "GitHub 저장소 업데이트 중..."

GITHUB_USERNAME="soim-lee"
REPO_NAME="haeoreum-system"
TEMP_DIR="/tmp/haeoreum-update-$(date +%s)"

# 기존 저장소 클론
git clone "https://$GITHUB_USERNAME:$GITHUB_PERSONAL_ACCESS_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git" "$TEMP_DIR"

cd "$TEMP_DIR"

# 현재 프로젝트 파일들로 교체
rm -rf client server shared *.json *.ts *.js *.md *.sh *.xml *.cjs 2>/dev/null || true

# 새 파일들 복사
cp -r /home/runner/workspace/client ./ 2>/dev/null || true
cp -r /home/runner/workspace/server ./ 2>/dev/null || true
cp -r /home/runner/workspace/shared ./ 2>/dev/null || true
cp /home/runner/workspace/*.json ./ 2>/dev/null || true
cp /home/runner/workspace/*.ts ./ 2>/dev/null || true
cp /home/runner/workspace/*.js ./ 2>/dev/null || true
cp /home/runner/workspace/*.md ./ 2>/dev/null || true
cp /home/runner/workspace/*.sh ./ 2>/dev/null || true
cp /home/runner/workspace/*.xml ./ 2>/dev/null || true
cp /home/runner/workspace/*.cjs ./ 2>/dev/null || true
cp /home/runner/workspace/components.json ./ 2>/dev/null || true

# Git 설정
git config user.name "haeoreum-system"
git config user.email "sunrise050716@haeoreum.com"

# 변경사항 커밋
git add .
git commit -m "Fix ecosystem.config.js -> ecosystem.config.cjs

- PM2 ES modules 호환성 문제 해결
- CommonJS 형식으로 변경
- 모든 배포 스크립트 업데이트
- API 서버 포트 3000으로 변경"

# 강제 푸시
git push origin main

echo "✅ GitHub 저장소 업데이트 완료"
echo "저장소: https://github.com/$GITHUB_USERNAME/$REPO_NAME"

# 정리
cd /
rm -rf "$TEMP_DIR"