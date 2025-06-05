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
