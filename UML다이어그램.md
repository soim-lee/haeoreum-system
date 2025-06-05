# 해오름인포텍 업무시스템 UML 다이어그램

## 1. 클래스 다이어그램 (Class Diagram)

### 1.1 도메인 모델 클래스 다이어그램
```mermaid
classDiagram
    class User {
        +id: number
        +username: string
        +email: string
        +password: string
        +createdAt: Date
        +login()
        +logout()
        +updateProfile()
    }

    class Project {
        +id: number
        +projectName: string
        +clientName: string
        +transactionType: string
        +startDate: Date
        +endDate: Date
        +amount: string
        +netProfit: string
        +description: string
        +status: string
        +registeredBy: string
        +createdAt: Date
        +create()
        +update()
        +delete()
        +getStatus()
    }

    class Resume {
        +id: number
        +fileName: string
        +originalName: string
        +extractedText: string
        +name: string
        +contact: string
        +email: string
        +education: string
        +experience: number
        +grade: string
        +skills: string[]
        +industry: string
        +uploadedAt: Date
        +analyze()
        +matchProjects()
        +export()
    }

    class Application {
        +id: number
        +resumeId: number
        +projectId: number
        +status: string
        +appliedAt: Date
        +reviewedAt: Date
        +notes: string
        +apply()
        +updateStatus()
        +reject()
        +approve()
    }

    class Contract {
        +id: number
        +contractName: string
        +clientName: string
        +transactionType: string
        +startDate: Date
        +endDate: Date
        +amount: string
        +netProfit: string
        +paymentDate: string
        +status: string
        +projectId: number
        +applicationId: number
        +createdAt: Date
        +create()
        +update()
        +checkExpiration()
        +calculateRevenue()
    }

    class ProjectMatch {
        +id: number
        +resumeId: number
        +projectId: number
        +matchScore: number
        +matchedSkills: string[]
        +createdAt: Date
        +calculateScore()
        +getMatchDetails()
    }

    class CalendarEvent {
        +id: number
        +title: string
        +date: Date
        +time: string
        +description: string
        +createdAt: Date
        +create()
        +update()
        +delete()
    }

    class Blacklist {
        +id: number
        +name: string
        +birthDate: Date
        +education: string
        +reason: string
        +memo: string
        +createdAt: Date
        +add()
        +remove()
        +check()
    }

    class Form {
        +id: number
        +title: string
        +fileName: string
        +filePath: string
        +uploadedAt: Date
        +upload()
        +download()
        +delete()
    }

    %% Relationships
    User ||--o{ Project : "registers"
    Project ||--o{ Application : "receives"
    Resume ||--o{ Application : "applies to"
    Application ||--o| Contract : "creates"
    Project ||--o{ ProjectMatch : "matched with"
    Resume ||--o{ ProjectMatch : "matched to"
    User ||--o{ CalendarEvent : "creates"
    User ||--o{ Blacklist : "manages"
    User ||--o{ Form : "uploads"
```

### 1.2 서비스 클래스 다이어그램
```mermaid
classDiagram
    class AuthService {
        +validateAccessKey(key: string): boolean
        +createSession(user: User): Session
        +destroySession(sessionId: string): void
        +isAuthenticated(sessionId: string): boolean
    }

    class ProjectService {
        +createProject(data: ProjectData): Project
        +getProjects(): Project[]
        +updateProject(id: number, data: ProjectData): Project
        +deleteProject(id: number): boolean
        +searchProjects(query: string): Project[]
    }

    class ResumeAnalysisService {
        +extractText(file: File): string
        +analyzeResume(text: string): AnalysisResult
        +calculateGrade(education: string, experience: number): string
        +extractSkills(text: string): string[]
        +classifyIndustry(text: string): string
        +normalizeFileName(fileName: string): string
    }

    class ProjectMatchingService {
        +findMatches(resumeId: number): ProjectMatch[]
        +calculateMatchScore(resume: Resume, project: Project): number
        +getMatchedSkills(resume: Resume, project: Project): string[]
        +rankMatches(matches: ProjectMatch[]): ProjectMatch[]
    }

    class AIAgentService {
        +processQuery(query: string): string
        +analyzeBusinessData(): AnalysisResult
        +searchByName(name: string): Resume[]
        +calculateRevenue(filters: RevenueFilter): RevenueReport
        +getContractInfo(contractId: number): ContractInfo
    }

    class ContractService {
        +createContract(data: ContractData): Contract
        +autoCreateFromApplication(application: Application): Contract
        +getExpiringContracts(days: number): Contract[]
        +calculateRevenue(period: Period): RevenueReport
        +updateContractStatus(id: number, status: string): Contract
    }

    class CalendarService {
        +createEvent(data: EventData): CalendarEvent
        +getEvents(month: number, year: number): CalendarEvent[]
        +updateEvent(id: number, data: EventData): CalendarEvent
        +deleteEvent(id: number): boolean
        +getContractDeadlines(month: number, year: number): Contract[]
    }

    class BlacklistService {
        +addToBlacklist(data: BlacklistData): Blacklist
        +checkBlacklist(name: string): boolean
        +searchBlacklist(query: string): Blacklist[]
        +removeFromBlacklist(id: number): boolean
    }

    %% Dependencies
    ProjectService --> ProjectMatchingService
    ResumeAnalysisService --> BlacklistService
    ContractService --> CalendarService
    AIAgentService --> ProjectService
    AIAgentService --> ResumeAnalysisService
    AIAgentService --> ContractService
```

## 2. 시퀀스 다이어그램 (Sequence Diagram)

### 2.1 이력서 업로드 및 분석 프로세스
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant FileProcessor
    participant AIAnalyzer
    participant Database
    participant BlacklistService

    User->>Frontend: 이력서 파일 업로드
    Frontend->>Backend: POST /api/resumes (multipart/form-data)
    Backend->>FileProcessor: extractText(file)
    FileProcessor->>FileProcessor: 파일 형식 확인 (DOCX/PDF/TXT)
    FileProcessor->>FileProcessor: 텍스트 추출 (mammoth/pdf-parser)
    FileProcessor->>Backend: 추출된 텍스트 반환
    
    Backend->>AIAnalyzer: analyzeResume(text)
    AIAnalyzer->>AIAnalyzer: 이름, 연락처, 이메일 추출
    AIAnalyzer->>AIAnalyzer: 학력, 경력 기간 분석
    AIAnalyzer->>AIAnalyzer: 등급 계산 (주니어/미들/시니어)
    AIAnalyzer->>AIAnalyzer: 기술 스택 인식 (40+ 키워드)
    AIAnalyzer->>AIAnalyzer: 산업 분야 분류
    AIAnalyzer->>Backend: 분석 결과 반환
    
    Backend->>BlacklistService: checkBlacklist(name)
    BlacklistService->>Database: SELECT FROM blacklist
    Database->>BlacklistService: 블랙리스트 확인 결과
    BlacklistService->>Backend: 체크 결과 반환
    
    Backend->>Database: INSERT INTO resumes
    Database->>Backend: 저장 완료
    
    Backend->>Frontend: 201 Created (분석 결과 포함)
    Frontend->>User: 업로드 완료 및 분석 결과 표시
```

### 2.2 프로젝트 매칭 프로세스
```mermaid
sequenceDiagram
    participant Frontend
    participant Backend
    participant MatchingEngine
    participant Database
    participant AIService

    Frontend->>Backend: GET /api/resumes/{id}/matches
    Backend->>Database: SELECT resume details
    Database->>Backend: 이력서 정보 반환
    
    Backend->>Database: SELECT all active projects
    Database->>Backend: 프로젝트 목록 반환
    
    Backend->>MatchingEngine: findMatches(resume, projects)
    
    loop 각 프로젝트별
        MatchingEngine->>MatchingEngine: calculateMatchScore(resume, project)
        MatchingEngine->>MatchingEngine: 기술 스택 매칭 분석
        MatchingEngine->>MatchingEngine: 경력 레벨 적합성 확인
        MatchingEngine->>MatchingEngine: 산업 분야 일치도 계산
    end
    
    MatchingEngine->>MatchingEngine: rankMatches(matches)
    MatchingEngine->>Backend: 매칭 결과 반환 (점수순 정렬)
    
    Backend->>Database: INSERT INTO project_matches
    Database->>Backend: 매칭 결과 저장 완료
    
    Backend->>Frontend: 200 OK (매칭 결과)
    Frontend->>Frontend: 매칭 프로젝트 목록 표시
```

### 2.3 AI 에이전트 질의응답 프로세스
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant AIService
    participant OpenAI
    participant Database

    User->>Frontend: AI 에이전트에게 질문 입력
    Frontend->>Backend: POST /api/ai/query
    Backend->>AIService: processQuery(question)
    
    AIService->>AIService: 질문 유형 분석 (수익/프로젝트/이력서/계약)
    
    alt 데이터 조회가 필요한 경우
        AIService->>Database: 관련 데이터 조회
        Database->>AIService: 데이터 반환
        AIService->>AIService: 데이터 정리 및 분석
    end
    
    AIService->>OpenAI: GPT-4o API 호출
    Note over AIService,OpenAI: 시스템 프롬프트 + 사용자 질문 + 데이터 컨텍스트
    OpenAI->>AIService: AI 응답 생성
    
    AIService->>Backend: 최종 응답 반환
    Backend->>Frontend: 200 OK (AI 응답)
    Frontend->>User: AI 응답 표시
```

### 2.4 지원자 상태 변경 및 계약 생성 프로세스
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant ContractService
    participant Database
    participant CalendarService

    User->>Frontend: 지원자 상태를 "합격"으로 변경
    Frontend->>Backend: PUT /api/applications/{id}
    Backend->>Database: UPDATE applications SET status='합격'
    Database->>Backend: 상태 업데이트 완료
    
    Backend->>Database: SELECT application과 project 정보
    Database->>Backend: 지원자 및 프로젝트 데이터 반환
    
    Backend->>ContractService: autoCreateFromApplication(application, project)
    ContractService->>ContractService: 계약 데이터 자동 생성
    Note over ContractService: 프로젝트명, 거래처, 기간, 금액 등 매핑
    
    ContractService->>Database: INSERT INTO contracts
    Database->>ContractService: 계약 생성 완료
    
    ContractService->>CalendarService: 계약 종료일 캘린더 등록
    CalendarService->>Database: INSERT INTO calendar_events
    Database->>CalendarService: 캘린더 이벤트 생성 완료
    
    Backend->>Frontend: 200 OK (계약 생성 완료)
    Frontend->>User: 합격 처리 및 계약 자동 생성 알림
```

## 3. 유스케이스 다이어그램 (Use Case Diagram)

```mermaid
graph TB
    subgraph "해오름인포텍 업무시스템"
        subgraph "인증 관리"
            UC1[로그인]
            UC2[로그아웃]
            UC3[세션 관리]
        end
        
        subgraph "프로젝트 관리"
            UC4[프로젝트 등록]
            UC5[프로젝트 조회]
            UC6[프로젝트 수정]
            UC7[프로젝트 삭제]
        end
        
        subgraph "이력서 관리"
            UC8[이력서 업로드]
            UC9[이력서 분석]
            UC10[프로젝트 매칭]
            UC11[이력서 조회]
            UC12[이력서 삭제]
        end
        
        subgraph "지원자 관리"
            UC13[지원 접수]
            UC14[지원자 상태 관리]
            UC15[지원자 평가]
            UC16[합격 처리]
        end
        
        subgraph "계약 관리"
            UC17[계약 등록]
            UC18[자동 계약 생성]
            UC19[계약 조회]
            UC20[계약 수정]
            UC21[만료일 알림]
        end
        
        subgraph "캘린더 관리"
            UC22[일정 등록]
            UC23[일정 조회]
            UC24[일정 수정]
            UC25[월 네비게이션]
        end
        
        subgraph "AI 서비스"
            UC26[자연어 질의]
            UC27[데이터 분석]
            UC28[이력서 검색]
            UC29[수익 계산]
        end
        
        subgraph "블랙리스트 관리"
            UC30[블랙리스트 등록]
            UC31[블랙리스트 조회]
            UC32[블랙리스트 검색]
        end
        
        subgraph "양식 관리"
            UC33[양식 업로드]
            UC34[양식 다운로드]
            UC35[양식 관리]
        end
        
        subgraph "대시보드"
            UC36[통계 조회]
            UC37[차트 분석]
            UC38[최근 활동 확인]
        end
    end
    
    %% Actors
    Manager[관리자]
    Employee[직원]
    AIAgent[AI 에이전트]
    System[시스템]
    
    %% Relationships
    Manager --> UC1
    Manager --> UC4
    Manager --> UC8
    Manager --> UC13
    Manager --> UC17
    Manager --> UC22
    Manager --> UC26
    Manager --> UC30
    Manager --> UC33
    Manager --> UC36
    
    Employee --> UC1
    Employee --> UC5
    Employee --> UC9
    Employee --> UC11
    Employee --> UC19
    Employee --> UC23
    Employee --> UC26
    Employee --> UC34
    Employee --> UC36
    
    AIAgent --> UC9
    AIAgent --> UC10
    AIAgent --> UC27
    AIAgent --> UC28
    AIAgent --> UC29
    
    System --> UC18
    System --> UC21
    System --> UC32
```

## 4. 상태 다이어그램 (State Diagram)

### 4.1 지원자 상태 다이어그램
```mermaid
stateDiagram-v2
    [*] --> 지원
    지원 --> 검토중 : 검토 시작
    검토중 --> 거절 : 불합격 판정
    검토중 --> 합격 : 합격 판정
    거절 --> [*] : 프로세스 종료
    합격 --> 계약생성 : 자동 계약 생성
    계약생성 --> [*] : 프로세스 완료
    
    지원 : entry / 지원 접수 알림
    검토중 : entry / 검토자 배정
    검토중 : do / 이력서 평가
    거절 : entry / 거절 사유 기록
    합격 : entry / 합격 통지
    계약생성 : entry / 계약서 자동 생성
```

### 4.2 계약 상태 다이어그램
```mermaid
stateDiagram-v2
    [*] --> 진행중
    진행중 --> 완료 : 정상 완료
    진행중 --> 해지 : 중도 해지
    진행중 --> 만료예정 : 종료일 임박 (7일 이내)
    만료예정 --> 완료 : 정상 만료
    만료예정 --> 연장 : 계약 연장
    연장 --> 진행중 : 연장 계약 체결
    완료 --> [*] : 최종 완료
    해지 --> [*] : 해지 처리 완료
    
    진행중 : entry / 프로젝트 시작
    진행중 : do / 진행률 모니터링
    만료예정 : entry / 만료 알림 발송
    완료 : entry / 완료 보고서 생성
    해지 : entry / 해지 사유 기록
```

### 4.3 이력서 분석 상태 다이어그램
```mermaid
stateDiagram-v2
    [*] --> 업로드
    업로드 --> 파일검증 : 파일 형식 확인
    파일검증 --> 텍스트추출 : 유효한 파일
    파일검증 --> 오류 : 지원하지 않는 형식
    텍스트추출 --> AI분석 : 텍스트 추출 완료
    텍스트추출 --> 오류 : 추출 실패
    AI분석 --> 블랙리스트확인 : AI 분석 완료
    블랙리스트확인 --> 매칭수행 : 정상 지원자
    블랙리스트확인 --> 차단 : 블랙리스트 해당
    매칭수행 --> 완료 : 매칭 완료
    오류 --> [*] : 처리 실패
    차단 --> [*] : 차단 처리
    완료 --> [*] : 분석 완료
    
    업로드 : entry / 파일 임시 저장
    파일검증 : do / DOCX, PDF, TXT 확인
    텍스트추출 : do / mammoth, pdf-parser 실행
    AI분석 : do / 이름, 학력, 경력, 기술 추출
    블랙리스트확인 : do / 이름 기반 검색
    매칭수행 : do / 프로젝트 적합도 계산
```

## 5. 컴포넌트 다이어그램 (Component Diagram)

```mermaid
graph TB
    subgraph "Frontend Layer"
        subgraph "React Components"
            Dashboard[대시보드]
            Projects[프로젝트 관리]
            Resumes[이력서 관리]
            Applications[지원자 관리]
            Contracts[계약 관리]
            Calendar[캘린더]
            AIAgent[AI 에이전트]
            Blacklist[블랙리스트]
        end
        
        subgraph "UI Components"
            Forms[폼 컴포넌트]
            Tables[테이블 컴포넌트]
            Charts[차트 컴포넌트]
            Modals[모달 컴포넌트]
        end
        
        subgraph "State Management"
            QueryClient[React Query]
            FormState[Form State]
        end
    end
    
    subgraph "Backend Layer"
        subgraph "API Routes"
            AuthAPI[인증 API]
            ProjectAPI[프로젝트 API]
            ResumeAPI[이력서 API]
            ContractAPI[계약 API]
            CalendarAPI[캘린더 API]
            AIAPI[AI API]
        end
        
        subgraph "Business Services"
            AuthService[인증 서비스]
            ProjectService[프로젝트 서비스]
            ResumeService[이력서 서비스]
            MatchingService[매칭 서비스]
            ContractService[계약 서비스]
            CalendarService[캘린더 서비스]
            AIService[AI 서비스]
            BlacklistService[블랙리스트 서비스]
        end
        
        subgraph "Data Access"
            Storage[스토리지 인터페이스]
            DrizzleORM[Drizzle ORM]
        end
    end
    
    subgraph "External Services"
        OpenAI[OpenAI API]
        FileProcessor[파일 처리기]
    end
    
    subgraph "Database"
        PostgreSQL[(PostgreSQL)]
    end
    
    %% Dependencies
    Dashboard --> QueryClient
    Projects --> QueryClient
    Resumes --> QueryClient
    Applications --> QueryClient
    Contracts --> QueryClient
    Calendar --> QueryClient
    AIAgent --> QueryClient
    
    QueryClient --> AuthAPI
    QueryClient --> ProjectAPI
    QueryClient --> ResumeAPI
    QueryClient --> ContractAPI
    QueryClient --> CalendarAPI
    QueryClient --> AIAPI
    
    AuthAPI --> AuthService
    ProjectAPI --> ProjectService
    ResumeAPI --> ResumeService
    ContractAPI --> ContractService
    CalendarAPI --> CalendarService
    AIAPI --> AIService
    
    ResumeService --> MatchingService
    ResumeService --> BlacklistService
    ContractService --> CalendarService
    AIService --> OpenAI
    ResumeService --> FileProcessor
    
    AuthService --> Storage
    ProjectService --> Storage
    ResumeService --> Storage
    ContractService --> Storage
    CalendarService --> Storage
    AIService --> Storage
    BlacklistService --> Storage
    
    Storage --> DrizzleORM
    DrizzleORM --> PostgreSQL
```

## 6. 배포 다이어그램 (Deployment Diagram)

```mermaid
graph TB
    subgraph "Client Environment"
        Browser[웹 브라우저]
        Mobile[모바일 브라우저]
    end
    
    subgraph "Replit Cloud Platform"
        subgraph "Application Server"
            Frontend[React Frontend<br/>Port: 5173]
            Backend[Express Backend<br/>Port: 5000]
        end
        
        subgraph "Database Server"
            PostgreSQL[(PostgreSQL<br/>Port: 5432)]
        end
        
        subgraph "File Storage"
            FileSystem[로컬 파일 시스템]
        end
    end
    
    subgraph "External Services"
        OpenAIAPI[OpenAI API<br/>api.openai.com]
    end
    
    Browser -->|HTTPS| Frontend
    Mobile -->|HTTPS| Frontend
    Frontend -->|HTTP API| Backend
    Backend -->|TCP/IP| PostgreSQL
    Backend -->|File I/O| FileSystem
    Backend -->|HTTPS| OpenAIAPI
```

이 UML 다이어그램들은 시스템의 구조, 동작 흐름, 상태 변화를 체계적으로 문서화하여 개발팀의 이해를 돕고 향후 시스템 확장 시 참고 자료로 활용할 수 있습니다.

사용자가이드와 UML 다이어그램을 완성했습니다.

**사용자가이드 주요 내용:**
- 12개 주요 기능별 상세 사용법
- 단계별 스크린샷 설명 (텍스트 기반)
- 자주 발생하는 문제 해결 방법
- 효과적인 업무 흐름 가이드
- 기술 지원 연락처

**UML 다이어그램 주요 내용:**
- 클래스 다이어그램: 도메인 모델 및 서비스 구조
- 시퀀스 다이어그램: 주요 업무 프로세스 흐름
- 유스케이스 다이어그램: 시스템 기능과 사용자 역할
- 상태 다이어그램: 지원자, 계약, 이력서 상태 변화
- 컴포넌트 다이어그램: 시스템 아키텍처 구조
- 배포 다이어그램: 인프라 구성

이 문서들은 사용자 교육, 개발팀 온보딩, 시스템 유지보수에 활용하실 수 있습니다.