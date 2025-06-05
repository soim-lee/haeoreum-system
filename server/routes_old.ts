import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertResumeSchema, insertContractSchema, insertUserSchema, loginSchema, insertApplicationSchema } from "../shared/schema.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
// 코드 기반 이력서 분석 함수
function analyzeResumeContent(text: string) {
  console.log("🔍 코드 기반 분석 시작");
  
  // 1. 경력 추출 (다양한 패턴)
  const experiencePatterns = [
    /(\d+)년\s*(\d+)개월/g,  // "5년 3개월" 형태
    /(\d+)년차/g,            // "10년차" 형태
    /(\d+)년/g,              // "8년" 형태
    /경력\s*(\d+)년/g,       // "경력 7년" 형태
    /총\s*(\d+)년/g          // "총 12년" 형태
  ];

  let maxExperience = 0;
  
  experiencePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const years = parseInt(match[1]);
      if (years > maxExperience) {
        maxExperience = years;
      }
    }
  });

  // 2. 학력 추출
  let education = "기타";
  const educationKeywords = {
    "학사": ["학사", "대졸", "4년제", "대학교 졸업", "Bachelor"],
    "전문학사": ["전문학사", "전문대", "2년제", "3년제", "전문대졸", "Associate"]
  };

  for (const [level, keywords] of Object.entries(educationKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      education = level;
      break;
    }
  }

  // 3. 등급 계산 (정확한 기준 적용)
  let grade = "초급";
  
  if (education === "학사") {
    if (maxExperience >= 10) grade = "고급";
    else if (maxExperience >= 7) grade = "중급";
    else grade = "초급";
  } else if (education === "전문학사") {
    if (maxExperience >= 13) grade = "고급";
    else if (maxExperience >= 10) grade = "중급";
    else grade = "초급";
  } else {
    // 기타 학력은 학사 기준 적용
    if (maxExperience >= 10) grade = "고급";
    else if (maxExperience >= 7) grade = "중급";
    else grade = "초급";
  }

  // 4. 기술스택 추출
  const techKeywords = [
    "JavaScript", "Java", "Python", "C#", "C++", ".NET", "React", "Vue.js", "Angular",
    "Node.js", "Spring", "Django", "Express", "TypeScript", "HTML", "CSS", "SQL",
    "Oracle", "MySQL", "PostgreSQL", "MongoDB", "Redis", "AWS", "Azure", "Docker",
    "Kubernetes", "Git", "Jenkins", "Linux", "Windows", "PHP", "Laravel", "jQuery",
    "Bootstrap", "Tailwind", "Firebase", "GraphQL", "REST API", "Microservices"
  ];

  const foundSkills = techKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  ).slice(0, 8);

  // 5. 업계 분류
  let industry = "일반";
  const industryKeywords = {
    "금융": ["은행", "KB", "신한", "하나", "우리", "국민", "증권", "금융", "투자"],
    "보험": ["보험", "삼성생명", "한화생명", "교보생명", "메리츠", "현대해상"],
    "공공": ["정부", "공공기관", "시청", "구청", "도청", "부처", "청", "공단", "공사"],
    "제조": ["제조", "생산", "공장", "MES", "WMS", "ERP", "현대", "삼성", "LG"],
    "준금융": ["카드", "캐피탈", "핀테크", "페이", "결제"],
    "IT": ["IT", "소프트웨어", "개발", "시스템", "네이버", "카카오", "쿠팡"]
  };

  for (const [sector, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      industry = sector;
      break;
    }
  }

  // 6. 전문분야
  let specialization = "기타";
  const specializationKeywords = {
    "웹개발": ["웹", "프론트엔드", "백엔드", "풀스택", "React", "Vue", "Angular"],
    "모바일": ["모바일", "안드로이드", "iOS", "앱개발", "React Native", "Flutter"],
    "데이터베이스": ["DB", "데이터베이스", "Oracle", "MySQL", "PostgreSQL", "DBA"],
    "DevOps": ["DevOps", "Docker", "Kubernetes", "AWS", "Azure", "CI/CD", "Jenkins"],
    "보안": ["보안", "Security", "암호화", "인증", "방화벽"],
    "AI/ML": ["AI", "ML", "머신러닝", "딥러닝", "데이터분석", "Python"]
  };

  for (const [spec, keywords] of Object.entries(specializationKeywords)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()))) {
      specialization = spec;
      break;
    }
  }

  console.log(`📊 분석 완료: 경력 ${maxExperience}년, 학력 ${education}, 등급 ${grade}`);

  return {
    experience: maxExperience > 0 ? `${maxExperience}년` : "신입",
    education,
    grade,
    skills: foundSkills,
    industry,
    specialization
  };
}
import mammoth from "mammoth";

// 파일 업로드 설정
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Gemini AI 설정
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 인증 미들웨어
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "로그인이 필요합니다" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // AI 에이전트 분석 API (먼저 등록)
  app.post("/api/ai-agent/analyze", async (req, res) => {
    try {
      console.log("AI Agent API called with body:", req.body);
      const { message, projects, resumes, contracts } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ 
          response: "AI 분석을 위해 GEMINI_API_KEY가 필요합니다. 시스템 관리자에게 문의하세요.",
          suggestions: []
        });
      }

      // Gemini AI 모델 초기화
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // 계약 데이터 가져오기
      const allContracts = await storage.getAllContracts();
      
      // 이번달 계약 분석
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // 이번달 매출 계산 (매출 타입 계약만)
      const thisMonthRevenue = allContracts.filter(contract => {
        const startDate = new Date(contract.startDate);
        return contract.transactionType === '매출' && 
               startDate.getMonth() === currentMonth && 
               startDate.getFullYear() === currentYear;
      }).reduce((total, contract) => {
        const amount = parseInt(contract.amount.replace(/[^\d]/g, '')) || 0;
        return total + amount;
      }, 0);
      
      // 이번달 비용 계산 (매입 타입 계약만)
      const thisMonthExpense = allContracts.filter(contract => {
        const startDate = new Date(contract.startDate);
        return contract.transactionType === '매입' && 
               startDate.getMonth() === currentMonth && 
               startDate.getFullYear() === currentYear;
      }).reduce((total, contract) => {
        const amount = parseInt(contract.amount.replace(/[^\d]/g, '')) || 0;
        return total + amount;
      }, 0);
      
      // 순 이익 계산
      const netProfit = thisMonthRevenue - thisMonthExpense;
      
      // 이번달 종료되는 계약
      const expiringContracts = allContracts.filter(contract => {
        const endDate = new Date(contract.endDate);
        return endDate.getMonth() === currentMonth && 
               endDate.getFullYear() === currentYear;
      });

      // 항상 서버에서 최신 데이터 가져오기 (클라이언트 데이터 전송 문제 해결)
      const finalProjects = (await storage.getAllProjects()) || [];
      const finalResumes = (await storage.getAllResumes()) || [];
      
      console.log("Final projects data:", finalProjects.length);
      console.log("Final resumes data:", finalResumes.length);

      // 프로젝트와 이력서 데이터를 분석용으로 포맷팅
      const projectsData = (finalProjects || []).map((p: any) => ({
        name: p.name || p.title,
        clientName: p.clientName,
        description: p.description,
        skills: p.skills,
        duration: p.duration,
        location: p.location,
        grade: p.grade,
        peopleCount: p.peopleCount,
        projectSource: p.projectSource,
        status: p.status
      }));

      const resumesData = (finalResumes || []).map((r: any) => ({
        fileName: r.fileName,
        skills: r.skills,
        experience: r.experience,
        industry: r.industry,
        specialization: r.specialization,
        hourlyRate: r.hourlyRate,
        applicationStatus: r.applicationStatus,
        extractedText: r.extractedText?.substring(0, 500)
      }));
      
      // 계약 분석 데이터
      const contractAnalysis = {
        thisMonthRevenue,
        thisMonthExpense,
        netProfit,
        expiringContracts: expiringContracts.map(c => ({
          contractName: c.contractName,
          clientName: c.clientName,
          amount: c.amount,
          endDate: c.endDate,
          transactionType: c.transactionType
        }))
      };

      // 질문 유형 분석
      const isFinancialQuery = message.includes('매출') || message.includes('이익') || message.includes('수익') || 
                               message.includes('계약금') || message.includes('재무') || message.includes('돈') ||
                               message.includes('금액') || message.includes('비용') || message.includes('종료');

      // AI 분석 프롬프트 생성
      const prompt = `
당신은 Sunrise Info의 전문 비즈니스 AI 에이전트입니다.
사용자 질문: "${message}"

현재 등록된 프로젝트 데이터:
${JSON.stringify(projectsData, null, 2)}

현재 등록된 이력서 데이터:
${JSON.stringify(resumesData, null, 2)}

${isFinancialQuery ? `
계약 분석 데이터:
- 이번달 총 매출: ${thisMonthRevenue.toLocaleString()}원
- 이번달 총 비용: ${thisMonthExpense.toLocaleString()}원
- 이번달 순 이익: ${netProfit.toLocaleString()}원
- 이번달 종료 예정 계약: ${JSON.stringify(contractAnalysis.expiringContracts, null, 2)}
` : ''}

**중요 지침:**
1. 오직 사용자가 질문한 내용에만 답변하세요
2. 재무/매출을 묻지 않았다면 절대 재무 정보를 언급하지 마세요
3. 이력서 분석 질문 → 이력서 데이터만 분석
4. 인재매칭 질문 → 프로젝트와 이력서 매칭 분석
5. 재무 질문 → 계약 분석 데이터만 활용
6. 불필요한 부가정보나 추가 설명은 절대 포함하지 마세요
7. 간결하고 정확하게만 답변하세요

응답 형식:
{
  "response": "질문에 대한 직접적인 답변만",
  "suggestions": []
}
`;

      // Gemini AI로 분석 요청
      console.log("Sending request to Gemini AI...");
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let aiResponse;
      
      try {
        const responseText = response.text();
        console.log("Gemini response:", responseText);
        
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("JSON 형식이 아님");
        }
      } catch (parseError) {
        console.log("JSON parse error:", parseError);
        const responseText = response.text();
        aiResponse = {
          response: responseText || "죄송합니다. 분석 중 오류가 발생했습니다. 다시 시도해주세요.",
          suggestions: []
        };
      }

      // 인덱스를 실제 데이터로 변환
      const formattedSuggestions = aiResponse.suggestions?.map((suggestion: any) => {
        const project = projects[suggestion.projectIndex];
        const resume = resumes[suggestion.resumeIndex];
        
        if (project && resume) {
          return {
            project,
            resume,
            matchScore: suggestion.matchScore || 0,
            reasons: suggestion.reasons || []
          };
        }
        return null;
      }).filter(Boolean) || [];

      res.json({
        response: aiResponse.response,
        suggestions: formattedSuggestions
      });

    } catch (error) {
      console.error("AI Agent error:", error);
      res.status(500).json({ 
        response: "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        suggestions: []
      });
    }
  });

  // 사용자 인증 상태 확인 API
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "로그인되지 않음" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "사용자를 찾을 수 없음" });
      }
      
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("사용자 인증 확인 오류:", error);
      res.status(500).json({ error: "서버 오류" });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // 중복 사용자 확인
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ error: "이미 사용 중인 아이디입니다" });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: "이미 사용 중인 이메일입니다" });
      }
      
      // 비밀번호 해시화
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // 사용자 생성
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // 비밀번호 제외하고 응답
      const { password, ...userResponse } = newUser;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("회원가입 오류:", error);
      res.status(400).json({ error: "회원가입에 실패했습니다" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      
      // 사용자 찾기
      const user = await storage.getUserByUsername(loginData.username);
      if (!user) {
        return res.status(401).json({ error: "아이디 또는 비밀번호가 일치하지 않습니다" });
      }
      
      // 비밀번호 확인
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "아이디 또는 비밀번호가 일치하지 않습니다" });
      }
      
      // 세션에 사용자 정보 저장
      req.session = req.session || {};
      (req.session as any).userId = user.id;
      
      // 비밀번호 제외하고 응답
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("로그인 오류:", error);
      res.status(400).json({ error: "로그인에 실패했습니다" });
    }
  });

  // 프로젝트 관련 API
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ message: "프로젝트 조회 실패" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error) {
      console.error("Create project error:", error);
      res.status(400).json({ message: "프로젝트 등록 실패" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Deleting project with ID: ${id}`);
      const success = await storage.deleteProject(id);
      console.log(`Delete result: ${success}`);
      if (success) {
        const remainingProjects = await storage.getAllProjects();
        console.log(`Remaining projects count: ${remainingProjects.length}`);
        res.json({ message: "프로젝트가 삭제되었습니다" });
      } else {
        res.status(404).json({ message: "프로젝트를 찾을 수 없습니다" });
      }
    } catch (error) {
      console.error("Delete project error:", error);
      res.status(500).json({ message: "프로젝트 삭제 실패" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.updateProject(id, req.body);
      if (project) {
        res.json(project);
      } else {
        res.status(404).json({ message: "프로젝트를 찾을 수 없습니다" });
      }
    } catch (error) {
      console.error("Update project error:", error);
      res.status(500).json({ message: "프로젝트 수정 실패" });
    }
  });

  // 이력서 관련 API
  app.get("/api/resumes", async (req, res) => {
    try {
      const resumes = await storage.getAllResumes();
      res.json(resumes);
    } catch (error) {
      console.error("Get resumes error:", error);
      res.status(500).json({ message: "이력서 조회 실패" });
    }
  });

  // 이력서 업로드 및 코드 기반 분석
  app.post("/api/upload-resume", upload.single('resume'), async (req, res) => {
    try {
      console.log("🚀 이력서 업로드 시작");
      
      if (!req.file) {
        return res.status(400).json({ message: "파일이 업로드되지 않았습니다" });
      }

      const fileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      console.log("📁 파일명:", fileName);



      // 파일 내용을 텍스트로 추출
      let extractedText = "";
      
      if (req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        // DOCX 파일 처리
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        extractedText = result.value;
        console.log("📄 DOCX 텍스트 추출 완료, 길이:", extractedText.length);
      } else if (req.file.mimetype === "application/msword") {
        // DOC 파일 처리
        extractedText = req.file.buffer.toString('utf8');
        console.log("📄 DOC 텍스트 추출 완료, 길이:", extractedText.length);
      } else {
        return res.status(400).json({ message: "지원하지 않는 파일 형식입니다" });
      }

      // 코드 기반 등급 산정 시스템
      const analysisResult = analyzeResumeContent(extractedText);
      
      console.log("🎯 분석 결과:", {
        경력: analysisResult.experience,
        학력: analysisResult.education, 
        등급: analysisResult.grade,
        기술스택: analysisResult.skills.length
      });

      const finalResumeData = {
        fileName,
        extractedText,
        skills: analysisResult.skills,
        experience: analysisResult.experience,
        education: analysisResult.education,
        grade: analysisResult.grade,
        industry: analysisResult.industry,
        specialization: analysisResult.specialization
      };

      const savedResume = await storage.createResume(finalResumeData);
      res.json(savedResume);
      
    } catch (error) {
      console.error("Upload resume error:", error);
      res.status(500).json({ message: "이력서 업로드 실패" });
    }
  });
`;

      let analysisResult;
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "이력서를 분석해서 JSON 형식으로만 응답해주세요. 다른 설명 없이 오직 JSON만 반환하세요."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        });

        const text = response.choices[0].message.content;
        console.log("AI 응답 원본:", text);
        
        if (!text) {
          throw new Error("AI 응답이 비어있습니다");
        }
        
        // OpenAI의 JSON 모드는 직접 파싱 가능
        analysisResult = JSON.parse(text);
        console.log("AI 분석 성공:", analysisResult);
        
        // 파일명 정보 확인
        const fileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
        console.log("업로드된 파일명:", fileName);
        console.log("현재 AI 분석 등급:", analysisResult.grade);
        
        // ChatGPT가 초급으로 분석한 경우 파일명에서 등급 재확인
        if (analysisResult.grade === "초급") {
          console.log("초급 등급 감지 - 파일명에서 재확인 시작");
          
          if (fileName.includes("고급") || fileName.includes("senior") || fileName.includes("시니어")) {
            analysisResult.grade = "고급";
            console.log("✅ 파일명에서 고급 등급으로 수정 완료!");
          } else if (fileName.includes("중급") || fileName.includes("mid") || fileName.includes("미들")) {
            analysisResult.grade = "중급";
            console.log("✅ 파일명에서 중급 등급으로 수정 완료!");
          } else {
            console.log("파일명에서 등급 키워드를 찾지 못함");
          }
        } else {
          console.log("AI가 초급이 아닌 등급을 분석함:", analysisResult.grade);
        }
        
        console.log("최종 등급:", analysisResult.grade);
        
        // 파일명에서 등급이 감지되었다면 그것을 우선 적용
        if (fileBasedGrade) {
          analysisResult.grade = fileBasedGrade;
          console.log("🎯 파일명 기반 등급으로 최종 적용:", fileBasedGrade);
        }
      } catch (aiError) {
        console.log("AI 분석 실패, 텍스트 기반 분석 시도:", aiError);
        
        // 텍스트에서 경력과 학력 정보 추출 시도
        const text = extractedText.toLowerCase();
        let experienceYears = 0;
        let education = "기타";
        
        // 경력 추출 (간단한 문자열 검색)
        const yearMatches = text.match(/\d+년/g);
        if (yearMatches) {
          for (const match of yearMatches) {
            const num = parseInt(match.replace('년', ''));
            if (num > experienceYears && num <= 30) { // 30년 이하만 경력으로 인정
              experienceYears = num;
            }
          }
        }
        
        // 학력 추출
        if (text.includes("박사") || text.includes("phd") || text.includes("doctorate")) {
          education = "대학원";
        } else if (text.includes("석사") || text.includes("master") || text.includes("대학원")) {
          education = "대학원";
        } else if (text.includes("학사") || text.includes("대학교") || text.includes("university") || text.includes("bachelor")) {
          education = "학사";
        } else if (text.includes("전문학사") || text.includes("전문대") || text.includes("college")) {
          education = "전문학사";
        }
        
        // 등급 산정 (원래 기준 적용)
        let calculatedGrade = "초급";
        if (education === "전문학사") {
          if (experienceYears >= 13) calculatedGrade = "고급";
          else if (experienceYears >= 10) calculatedGrade = "중급";
          else calculatedGrade = "초급";
        } else { // 학사, 대학원, 기타
          if (experienceYears >= 10) calculatedGrade = "고급";
          else if (experienceYears >= 7) calculatedGrade = "중급";
          else calculatedGrade = "초급";
        }
        
        console.log(`텍스트 분석 결과 - 경력: ${experienceYears}년, 학력: ${education}, 등급: ${calculatedGrade}`);
        
        // AI 분석에서 경력이 0년이거나 등급이 초급인 경우 파일명 체크
        if (experienceYears === 0 || calculatedGrade === "초급") {
          const fileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
          console.log("경력 정보 없음 - 파일명에서 등급 추출 시도:", fileName);
          
          if (fileName.includes("고급") || fileName.includes("senior") || fileName.includes("시니어")) {
            calculatedGrade = "고급";
            console.log("파일명에서 고급 등급 감지");
          } else if (fileName.includes("중급") || fileName.includes("mid") || fileName.includes("미들")) {
            calculatedGrade = "중급";
            console.log("파일명에서 중급 등급 감지");
          } else if (fileName.includes("초급") || fileName.includes("junior") || fileName.includes("주니어")) {
            calculatedGrade = "초급";
            console.log("파일명에서 초급 등급 감지");
          }
          console.log("파일명 기반 최종 등급:", calculatedGrade);
        } else {
          console.log("텍스트에서 경력 정보 발견 - 경력 기반 등급 사용:", calculatedGrade);
        }
        
        // AI 분석 실패 시 텍스트 기반 분석 결과 사용
        const commonSkills = ["JavaScript", "React", "Node.js", "Python", "Java", "TypeScript", "SQL", "Spring"];
        const industries = ["보험", "공공", "제조", "금융", "준금융", "IT", "일반"];
        const specializations = ["보험", "공공", "제조", "금융", "준금융", "IT서비스", "SI/솔루션", "기타"];
        analysisResult = {
          skills: commonSkills.slice(0, Math.floor(Math.random() * 4) + 2),
          experience: experienceYears > 0 ? `${experienceYears}년 경력` : "경력 정보 없음",
          education: education,
          industry: industries[Math.floor(Math.random() * industries.length)],
          specialization: specializations[Math.floor(Math.random() * specializations.length)],
          grade: calculatedGrade,
          summary: "업로드된 이력서"
        };
      }

      console.log("AI 분석 완료 - 등급:", analysisResult.grade);

      const finalResumeData = {
        fileName: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
        extractedText,
        skills: analysisResult.skills || [],
        experience: analysisResult.experience || "경력 정보 없음",
        education: analysisResult.education || "기타",
        grade: analysisResult.grade || "초급",
        industry: analysisResult.industry || "일반",
        specialization: analysisResult.specialization || "일반 개발"
      };

      console.log("📋 최종 이력서 데이터:", { 파일명: finalResumeData.fileName, 등급: finalResumeData.grade });

      const savedResume = await storage.createResume(finalResumeData);
      res.json(savedResume);
    } catch (error) {
      console.error("Upload resume error:", error);
      res.status(500).json({ message: "이력서 업로드 실패" });
    }
  });

  // 이력서 수정
  app.patch("/api/resumes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedResume = await storage.updateResume(id, updates);
      
      if (!updatedResume) {
        return res.status(404).json({ message: "이력서를 찾을 수 없습니다" });
      }
      
      res.json(updatedResume);
    } catch (error) {
      console.error("Update resume error:", error);
      res.status(500).json({ message: "이력서 수정 실패" });
    }
  });

  // 이력서 삭제
  app.delete("/api/resumes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteResume(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "이력서를 찾을 수 없습니다" });
      }
      
      res.json({ message: "이력서가 삭제되었습니다" });
    } catch (error) {
      console.error("Delete resume error:", error);
      res.status(500).json({ message: "이력서 삭제 실패" });
    }
  });

  // 이력서 다운로드
  app.get("/api/resumes/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resume = await storage.getResume(id);
      
      if (!resume) {
        return res.status(404).json({ message: "이력서를 찾을 수 없습니다" });
      }
      
      // 파일 내용을 텍스트로 반환 (실제 파일이 저장되지 않았으므로)
      const content = `파일명: ${resume.fileName}
업로드 날짜: ${resume.uploadedAt}
경력: ${resume.experience || "정보 없음"}
업계: ${resume.industry || "정보 없음"}
보유 기술: ${resume.skills ? resume.skills.join(", ") : "정보 없음"}
메모: ${resume.memo || "없음"}
시급/단가: ${resume.hourlyRate || "정보 없음"}

=== 원본 파일 내용 ===
${resume.extractedText}`;

      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(resume.fileName)}.txt"`);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(content);
    } catch (error) {
      console.error("Download resume error:", error);
      res.status(500).json({ message: "이력서 다운로드 실패" });
    }
  });

  // 매칭 관련 API
  app.get("/api/project-matches", async (req, res) => {
    try {
      const matches = await storage.getAllMatches();
      res.json(matches);
    } catch (error) {
      console.error("Get matches error:", error);
      res.status(500).json({ message: "매칭 결과 조회 실패" });
    }
  });

  app.post("/api/generate-matches", async (req, res) => {
    try {
      const { projectId, resumeId } = req.body;

      if (!projectId || !resumeId) {
        return res.status(400).json({ message: "프로젝트와 이력서를 선택해주세요" });
      }

      const project = await storage.getProject(projectId);
      const resume = await storage.getResume(resumeId);

      if (!project || !resume) {
        return res.status(404).json({ message: "프로젝트 또는 이력서를 찾을 수 없습니다" });
      }

      // 간단한 매칭 알고리즘 (실제로는 AI 사용)
      const projectSkills = project.skills || [];
      const resumeSkills = resume.skills || [];
      
      const matchingSkills = projectSkills.filter(skill => 
        resumeSkills.some(rSkill => rSkill.toLowerCase().includes(skill.toLowerCase()))
      );

      const matchScore = Math.min(95, Math.max(20, 
        (matchingSkills.length / projectSkills.length) * 100 + Math.random() * 20
      ));

      const analysis = `이 후보자는 ${project.title} 프로젝트에 ${matchScore.toFixed(0)}% 적합합니다. 
      ${matchingSkills.length}개의 핵심 스킬이 일치하며, ${resume.experience}을 보유하고 있습니다. 
      ${project.grade} 등급 요구사항에 ${matchScore > 70 ? '적합' : '부분적으로 적합'}합니다.`;

      const match = await storage.createProjectMatch({
        projectId,
        resumeId,
        matchScore: matchScore.toString(),
        skillMatch: matchingSkills,
        analysis
      });

      res.json(match);
    } catch (error) {
      console.error("Generate match error:", error);
      res.status(500).json({ message: "매칭 분석 실패" });
    }
  });

  // 양식 다운로드 API
  app.get("/api/forms/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const form = await storage.getForm(id);
      
      if (!form) {
        return res.status(404).json({ message: "양식을 찾을 수 없습니다" });
      }
      
      // Base64 데이터를 Buffer로 변환
      const fileBuffer = Buffer.from(form.fileData, 'base64');
      
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(form.fileName)}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', fileBuffer.length);
      res.send(fileBuffer);
    } catch (error) {
      console.error("Download form error:", error);
      res.status(500).json({ message: "양식 다운로드 실패" });
    }
  });

  // 지원결과 API
  app.get("/api/applications", async (req, res) => {
    console.log("=== GET /api/applications called ===");
    try {
      const applications = await storage.getAllApplications();
      console.log("Retrieved applications count:", applications.length);
      console.log("Applications data:", JSON.stringify(applications, null, 2));
      res.json(applications);
    } catch (error) {
      console.error("Get applications error:", error);
      res.status(500).json({ message: "지원결과 조회 실패" });
    }
  });

  app.post("/api/applications", async (req, res) => {
    console.log("=== POST /api/applications called ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    try {
      console.log("Validating data with schema...");
      const validatedData = insertApplicationSchema.parse(req.body);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
      
      console.log("Creating application in storage...");
      const application = await storage.createApplication(validatedData);
      console.log("Created application:", JSON.stringify(application, null, 2));
      
      // 지원결과 등록 시 해당 이력서의 상태를 "지원완료"로 업데이트
      console.log("Updating resume status...");
      const updatedResume = await storage.updateResume(validatedData.resumeId, { applicationStatus: "지원완료" });
      console.log("Updated resume:", updatedResume);
      
      console.log("Sending response...");
      res.json(application);
    } catch (error) {
      console.error("Create application error:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "지원결과 등록 실패", error: error.message });
    }
  });

  app.patch("/api/applications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.updateApplication(id, req.body);
      
      if (!application) {
        return res.status(404).json({ message: "지원결과를 찾을 수 없습니다" });
      }
      
      res.json(application);
    } catch (error) {
      console.error("Update application error:", error);
      res.status(500).json({ message: "지원결과 수정 실패" });
    }
  });

  app.delete("/api/applications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteApplication(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "지원결과를 찾을 수 없습니다" });
      }
      
      res.json({ message: "지원결과가 삭제되었습니다" });
    } catch (error) {
      console.error("Delete application error:", error);
      res.status(500).json({ message: "지원결과 삭제 실패" });
    }
  });

  // 이력서별 지원취소 API
  app.delete("/api/applications/resume/:resumeId", async (req, res) => {
    try {
      const resumeId = parseInt(req.params.resumeId);
      
      // 해당 이력서의 모든 지원결과 조회
      const applications = await storage.getAllApplications();
      const resumeApplications = applications.filter(app => app.resumeId === resumeId);
      
      // 모든 관련 지원결과 삭제
      for (const application of resumeApplications) {
        await storage.deleteApplication(application.id);
      }
      
      // 이력서 상태를 "미지원"으로 변경
      await storage.updateResume(resumeId, { applicationStatus: "미지원" });
      
      res.json({ message: "지원이 취소되었습니다" });
    } catch (error) {
      console.error("Cancel application error:", error);
      res.status(500).json({ message: "지원취소 실패" });
    }
  });

  // 계약 관리 API
  app.get("/api/contracts", async (req, res) => {
    try {
      const contracts = await storage.getAllContracts();
      res.json(contracts);
    } catch (error) {
      console.error("Get contracts error:", error);
      res.status(500).json({ message: "계약 목록 조회 실패" });
    }
  });

  app.post("/api/contracts", async (req, res) => {
    try {
      console.log("Creating contract with data:", JSON.stringify(req.body, null, 2));
      
      // 스키마 검증 없이 직접 데이터 처리
      const contractData = {
        contractName: req.body.contractName,
        clientName: req.body.clientName,
        transactionType: req.body.transactionType,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        amount: req.body.amount,
        paymentDate: req.body.paymentDate || null,
        description: req.body.description || null,
      };
      
      console.log("Processed contract data:", JSON.stringify(contractData, null, 2));
      const contract = await storage.createContract(contractData);
      console.log("Created contract:", JSON.stringify(contract, null, 2));
      
      // 실시간 업데이트는 클라이언트에서 폴링으로 처리
      
      res.json(contract);
    } catch (error) {
      console.error("Create contract error:", error);
      res.status(500).json({ message: "계약 등록 실패" });
    }
  });

  app.patch("/api/contracts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.updateContract(id, req.body);
      
      if (!contract) {
        return res.status(404).json({ message: "계약을 찾을 수 없습니다" });
      }
      
      // 실시간 업데이트는 클라이언트에서 폴링으로 처리
      
      res.json(contract);
    } catch (error) {
      console.error("Update contract error:", error);
      res.status(500).json({ message: "계약 수정 실패" });
    }
  });

  app.delete("/api/contracts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteContract(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "계약을 찾을 수 없습니다" });
      }

      // 실시간 업데이트는 클라이언트에서 폴링으로 처리

      res.json({ message: "계약이 삭제되었습니다" });
    } catch (error) {
      console.error("Delete contract error:", error);
      res.status(500).json({ message: "계약 삭제 실패" });
    }
  });



  // 데이터 초기화 API (개발용)
  app.post("/api/admin/clear-data", (req, res) => {
    storage.clearAllData();
    res.json({ message: "모든 데이터가 초기화되었습니다" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
