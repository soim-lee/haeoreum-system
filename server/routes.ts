import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertResumeSchema, insertContractSchema, insertUserSchema, loginSchema, insertApplicationSchema } from "../shared/schema.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";

// AI 기반 이력서 분석 함수
async function analyzeResumeWithAI(text: string, fileName: string) {
  try {
    console.log("🤖 AI 분석 시작:", fileName);
    console.log("🔑 GEMINI_API_KEY 존재 여부:", !!process.env.GEMINI_API_KEY);
    
    if (!process.env.GEMINI_API_KEY) {
      console.log("❌ GEMINI_API_KEY가 없어서 코드 기반 분석으로 전환");
      return analyzeResumeContent(text);
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `다음 이력서를 분석해주세요. 텍스트가 깨져있거나 불완전해도 최대한 정보를 추출해주세요.

파일명: ${fileName}
이력서 내용:
${text}

다음 정보를 분석해주세요:
1. skills: 모든 기술 스킬 배열 (Java, JavaScript, Python, React, Vue, Spring, Oracle, MySQL 등 - 가능한 많이)
2. experience: 경력 연수 (신입이면 "신입", 있으면 "5년" 형태)
3. education: 최종 학력 (고졸/전문대/학사/석사/박사/기타 중 하나)
4. industry: 업계 분류 (금융권/보험/공공/이커머스/물류/통신/삼성경험자/일반 IT 중 하나 - 프로젝트 경험을 기반으로 정확히 분류)
5. mainSkills: 주력 기술 3개 배열 (가장 중요하거나 자주 언급된 기술)
6. specialty: 전문 분야 (iOS 개발/안드로이드 개발/웹 개발/모바일 개발/데이터베이스/풀스택 개발/프론트엔드 개발/백엔드 개발/DevOps인프라/일반 개발 중 하나)

분석 가이드:
- 텍스트가 깨져있어도 키워드를 찾아 분석하세요
- Java, JavaScript, Python, React, Vue, Spring, Oracle, MySQL 등 기술 키워드 적극 발굴
- 프로젝트 경험, 개발 경험 위주로 분석
- 업계 분류 시 다음 키워드 필수 확인 (하나라도 발견되면 해당 업계로 분류):
  * 공공: 관공서, 공단, 공사, 시청, 구청, 정부, 행정, 민원, 전자정부, e-gov, eGov, 전자정부프레임워크
  * 물류: 택배, 배송, 창고, 물류센터, WMS, 재고관리, 운송, 물류시스템
  * 금융권: 은행, 카드, 증권, 보험, 금융, 신용, 대출, 뱅킹
  * 이커머스: 쇼핑몰, 온라인몰, 전자상거래, 주문, 결제, 온라인쇼핑
- 확실하지 않으면 추론해서 가장 적합한 값 선택

중요: e-gov framework가 보이면 반드시 "공공"으로 분류하세요!

반드시 JSON 형식으로만 답변하세요 (다른 설명 없이):
{
  "name": "홍길동",
  "skills": ["JavaScript", "React", "Node.js", "MySQL", "AWS"],
  "experience": "5년",
  "education": "학사",
  "industry": "공공",
  "mainSkills": ["JavaScript", "React", "Node.js"],
  "specialty": "웹 개발"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();
    
    console.log('🤖 AI 분석 응답:', aiText);
    
    // JSON 파싱 강화 - 여러 방법 시도
    let analysis = null;
    
    // 1. 전체 중괄호 매칭
    let jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        analysis = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.log('🔧 첫 번째 JSON 파싱 실패, 다른 방법 시도');
      }
    }
    
    // 2. 코드 블록 내 JSON 찾기
    if (!analysis) {
      const codeBlockMatch = aiText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        try {
          analysis = JSON.parse(codeBlockMatch[1]);
        } catch (e) {
          console.log('🔧 코드 블록 JSON 파싱 실패');
        }
      }
    }
    
    // 3. 백틱 없는 JSON 블록 찾기
    if (!analysis) {
      const lines = aiText.split('\n');
      let jsonStart = -1, jsonEnd = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('{') && jsonStart === -1) {
          jsonStart = i;
        }
        if (lines[i].trim().endsWith('}') && jsonStart !== -1) {
          jsonEnd = i;
          break;
        }
      }
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        try {
          const jsonText = lines.slice(jsonStart, jsonEnd + 1).join('\n');
          analysis = JSON.parse(jsonText);
        } catch (e) {
          console.log('🔧 라인별 JSON 파싱 실패');
        }
      }
    }
    
    // 4. 최후 수단: 키워드 기반 정보 추출
    if (!analysis) {
      console.log('🔧 JSON 파싱 모두 실패, 키워드 기반 추출 시도');
      const skillsMatch = aiText.match(/(?:skills?|기술|스킬)[:\s]*\[([^\]]+)\]/i);
      const experienceMatch = aiText.match(/(?:experience|경력)[:\s]*"([^"]+)"/i);
      const educationMatch = aiText.match(/(?:education|학력)[:\s]*"([^"]+)"/i);
      
      if (skillsMatch || experienceMatch || educationMatch) {
        analysis = {
          skills: skillsMatch ? skillsMatch[1].split(',').map(s => s.trim().replace(/"/g, '')) : [],
          experience: experienceMatch ? experienceMatch[1] : "신입",
          education: educationMatch ? educationMatch[1] : "기타",
          industry: "일반 IT",
          mainSkills: [],
          specialty: "일반 개발"
        };
      }
    }
    
    if (analysis) {
      console.log('✅ AI 분석 완료:', analysis);
      return analysis;
    } else {
      console.log('❌ AI 응답에서 정보를 찾을 수 없음, 코드 기반 분석으로 전환');
      return analyzeResumeContent(text, fileName);
    }
    
  } catch (error) {
    console.error('❌ AI 분석 실패:', error);
    console.log('🔄 코드 기반 분석으로 전환');
    const fallbackResult = analyzeResumeContent(text, fileName);
    console.log('📋 코드 기반 분석 결과:', fallbackResult);
    return fallbackResult;
  }
}

// 코드 기반 이력서 분석 함수 (AI 실패시 백업)
function analyzeResumeContent(text: string, fileName?: string) {
  console.log("🔍 코드 기반 분석 시작");
  console.log(`📄 텍스트 길이: ${text.length}자, 첫 200자: "${text.substring(0, 200)}"`);
  
  // 0. 이름 추출 (파일명 또는 문서 내용에서)
  let name = "";
  
  // 파일명에서 이름 추출 시도
  if (fileName) {
    const nameFromFile = fileName.replace(/\.(docx?|pdf)$/i, '').split(/[_\-\s]/)[0];
    if (nameFromFile.length >= 2 && nameFromFile.length <= 4 && /^[가-힣]+$/.test(nameFromFile)) {
      name = nameFromFile;
    }
  }
  
  // 문서 내용에서 이름 추출 시도 (이름:, 성명: 등의 패턴)
  if (!name) {
    const namePatterns = [
      /이름\s*[:：]\s*([가-힣]{2,4})/,
      /성명\s*[:：]\s*([가-힣]{2,4})/,
      /지원자\s*[:：]\s*([가-힣]{2,4})/,
      /^([가-힣]{2,4})\s/m  // 줄 시작의 한글 이름
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        name = match[1];
        break;
      }
    }
  }
  
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
    "금융권": ["카드", "은행", "증권", "커머셜", "저축은행", "KB", "신한", "하나", "우리", "국민", "금융", "투자", "자산운용", "신용카드", "캐피탈"],
    "보험": ["보험", "손해보험", "생명보험", "삼성생명", "한화생명", "교보생명", "메리츠", "현대해상", "DB손해보험", "KB손해보험"],
    "공공": ["공공기관", "관공서", "정부", "시청", "구청", "도청", "부처", "청", "공단", "공사", "공기업", "e-gov", "eGov", "전자정부", "egov", "framework"],
    "이커머스": ["복지몰", "쇼핑몰", "이커머스", "온라인쇼핑", "전자상거래", "쿠팡", "11번가", "G마켓", "옥션", "네이버쇼핑"],
    "물류": ["mes", "공장", "plm", "wmf", "wms", "물류", "제조", "생산", "SCM", "유통", "창고관리"],
    "통신": ["skt", "lgu+", "kt", "통신", "텔레콤", "SKT", "LG유플러스", "KT"],
    "삼성경험자": ["삼성전자", "삼성sds", "삼성", "Samsung"],
    "IT": ["IT", "소프트웨어", "개발", "시스템", "네이버", "카카오", "라인", "배달의민족"]
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
    "iOS": ["ios", "swift", "object-c", "objective-c", "iPhone", "iPad", "Xcode", "iOS개발"],
    "안드로이드": ["android", "안드로이드", "kotlin", "java", "android studio"],
    "웹개발": ["웹", "프론트엔드", "백엔드", "풀스택", "React", "Vue", "Angular", "JavaScript", "HTML", "CSS"],
    "모바일": ["모바일", "앱개발", "React Native", "Flutter", "하이브리드"],
    "데이터베이스": ["DB", "데이터베이스", "Oracle", "MySQL", "PostgreSQL", "DBA", "SQL"],
    "DevOps": ["DevOps", "Docker", "Kubernetes", "AWS", "Azure", "CI/CD", "Jenkins", "인프라"],
    "보안": ["보안", "Security", "암호화", "인증", "방화벽", "정보보안"],
    "AI/ML": ["AI", "ML", "머신러닝", "딥러닝", "데이터분석", "Python", "TensorFlow", "PyTorch"]
  };

  for (const [spec, keywords] of Object.entries(specializationKeywords)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()))) {
      specialization = spec;
      break;
    }
  }

  // 6. 주력 스킬 추출 (상위 3개)
  const mainSkills = foundSkills.slice(0, 3);
  
  // 7. 전문 분야는 이미 위에서 결정되었음 (specialization 변수 사용)

  console.log(`📊 분석 완료: 경력 ${maxExperience}년, 학력 ${education}, 등급 ${grade}`);
  console.log(`🎯 주력 스킬: ${mainSkills.join(', ')}, 전문분야: ${specialization}`);

  return {
    name,
    experience: maxExperience > 0 ? `${maxExperience}년` : "신입",
    education,
    grade,
    skills: foundSkills,
    industry,
    specialization,
    mainSkills,
    specialty: specialization
  };
}

// 파일 업로드 설정
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  }
});

// Gemini AI 설정
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("🚀 Routes.ts 로드됨!");
  
  // AI 에이전트 - 이력서 분석 전용
  app.post("/api/ai-agent/analyze", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ 
          response: "AI 분석을 위해 GEMINI_API_KEY가 필요합니다. 시스템 관리자에게 문의하세요.",
          suggestions: []
        });
      }

      console.log("AI 에이전트 요청 받음:", message);
      
      // 요청 유형 확인
      const isResumeRelated = message.toLowerCase().includes('이력서') || 
                             message.toLowerCase().includes('resume') ||
                             message.toLowerCase().includes('인재') ||
                             message.toLowerCase().includes('개발자') ||
                             message.toLowerCase().includes('분석');
                             
      const isProjectRegistration = message.toLowerCase().includes('프로젝트') && 
                                   (message.toLowerCase().includes('등록') ||
                                    message.toLowerCase().includes('추가') ||
                                    message.toLowerCase().includes('만들') ||
                                    message.toLowerCase().includes('생성'));
                                    
      const isCalendarRegistration = (message.toLowerCase().includes('일정') ||
                                     message.toLowerCase().includes('미팅') ||
                                     message.toLowerCase().includes('회의') ||
                                     message.toLowerCase().includes('약속')) &&
                                    (message.toLowerCase().includes('등록') ||
                                     message.toLowerCase().includes('추가') ||
                                     message.toLowerCase().includes('만들') ||
                                     message.toLowerCase().includes('생성'));
                             
      const isSalesRelated = message.toLowerCase().includes('매출') ||
                            message.toLowerCase().includes('계약') ||
                            message.toLowerCase().includes('수익') ||
                            message.toLowerCase().includes('금액') ||
                            message.toLowerCase().includes('revenue') ||
                            message.toLowerCase().includes('sales');
                            
      const isGeneralAnalysis = message.toLowerCase().includes('통계') ||
                               message.toLowerCase().includes('현황') ||
                               message.toLowerCase().includes('상태') ||
                               message.toLowerCase().includes('관리');

      // 서버에서 직접 최신 데이터 가져오기
      const resumes = await storage.getAllResumes();
      const projects = await storage.getAllProjects();
      const contracts = await storage.getAllContracts();
      
      console.log("AI 에이전트에서 가져온 데이터:");
      console.log("- 이력서:", resumes.length, "개");
      console.log("- 프로젝트:", projects.length, "개");
      console.log("- 계약:", contracts.length, "개");
      
      // 매출 분석을 위한 데이터 준비
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // 이번 달 매출 계산 (거래유형이 "매출"이고 승인/진행중인 계약 중 이번 달에 시작된 것)
      const thisMonthRevenue = contracts
        .filter(c => {
          const startDate = new Date(c.startDate);
          return c.transactionType === "매출" && 
                 (c.status === "승인" || c.status === "진행중") && 
                 startDate.getMonth() === currentMonth && 
                 startDate.getFullYear() === currentYear;
        })
        .reduce((sum, c) => {
          const amount = c.amount?.replace(/[^0-9]/g, '') || '0';
          return sum + parseInt(amount);
        }, 0);
      
      // 전체 매출 계산 (거래유형이 "매출"이고 승인/진행중인 모든 계약)
      const totalRevenue = contracts
        .filter(c => c.transactionType === "매출" && (c.status === "승인" || c.status === "진행중"))
        .reduce((sum, c) => {
          const amount = c.amount?.replace(/[^0-9]/g, '') || '0';
          return sum + parseInt(amount);
        }, 0);
      
      const activeProjects = projects.filter(p => p.status === "진행중").length;
      const completedProjects = projects.filter(p => p.status === "완료").length;

      // Gemini AI로 요청 처리
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      let prompt = "";
      let aiResponse = "";

      // 프로젝트 등록 처리
      if (isProjectRegistration) {
        prompt = `
프로젝트 등록 요청: ${message}

다음 정보를 추출하여 프로젝트를 등록하겠습니다:
1. title: 프로젝트명
2. description: 프로젝트 설명
3. requiredSkills: 필요 기술 (배열 형태)
4. budget: 예산 (금액만, 예: "5000만원")
5. deadline: 마감일 (YYYY-MM-DD 형태)
6. client: 발주처/클라이언트명
7. status: "모집중"으로 고정
8. projectType: 개발/SI/SM/유지보수 중 하나
9. teamSize: 필요 인원수 (숫자만)
10. location: 근무지

프로젝트 정보를 JSON 형태로 추출해주세요:
{
  "title": "프로젝트명",
  "description": "상세 설명",
  "requiredSkills": ["Java", "Spring"],
  "budget": "5000만원",
  "deadline": "2024-12-31",
  "client": "클라이언트명",
  "status": "모집중",
  "projectType": "개발",
  "teamSize": 5,
  "location": "서울"
}

추출할 수 없는 정보는 적절한 기본값으로 설정해주세요.
`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        try {
          // JSON 추출
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const projectData = JSON.parse(jsonMatch[0]);
            
            // 프로젝트 등록
            const newProject = await storage.createProject({
              title: projectData.title || "새 프로젝트",
              location: projectData.location || "서울",
              duration: projectData.deadline || "2024-12-31",
              grade: "중급",
              headcount: String(projectData.teamSize || 1),
              tasks: projectData.description || "프로젝트 설명",
              amount: projectData.budget || "미정",
              source: "AI 에이전트",
              status: "모집중",
              skills: projectData.requiredSkills || [],
              coreSkills: projectData.requiredSkills ? projectData.requiredSkills.slice(0, 3).join(', ') : null,
              coreWork: projectData.projectType || "개발",
              description: projectData.description || null
            });
            
            aiResponse = `✅ 프로젝트가 성공적으로 등록되었습니다!\n\n**등록된 프로젝트 정보:**\n- 프로젝트명: ${newProject.title}\n- 설명: ${newProject.tasks}\n- 필요기술: ${newProject.skills.join(', ')}\n- 예산: ${newProject.amount}\n- 기간: ${newProject.duration}\n- 인원: ${newProject.headcount}명\n- 근무지: ${newProject.location}\n\n프로젝트 페이지에서 확인하실 수 있습니다.`;
          } else {
            aiResponse = "프로젝트 정보 추출에 실패했습니다. 더 구체적인 정보를 제공해주세요.";
          }
        } catch (error) {
          aiResponse = "프로젝트 등록 중 오류가 발생했습니다. 다시 시도해주세요.";
        }
      }
      // 일정 등록 처리
      else if (isCalendarRegistration) {
        prompt = `
일정 등록 요청: ${message}

다음 정보를 추출하여 일정을 등록하겠습니다:
1. title: 일정 제목
2. date: 날짜 (YYYY-MM-DD 형태)
3. time: 시간 (HH:MM 형태)
4. description: 일정 설명
5. location: 장소

일정 정보를 JSON 형태로 추출해주세요:
{
  "title": "일정 제목",
  "date": "2024-06-01",
  "time": "14:00",
  "description": "일정 설명",
  "location": "장소"
}

추출할 수 없는 정보는 적절한 기본값으로 설정해주세요.
`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        try {
          // JSON 추출
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const eventData = JSON.parse(jsonMatch[0]);
            
            // 일정 등록
            const newEvent = await storage.createCalendarEvent({
              title: eventData.title || "새 일정",
              date: new Date(eventData.date || new Date().toISOString().split('T')[0]),
              time: eventData.time || "09:00",
              description: eventData.description || "일정 설명",
              memo: eventData.location || "미정",
              type: "meeting"
            });
            
            aiResponse = `✅ 일정이 성공적으로 등록되었습니다!\n\n**등록된 일정 정보:**\n- 제목: ${newEvent.title}\n- 날짜: ${newEvent.date.toISOString().split('T')[0]}\n- 시간: ${newEvent.time}\n- 설명: ${newEvent.description}\n- 장소: ${newEvent.memo}\n\n캘린더 페이지에서 확인하실 수 있습니다.`;
          } else {
            aiResponse = "일정 정보 추출에 실패했습니다. 더 구체적인 정보를 제공해주세요.";
          }
        } catch (error) {
          aiResponse = "일정 등록 중 오류가 발생했습니다. 다시 시도해주세요.";
        }
      }
      // 이력서 분석 처리
      else if (isResumeRelated) {
        // 특정 이름이 언급된 경우 해당 이력서만 찾기
        let targetResumes = resumes;
        const nameMatches = [
          message.match(/([가-힣]{2,4})\s*이력서/),
          message.match(/([가-힣]{2,4})\s*분석/),
          message.match(/([가-힣]{2,4})\s*님/)
        ];
        
        const nameMatch = nameMatches.find(match => match !== null);
        
        if (nameMatch) {
          const targetName = nameMatch[1];
          console.log(`🔍 이름 검색: "${targetName}"`);
          console.log(`📋 등록된 이력서:`, resumes.map(r => r.fileName));
          
          targetResumes = resumes.filter((resume: any) => {
            if (!resume.fileName) return false;
            
            // 파일명을 정규화하고 다양한 방식으로 매칭 시도
            const normalizedFileName = resume.fileName.normalize('NFC');
            
            // 1. 단순 포함 검사
            if (normalizedFileName.includes(targetName)) return true;
            
            // 2. 파일명 앞부분에서 이름 추출하여 매칭
            const namePatterns = [
              /^([가-힣]{2,4})[_\s]/,          // "최충_" 패턴
              /^([가-힣]{2,4})[._]/,           // "최충." 패턴  
              /^([가-힣]{2,4})[\s-]/,          // "최충 " 또는 "최충-" 패턴
              /^([가-힣]{2,4})/                // 단순히 앞의 한글만
            ];
            
            for (const pattern of namePatterns) {
              const match = normalizedFileName.match(pattern);
              if (match && match[1] === targetName) {
                return true;
              }
            }
            
            return false;
          });
          
          console.log(`🎯 매칭된 이력서: ${targetResumes.length}개`);
          
          if (targetResumes.length === 0) {
            aiResponse = `"${targetName}"님의 이력서를 찾을 수 없습니다. 등록된 이력서를 확인해주세요.`;
          }
        }
        
        if (targetResumes.length > 0) {
          prompt = `
이력서 분석 요청: ${message}

분석 대상 이력서:
${targetResumes.map((resume: any) => `
파일명: ${resume.fileName}
백엔드 등급 계산: ${resume.grade || '미계산'}
이력서 내용: ${resume.extractedText || '내용 없음'}
등록시 분류된 업계: ${resume.industry || '미분류'}
등록시 분류된 전문분야: ${resume.specialty || '미분류'}
등록시 기술스택: ${resume.skills ? resume.skills.join(', ') : '미분류'}
`).join('')}

분석 결과를 다음 형식으로 한글로만 답변해주세요:

**이력서 분석 결과**

📊 **백엔드 시스템 분석**
- 시스템 계산 등급: [백엔드에서 계산된 등급]
- 경력 분석: [백엔드 분석 경력]
- 학력 분석: [백엔드 분석 학력]

🤖 **AI 분석**
- 이름: [파일명에서 추출한 이름]
- 업계: [텍스트 분석으로 파악한 업계]
- 전문분야: [텍스트 분석으로 파악한 전문분야]
- 주력기술: [AI가 분석한 주력 기술 3개]
- 보유기술: [AI가 분석한 전체 기술]
`;
          
          const result = await model.generateContent(prompt);
          const response = result.response;
          aiResponse = response.text();
        }
      }
      // 기타 분석 요청
      else {
        // 계약 상세 정보 준비
        const contractDetails = contracts.map(c => `
- **${c.contractName}:** ${c.amount}원 (거래유형: ${c.transactionType}, 상태: ${c.status}, 시작일: ${c.startDate}, 거래처: ${c.clientName || '미지정'})
`).join('');

        prompt = `
질문: ${message}

현재 시스템 데이터:
프로젝트: ${projects.length}개 (진행중 ${activeProjects}개, 완료 ${completedProjects}개)
이력서: ${resumes.length}개

계약 현황 (총 ${contracts.length}개):
${contractDetails}

이번 달 매출: ${thisMonthRevenue.toLocaleString()}원
전체 매출: ${totalRevenue.toLocaleString()}원

매출 계산 기준:
- 거래유형이 "매출"이고 승인된 계약은 모두 매출로 산정합니다
- 계약 상태가 "진행중"이어도 승인된 매출 계약은 매출액에 포함됩니다
- 이번 달에 시작된 매출 계약은 이번 달 매출로 계산됩니다

위 데이터를 바탕으로 질문에 정확히 답변해주세요. 특히 매출 관련 질문이면 승인된 매출 계약의 구체적인 금액과 계약 정보를 포함해서 답변하세요.
`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        aiResponse = response.text();
      }

      res.json({
        response: aiResponse,
        suggestions: []
      });

    } catch (error) {
      console.error("AI 분석 오류:", error);
      res.status(500).json({ 
        response: "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        suggestions: []
      });
    }
  });

  // 기존 라우트들
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      console.log("📋 프로젝트 조회 결과:", projects.length, "개");
      if (projects.length > 0) {
        console.log("프로젝트 목록:", projects.map(p => ({ id: p.id, title: p.title })));
      }
      res.json(projects);
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ message: "프로젝트 조회 실패" });
    }
  });

  // 새로운 코드 기반 이력서 업로드
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

      // null 바이트 및 기타 문제가 되는 문자 제거 (PostgreSQL 호환성)
      extractedText = extractedText
        .replace(/\0/g, '') // null 바이트 제거
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // 기타 제어 문자 제거
        .trim();
      
      console.log("🧹 텍스트 정리 완료, 최종 길이:", extractedText.length);



      // AI 기반 이력서 분석 (코드 기반 분석을 백업으로 사용)
      const analysisResult = await analyzeResumeWithAI(extractedText, fileName);
      
      // 하드코딩된 등급 계산 로직 (경력과 학력 기반)
      const expYears = parseInt(analysisResult.experience?.replace(/[^0-9]/g, '') || '0') || 0;
      const education = analysisResult.education || '';
      let calculatedGrade = '초급'; // 기본값
      
      console.log("📊 등급 계산:", { 경력년수: expYears, 학력: education });
      
      if (education.includes('학사') || education.includes('대학교') || education.includes('대졸')) {
        // 학사: 1-6년(초급), 7-9년(중급), 10년+(고급)
        if (expYears <= 6) calculatedGrade = '초급';
        else if (expYears <= 9) calculatedGrade = '중급';
        else calculatedGrade = '고급';
      } else if (education.includes('전문') || education.includes('고등학교') || education.includes('고졸')) {
        // 전문대/고졸: 1-9년(초급), 10-12년(중급), 13년+(고급)
        if (expYears <= 9) calculatedGrade = '초급';
        else if (expYears <= 12) calculatedGrade = '중급';
        else calculatedGrade = '고급';
      } else {
        // 학력 불명: 1-6년(초급), 7-9년(중급), 10년+(고급)
        if (expYears <= 6) calculatedGrade = '초급';
        else if (expYears <= 9) calculatedGrade = '중급';
        else calculatedGrade = '고급';
      }
      
      // 계산된 등급을 AI 결과에 덮어쓰기
      analysisResult.grade = calculatedGrade;
      console.log("✅ 최종 등급:", calculatedGrade);
      
      console.log("🎯 AI 분석 결과:", {
        경력: analysisResult.experience,
        학력: analysisResult.education, 
        등급: analysisResult.grade,
        기술스택: analysisResult.skills?.length || 0,
        주력스킬: analysisResult.mainSkills?.join(', ') || '없음',
        전문분야: analysisResult.specialty || '일반'
      });

      // 이름 추출 로직
      let candidateName = analysisResult.name;
      console.log("🔍 AI 분석 결과 이름:", candidateName);
      
      // 파일명에서 이름 추출 (AI 분석과 관계없이 항상 시도)
      if (fileName) {
        console.log("📝 파일명에서 이름 추출 시도:", fileName);
        
        // Unicode 정규화로 분해된 한글을 완성형으로 변환
        const normalizedFileName = fileName.normalize('NFC');
        console.log("📝 정규화된 파일명:", normalizedFileName);
        
        // 다양한 패턴 시도
        const patterns = [
          /^([가-힣]{2,4})[_\s]/,          // "최충_초급" 패턴
          /^([가-힣]{2,4})[._]/,           // "최충.초급" 패턴
          /^([가-힣]{2,4})[\s-]/,          // "최충 초급" 또는 "최충-초급" 패턴
          /^([가-힣]{2,4})/                // 단순히 앞의 한글만
        ];
        
        for (const pattern of patterns) {
          const nameMatch = normalizedFileName.match(pattern);
          console.log("🔍 패턴 테스트:", pattern, "결과:", nameMatch);
          if (nameMatch && nameMatch[1]) {
            candidateName = nameMatch[1];
            console.log("✅ 파일명에서 이름 추출 성공:", candidateName, "패턴:", pattern);
            break;
          }
        }
        
        if (!candidateName) {
          console.log("❌ 파일명에서 이름 추출 실패, 파일명:", fileName);
        }
      }
      
      console.log("🎯 최종 후보자 이름:", candidateName);

      const source = req.body.source || "직접 접수"; // 출처 정보 추가
      const email = req.body.email || ""; // 이메일 정보 추가
      const phone = req.body.phone || ""; // 연락처 정보 추가
      
      // 백엔드 코드로 직접 분석 (AI 분석 대신 사용)
      const backendAnalysis = analyzeResumeContent(extractedText, fileName);
      
      const finalResumeData = {
        fileName,
        extractedText,
        source,
        email,
        phone,
        skills: backendAnalysis.skills,
        experience: backendAnalysis.experience,
        education: backendAnalysis.education,
        grade: backendAnalysis.grade, // 백엔드 분석 결과 사용
        industry: backendAnalysis.industry,
        specialization: backendAnalysis.specialization,
        mainSkills: analysisResult.mainSkills, // AI가 분석한 주력 스킬
        specialty: analysisResult.specialty // AI가 분석한 전문 분야
      };

      const savedResume = await storage.createResume(finalResumeData);
      
      res.json(savedResume);
      
    } catch (error) {
      console.error("Upload resume error:", error);
      res.status(500).json({ message: "이력서 업로드 실패" });
    }
  });

  // 프로젝트 등록
  app.post("/api/projects", async (req, res) => {
    try {
      console.log("🎯 프로젝트 등록 요청:", req.body.title);
      const project = await storage.createProject(req.body);
      console.log("✅ 프로젝트 저장 완료:", project.id, project.title);
      res.json(project);
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({ message: "프로젝트 등록 실패" });
    }
  });

  // 프로젝트별 지원자 목록 조회
  app.get("/api/projects/:projectId/applications", async (req, res) => {
    try {
      // 캐시 방지 헤더 추가
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      const projectId = parseInt(req.params.projectId);
      const applications = await storage.getAllApplications();
      
      console.log(`🔍 전체 지원서 ${applications.length}개:`, applications.map(app => 
        `ID: ${app.id}, projectId: ${app.projectId || 'undefined'}, resumeId: ${app.resumeId}`
      ));
      
      // projectId로 직접 필터링
      const projectApplications = applications.filter(app => 
        app.projectId === projectId
      );
      
      const project = await storage.getProject(projectId);
      console.log(`📋 프로젝트 "${project?.title}" 지원자 ${projectApplications.length}명`);
      if (projectApplications.length > 0) {
        console.log("📋 지원자 상세:", projectApplications.map(app => `${app.resumeName} (${app.status})`));
      }
      
      res.json(projectApplications);
    } catch (error) {
      console.error("Get project applications error:", error);
      res.status(500).json({ message: "지원자 목록 조회 실패" });
    }
  });

  // 지원 상태 업데이트
  app.put("/api/applications/:id/status", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status } = req.body;
      
      const updatedApplication = await storage.updateApplication(applicationId, { status });
      if (!updatedApplication) {
        return res.status(404).json({ message: "지원서를 찾을 수 없습니다" });
      }
      
      console.log(`✅ 지원 상태 업데이트: ${updatedApplication.resumeName} → ${status}`);
      res.json(updatedApplication);
    } catch (error) {
      console.error("Update application status error:", error);
      res.status(500).json({ message: "지원 상태 업데이트 실패" });
    }
  });

  // 전체 지원서 목록 조회 (디버깅용)
  app.get("/api/applications", async (req, res) => {
    try {
      const applications = await storage.getAllApplications();
      console.log(`🔍 전체 지원서 목록: ${applications.length}개`);
      applications.forEach(app => {
        console.log(`- ID: ${app.id}, projectId: ${app.projectId}, resumeId: ${app.resumeId}, 이름: ${app.resumeName}`);
      });
      res.json(applications);
    } catch (error) {
      console.error("Get all applications error:", error);
      res.status(500).json({ message: "지원서 목록 조회 실패" });
    }
  });

  // 지원서 등록
  app.post("/api/applications", async (req, res) => {
    try {
      console.log("📝 지원서 등록 요청:", req.body);
      
      const { resumeId, projectId } = req.body;
      
      // 중복 지원 체크
      const existingApplications = await storage.getAllApplications();
      const duplicateApplication = existingApplications.find(app => 
        app.resumeId === resumeId && app.projectId === projectId
      );
      
      if (duplicateApplication) {
        console.log("❌ 중복 지원 감지:", `이력서 ID ${resumeId} → 프로젝트 ID ${projectId}`);
        return res.status(409).json({ 
          message: "이미 해당 프로젝트에 지원하셨습니다",
          existingApplication: duplicateApplication
        });
      }
      
      // 이력서와 프로젝트 정보 가져오기
      const resume = await storage.getResume(resumeId);
      const project = await storage.getProject(projectId);
      
      console.log("🔍 이력서 조회 결과:", resume ? `${resume.fileName} (ID: ${resume.id})` : "없음");
      console.log("🔍 프로젝트 조회 결과:", project ? `${project.title} (ID: ${project.id})` : "없음");
      
      if (!resume || !project) {
        console.log("❌ 이력서 또는 프로젝트 찾기 실패");
        return res.status(400).json({ message: "이력서 또는 프로젝트를 찾을 수 없습니다" });
      }
      
      // 완전한 지원서 데이터 구성
      const applicationData = {
        ...req.body,
        resumeName: resume.fileName,
        clientCompany: project.title,
        targetCompany: project.title,
      };
      
      console.log("🚀 지원서 데이터 생성:", applicationData);
      
      const application = await storage.createApplication(applicationData);
      
      console.log("✅ 지원서 등록 완료:", application);
      
      // 등록 후 전체 지원서 수 확인
      const allApplications = await storage.getAllApplications();
      console.log(`📊 전체 지원서 수: ${allApplications.length}개`);
      
      res.json(application);
    } catch (error) {
      console.error("❌ Create application error:", error);
      res.status(500).json({ message: "지원서 등록 실패" });
    }
  });

  // 전체 지원서 목록 조회 (지원 상태 확인용)
  app.get("/api/applications", async (req, res) => {
    try {
      // 캐시 방지 헤더 추가
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      const applications = await storage.getAllApplications();
      
      console.log(`🔍 전체 지원서 목록: ${applications.length}개`);
      applications.forEach(app => {
        console.log(`- ID: ${app.id}, projectId: ${app.projectId}, resumeId: ${app.resumeId}, 이름: ${app.resumeName}`);
      });
      
      res.json(applications);
    } catch (error) {
      console.error("❌ Get applications error:", error);
      res.status(500).json({ message: "지원서 조회 실패" });
    }
  });

  // 지원자 상태 업데이트 (합격 시 계약 대기 자동 생성)
  app.put("/api/applications/:id", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status } = req.body;
      
      console.log(`📝 지원자 상태 업데이트: ID ${applicationId} -> ${status}`);
      
      // 기존 지원서 정보 조회
      const existingApplication = await storage.getApplication(applicationId);
      if (!existingApplication) {
        return res.status(404).json({ message: "지원서를 찾을 수 없습니다" });
      }
      
      // 지원자 상태 업데이트
      const updatedApplication = await storage.updateApplication(applicationId, { status });
      
      // 합격 상태로 변경된 경우 계약 대기 자동 생성
      if (status === "합격") {
        console.log("🎉 합격 처리 - 계약 대기 생성 시작");
        
        // 관련 프로젝트 정보 조회
        const project = await storage.getProject(existingApplication.projectId);
        if (project) {
          try {
            const contract = await storage.createContractFromApplication(existingApplication, project);
            console.log("✅ 계약 대기 생성 완료:", contract.contractName);
          } catch (error) {
            console.error("❌ 계약 대기 생성 실패:", error);
            // 계약 생성 실패해도 지원자 상태 업데이트는 유지
          }
        }
      }
      
      res.json(updatedApplication);
    } catch (error) {
      console.error("❌ Update application error:", error);
      res.status(500).json({ message: "지원자 상태 업데이트 실패" });
    }
  });

  // 지원자 삭제 API
  app.delete("/api/applications/:id", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      console.log(`🗑️ 지원자 삭제 요청: ID ${applicationId}`);
      
      const success = await storage.deleteApplication(applicationId);
      
      if (success) {
        console.log("✅ 지원자 삭제 완료");
        res.json({ message: "지원자가 삭제되었습니다" });
      } else {
        res.status(404).json({ message: "지원자를 찾을 수 없습니다" });
      }
    } catch (error) {
      console.error("❌ Delete application error:", error);
      res.status(500).json({ message: "지원자 삭제 실패" });
    }
  });

  // 이력서 삭제 API
  app.delete("/api/resumes/:id", async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      console.log(`🗑️ 이력서 삭제 요청: ID ${resumeId}`);
      
      // 삭제 전 이력서 존재 확인
      const existingResume = await storage.getResume(resumeId);
      console.log("📄 삭제 대상 이력서:", existingResume ? existingResume.fileName : "없음");
      
      const success = await storage.deleteResume(resumeId);
      console.log("🔄 삭제 결과:", success);
      
      if (success) {
        console.log("✅ 이력서 삭제 완료");
        
        // 삭제 후 전체 이력서 수 확인
        const allResumes = await storage.getAllResumes();
        console.log("📊 삭제 후 남은 이력서 수:", allResumes.length);
        
        res.json({ message: "이력서가 삭제되었습니다" });
      } else {
        console.log("❌ 이력서를 찾을 수 없음");
        res.status(404).json({ message: "이력서를 찾을 수 없습니다" });
      }
    } catch (error) {
      console.error("❌ Delete resume error:", error);
      res.status(500).json({ message: "이력서 삭제 실패" });
    }
  });

  // 계약 조회 API
  app.get("/api/contracts", async (req, res) => {
    try {
      const contracts = await storage.getAllContracts();
      console.log(`📋 계약 조회 결과: ${contracts.length}개`);
      res.json(contracts);
    } catch (error) {
      console.error("❌ Get contracts error:", error);
      res.status(500).json({ message: "계약 조회 실패" });
    }
  });

  // 계약 생성 API
  app.post("/api/contracts", async (req, res) => {
    try {
      console.log("📝 계약 생성 요청 데이터:", req.body);
      
      // 날짜 필드를 명시적으로 Date 객체로 변환 (paymentDate는 텍스트)
      const contractData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
        endDate: req.body.endDate ? new Date(req.body.endDate) : new Date(),
        paymentDate: req.body.paymentDate || null, // 텍스트 그대로 저장
      };
      
      console.log("🔄 처리된 계약 데이터:", contractData);
      
      const contract = await storage.createContract(contractData);
      console.log("✅ 계약 생성 완료:", contract.contractName);
      res.json(contract);
    } catch (error) {
      console.error("❌ Create contract error:", error);
      res.status(500).json({ message: "계약 생성 실패" });
    }
  });

  // 계약 수정 API (PUT)
  app.put("/api/contracts/:id", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const updatedContract = await storage.updateContract(contractId, req.body);
      
      if (updatedContract) {
        console.log("✅ 계약 수정 완료:", updatedContract.contractName, "상태:", updatedContract.status);
        res.json(updatedContract);
      } else {
        res.status(404).json({ message: "계약을 찾을 수 없습니다" });
      }
    } catch (error) {
      console.error("❌ Update contract error:", error);
      res.status(500).json({ message: "계약 수정 실패" });
    }
  });

  // 계약 수정 API (PATCH)
  app.patch("/api/contracts/:id", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      console.log(`🔄 계약 상태 변경 요청: ID ${contractId}`, req.body);
      
      // 날짜 처리 - 이미 Date 객체이거나 ISO 문자열인 경우 적절히 변환
      const updateData = { ...req.body };
      
      if (updateData.startDate) {
        updateData.startDate = typeof updateData.startDate === 'string' 
          ? new Date(updateData.startDate) 
          : updateData.startDate;
      }
      
      if (updateData.endDate) {
        updateData.endDate = typeof updateData.endDate === 'string' 
          ? new Date(updateData.endDate) 
          : updateData.endDate;
      }
      
      // paymentDate는 텍스트 필드이므로 Date 변환하지 않음
      // updateData.paymentDate는 그대로 문자열로 유지
      
      console.log("🔄 처리된 수정 데이터:", updateData);
      
      const updatedContract = await storage.updateContract(contractId, updateData);
      
      if (updatedContract) {
        console.log("✅ 계약 상태 변경 완료:", updatedContract.contractName, "→", updatedContract.status);
        res.json(updatedContract);
      } else {
        res.status(404).json({ message: "계약을 찾을 수 없습니다" });
      }
    } catch (error) {
      console.error("❌ Update contract error:", error);
      res.status(500).json({ message: "계약 수정 실패" });
    }
  });

  // 계약 삭제 API
  app.delete("/api/contracts/:id", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const success = await storage.deleteContract(contractId);
      
      if (success) {
        console.log("✅ 계약 삭제 완료");
        res.json({ message: "계약이 삭제되었습니다" });
      } else {
        res.status(404).json({ message: "계약을 찾을 수 없습니다" });
      }
    } catch (error) {
      console.error("❌ Delete contract error:", error);
      res.status(500).json({ message: "계약 삭제 실패" });
    }
  });

  // AI 프로젝트 분석 및 등록
  app.post("/api/ai-agent/analyze-project", async (req, res) => {
    try {
      const { message } = req.body;
      console.log("🤖 AI 프로젝트 분석 요청:", message);

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "AI 분석을 위한 API 키가 설정되지 않았습니다." 
        });
      }

      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `다음 프로젝트 정보를 분석하여 JSON 형태로 정리해주세요.

프로젝트 정보:
${message}

다음 형식으로 응답해주세요:
{
  "title": "프로젝트 제목",
  "coreWork": "핵심 업무 (간단명료하게)",
  "coreSkills": ["핵심기술1", "핵심기술2"],
  "description": "기타 요구사항 및 상세 조건",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD", 
  "budget": "예산 정보",
  "level": "초급/중급/고급",
  "location": "위치 정보",
  "headcount": "인원수"
}

분류 규칙:
- title: 회사명과 주요 업무를 포함한 간결한 제목
- coreWork: 핵심 업무만 간단명료하게 작성 (예: "웹 화면 개발 및 운영")
- coreSkills: 필수 기술스택만 배열로 추출
- description: 필수조건, 나이제한, 우대사항 등 기타 모든 요구사항
- startDate: "즉시"인 경우 오늘 날짜, 과거 날짜인 경우 오늘 날짜로 변경
- endDate: 종료 날짜
- level: "초급", "중급", "고급" 중 하나
- headcount: "3명", "1명" 형태로 추출
- 정보가 없는 필드는 빈 문자열 또는 빈 배열 사용`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      console.log("🤖 AI 응답:", responseText);

      // JSON 파싱 시도
      let parsedData;
      try {
        // JSON 코드 블록이 있다면 제거
        const cleanedResponse = responseText.replace(/```json\s*|\s*```/g, '').trim();
        parsedData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("JSON 파싱 실패:", parseError);
        return res.status(500).json({ 
          error: "AI 응답을 파싱할 수 없습니다.",
          rawResponse: responseText 
        });
      }

      // 날짜 처리 로직
      const today = new Date().toISOString().split('T')[0];
      let startDate = parsedData.startDate || today;
      const endDate = parsedData.endDate || today;
      
      // 시작일이 과거인 경우 오늘 날짜로 변경
      if (new Date(startDate) < new Date(today)) {
        startDate = today;
      }

      // 프로젝트 등록 데이터 준비
      const projectData = {
        source: "AI 분석",
        title: parsedData.title || "제목 없음",
        description: parsedData.description || "",
        skills: Array.isArray(parsedData.coreSkills) ? parsedData.coreSkills : [],
        coreSkills: Array.isArray(parsedData.coreSkills) ? parsedData.coreSkills.join(', ') : "",
        coreWork: parsedData.coreWork || "",
        grade: ["초급", "중급", "고급"].includes(parsedData.level) ? parsedData.level : "중급",
        location: parsedData.location || "",
        duration: `${startDate} ~ ${endDate}`,
        headcount: parsedData.headcount || "1명",
        tasks: parsedData.coreWork || "",
        amount: parsedData.budget || "",
        status: "진행중" as const
      };

      // 프로젝트 등록
      const project = await storage.createProject(projectData);
      console.log("✅ AI 분석 프로젝트 등록 완료:", project.title);

      res.json({
        success: true,
        project,
        analysisData: parsedData,
        message: `프로젝트 "${project.title}"이(가) 성공적으로 등록되었습니다.`
      });

    } catch (error) {
      console.error("AI 프로젝트 분석 오류:", error);
      res.status(500).json({ 
        error: "AI 분석 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류"
      });
    }
  });

  // 캘린더 이벤트 조회 API
  app.get("/api/calendar-events", async (req, res) => {
    try {
      const events = await storage.getAllCalendarEvents();
      console.log(`📅 캘린더 이벤트 조회 결과: ${events.length}개`);
      res.json(events);
    } catch (error) {
      console.error("❌ Get calendar events error:", error);
      res.status(500).json({ message: "캘린더 이벤트 조회 실패" });
    }
  });

  // 캘린더 이벤트 생성 API
  app.post("/api/calendar-events", async (req, res) => {
    try {
      const event = await storage.createCalendarEvent(req.body);
      console.log("✅ 캘린더 이벤트 생성 완료:", event.title);
      res.json(event);
    } catch (error) {
      console.error("❌ Create calendar event error:", error);
      res.status(500).json({ message: "캘린더 이벤트 생성 실패" });
    }
  });

  // 캘린더 이벤트 삭제 API
  app.delete("/api/calendar-events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const success = await storage.deleteCalendarEvent(eventId);
      
      if (success) {
        console.log("✅ 캘린더 이벤트 삭제 완료");
        res.json({ message: "캘린더 이벤트가 삭제되었습니다" });
      } else {
        res.status(404).json({ message: "캘린더 이벤트를 찾을 수 없습니다" });
      }
    } catch (error) {
      console.error("❌ Delete calendar event error:", error);
      res.status(500).json({ message: "캘린더 이벤트 삭제 실패" });
    }
  });

  // 나머지 라우트들은 기존 것을 유지
  app.get("/api/resumes", async (req, res) => {
    try {
      // 캐시 방지 헤더 추가
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      const resumes = await storage.getAllResumes();
      console.log(`📋 이력서 조회 결과: ${resumes.length} 개`);
      
      // 각 이력서에 대해 블랙리스트 확인
      const resumesWithBlacklistCheck = await Promise.all(resumes.map(async (resume) => {
        let isBlacklisted = false;
        let candidateName = null;
        
        // 파일명에서 이름 추출
        if (resume.fileName) {
          // Unicode 정규화로 분해된 한글을 완성형으로 변환
          const normalizedFileName = resume.fileName.normalize('NFC');
          
          const patterns = [
            /^([가-힣]{2,4})[_\s]/,          // "최충_초급" 패턴
            /^([가-힣]{2,4})[._]/,           // "최충.초급" 패턴
            /^([가-힣]{2,4})[\s-]/,          // "최충 초급" 또는 "최충-초급" 패턴
            /^([가-힣]{2,4})/                // 단순히 앞의 한글만
          ];
          
          for (const pattern of patterns) {
            const nameMatch = normalizedFileName.match(pattern);
            if (nameMatch && nameMatch[1]) {
              candidateName = nameMatch[1];
              break;
            }
          }
          
          if (candidateName) {
            console.log(`🔍 블랙리스트 확인: ${candidateName}`);
            const blacklistItem = await storage.checkBlacklist(candidateName);
            if (blacklistItem) {
              isBlacklisted = true;
              console.log(`⚠️ 블랙리스트 대상 발견: ${candidateName}`);
            }
          }
        }
        
        return {
          ...resume,
          isBlacklisted,
          candidateName
        };
      }));
      
      res.json(resumesWithBlacklistCheck);
    } catch (error) {
      console.error("Get resumes error:", error);
      res.status(500).json({ message: "이력서 조회 실패" });
    }
  });

  // 블랙리스트 조회 API
  app.get("/api/blacklist", async (req, res) => {
    try {
      const blacklist = await storage.getAllBlacklist();
      console.log(`📋 블랙리스트 조회 결과: ${blacklist.length}개`);
      res.json(blacklist);
    } catch (error) {
      console.error("❌ Get blacklist error:", error);
      res.status(500).json({ message: "블랙리스트 조회 실패" });
    }
  });

  // 블랙리스트 등록 API
  app.post("/api/blacklist", async (req, res) => {
    try {
      console.log("📝 블랙리스트 등록 요청:", req.body);
      const blacklistItem = await storage.createBlacklist(req.body);
      console.log("✅ 블랙리스트 등록 완료:", blacklistItem.name);
      res.json(blacklistItem);
    } catch (error) {
      console.error("❌ Create blacklist error:", error);
      res.status(500).json({ message: "블랙리스트 등록 실패" });
    }
  });

  // 블랙리스트 삭제 API
  app.delete("/api/blacklist/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("🗑️ 블랙리스트 삭제 요청: ID", id);
      const deleted = await storage.deleteBlacklist(id);
      
      if (deleted) {
        console.log("✅ 블랙리스트 삭제 완료");
        res.json({ message: "블랙리스트가 삭제되었습니다" });
      } else {
        res.status(404).json({ message: "블랙리스트를 찾을 수 없습니다" });
      }
    } catch (error) {
      console.error("❌ Delete blacklist error:", error);
      res.status(500).json({ message: "블랙리스트 삭제 실패" });
    }
  });

  // 블랙리스트 확인 API
  app.get("/api/blacklist/check/:name", async (req, res) => {
    try {
      const name = req.params.name;
      const blacklistItem = await storage.checkBlacklist(name);
      
      if (blacklistItem) {
        console.log("⚠️ 블랙리스트 확인됨:", name);
        res.json({ isBlacklisted: true, item: blacklistItem });
      } else {
        res.json({ isBlacklisted: false });
      }
    } catch (error) {
      console.error("❌ Check blacklist error:", error);
      res.status(500).json({ message: "블랙리스트 확인 실패" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}