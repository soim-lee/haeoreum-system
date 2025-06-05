#!/usr/bin/env node

// 해오름인포텍 업무시스템 - Tomcat 스타일 서버
// Replit에서 Tomcat과 유사한 환경으로 실행

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// 정적 파일 서빙 (Tomcat webapps와 동일한 역할)
app.use('/haeoreum', express.static(path.join(__dirname, 'dist/public')));

// 루트 경로를 haeoreum으로 리다이렉트
app.get('/', (req, res) => {
  res.redirect('/haeoreum');
});

// SPA 라우팅 지원 (web.xml의 404 핸들링과 동일)
app.get('/haeoreum/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

// API 프록시 (백엔드 API 연결)
app.use('/api', express.json());

// 서버 시작
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🌅 해오름인포텍 업무시스템 - Tomcat 서버 시작');
  console.log('='.repeat(60));
  console.log(`🖥️  서버 URL: http://localhost:${PORT}/haeoreum`);
  console.log(`📊 관리자 포털: http://localhost:${PORT}/haeoreum/dashboard`);
  console.log(`🔧 상태 확인: http://localhost:${PORT}/haeoreum/health`);
  console.log('='.repeat(60));
  console.log('✅ 서버가 성공적으로 시작되었습니다!');
});

// 우아한 종료 처리
process.on('SIGTERM', () => {
  console.log('서버 종료 중...');
  server.close(() => {
    console.log('서버가 정상적으로 종료되었습니다.');
  });
});