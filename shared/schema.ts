import { pgTable, text, serial, integer, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  duration: text("duration").notNull(),
  grade: text("grade").notNull(),
  headcount: text("headcount").notNull(), // 인원수 추가
  tasks: text("tasks").notNull(),
  amount: text("amount").notNull(),
  source: text("source").notNull(), // 프로젝트 출처 추가
  status: text("status").notNull().default("진행중"),
  skills: text("skills").array().notNull(),
  coreSkills: text("core_skills"), // 핵심 스킬 추가
  coreWork: text("core_work"), // 핵심 업무 추가
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  extractedText: text("extracted_text").notNull(),
  source: text("source").default("직접 접수"), // 이력서 출처 추가
  skills: text("skills").array(),
  experience: text("experience"),
  education: text("education"), // 학력 추가
  grade: text("grade"), // AI가 분석한 등급 추가
  industry: text("industry"), // 업계 분류 추가
  specialization: text("specialization"), // 주력 분야 추가
  mainSkills: text("main_skills").array(), // AI가 분석한 주력 스킬
  specialty: text("specialty"), // AI가 분석한 전문 분야
  memo: text("memo"), // 메모 추가
  hourlyRate: text("hourly_rate"), // 단가 추가
  email: text("email"), // 이메일 추가
  phone: text("phone"), // 연락처 추가
  applicationStatus: text("application_status").default("미지원"), // "미지원", "지원완료"
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const projectMatches = pgTable("project_matches", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  resumeId: integer("resume_id").references(() => resumes.id),
  matchScore: decimal("match_score", { precision: 5, scale: 2 }),
  skillMatch: text("skill_match").array(),
  analysis: text("analysis"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  contractName: text("contract_name").notNull(),
  clientName: text("client_name").notNull(), // 거래처명
  transactionType: text("transaction_type").notNull(), // 매입/매출
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  amount: text("amount").notNull(),
  netProfit: text("net_profit"), // 순이익
  paymentDate: text("payment_date"), // 지급일
  description: text("description"),
  status: text("status").notNull().default("계약 대기"), // 계약 대기, 진행중, 완료
  projectId: integer("project_id"), // 관련 프로젝트 ID
  applicationId: integer("application_id"), // 관련 지원서 ID
  createdAt: timestamp("created_at").defaultNow(),
});

export const forms = pgTable("forms", {
  id: serial("id").primaryKey(),
  formName: text("form_name").notNull(),
  fileName: text("file_name").notNull(),
  fileData: text("file_data").notNull(), // Base64 encoded file data
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  time: text("time"), // 시간 추가
  description: text("description"), // 상세 설명
  memo: text("memo"), // 메모
  type: text("type").notNull(), // "contract_end", "project_deadline", "memo", "meeting" 등
  relatedId: integer("related_id"), // 관련된 계약이나 프로젝트 ID
  createdAt: timestamp("created_at").defaultNow(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").notNull(),
  projectId: integer("project_id").notNull(), // 프로젝트 ID 추가
  resumeName: text("resume_name").notNull(), // 이력서 파일명
  clientCompany: text("client_company").notNull(), // 프로젝트를 받은 거래처명
  targetCompany: text("target_company").notNull(), // 인력 지원을 받은 거래처명
  status: text("status").notNull().default("지원"), // 지원, 결과대기, 탈락, 합격
  appliedAt: timestamp("applied_at").defaultNow(),
  notes: text("notes"), // 추가 메모
  receivedAmount: text("received_amount"), // 받는 금액
  paidAmount: text("paid_amount"), // 주는 금액
});

export const blacklist = pgTable("blacklist", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  birthDate: text("birth_date"),
  education: text("education"),
  memo: text("memo"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.string().min(1, "금액을 입력해주세요"),
});

export const insertResumeSchema = createInsertSchema(resumes).omit({
  id: true,
  uploadedAt: true,
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
}).extend({
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
});

export const insertFormSchema = createInsertSchema(forms).omit({
  id: true,
  uploadedAt: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  appliedAt: true,
});

export const insertBlacklistSchema = createInsertSchema(blacklist).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Resume = typeof resumes.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type ProjectMatch = typeof projectMatches.$inferSelect;
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Form = typeof forms.$inferSelect;
export type InsertForm = z.infer<typeof insertFormSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Blacklist = typeof blacklist.$inferSelect;
export type InsertBlacklist = z.infer<typeof insertBlacklistSchema>;
