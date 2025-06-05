import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'haeoreum-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Tomcat 스타일 로깅
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    let logLine = `[${timestamp}] ${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    
    if (capturedJsonResponse) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }

    if (logLine.length > 120) {
      logLine = logLine.slice(0, 119) + "…";
    }

    console.log(logLine);
  });

  next();
});

// 에러 처리
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[ERROR] ${status}: ${message}`);
  res.status(status).json({ message });
});

// 루트 경로를 /haeoreum으로 리다이렉트 (Tomcat 웹앱 스타일)
app.get("/", (req, res) => {
  res.redirect("/haeoreum");
});

// /haeoreum 경로로 프론트엔드 서빙
app.use("/haeoreum", express.static("dist/public"));

// SPA 라우팅 지원
app.get("/haeoreum/*", (req, res) => {
  res.sendFile("index.html", { root: "dist/public" });
});

(async () => {
  const server = await registerRoutes(app);

  // 개발 환경에서만 Vite 설정
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = parseInt(process.env.PORT || "8080");
  
  server.listen(PORT, "0.0.0.0", () => {
    console.log("=".repeat(60));
    console.log("🌅 해오름인포텍 업무시스템 - Tomcat 스타일 서버");
    console.log("=".repeat(60));
    console.log(`🖥️  메인 URL: http://localhost:${PORT}/haeoreum`);
    console.log(`📊 대시보드: http://localhost:${PORT}/haeoreum/dashboard`);
    console.log(`🔧 API 엔드포인트: http://localhost:${PORT}/api`);
    console.log(`📝 관리자: http://localhost:${PORT}/haeoreum/access`);
    console.log("=".repeat(60));
    console.log(`✅ 서버가 포트 ${PORT}에서 실행 중입니다`);
    
    if (app.get("env") === "development") {
      console.log("🔧 개발 모드로 실행 중 - 파일 변경 시 자동 재로드");
    } else {
      console.log("🚀 프로덕션 모드로 실행 중");
    }
  });
})();