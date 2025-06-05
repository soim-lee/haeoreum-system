#!/bin/bash

# 해오름인포텍 업무시스템 Tomcat 스타일 실행 스크립트

echo "해오름인포텍 업무시스템 Tomcat 서버 시작 중..."

# 환경 변수 설정
export NODE_ENV=production
export PORT=8080

# Tomcat 스타일 서버 실행
NODE_ENV=production PORT=8080 npx tsx server/tomcat-index.ts