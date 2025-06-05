import type { 
  User, InsertUser, 
  Project, InsertProject,
  Resume, InsertResume,
  ProjectMatch,
  Contract, InsertContract,
  Form, InsertForm,
  CalendarEvent, InsertCalendarEvent,
  Application, InsertApplication,
  Blacklist, InsertBlacklist
} from "../shared/schema.js";
import { 
  users, projects, resumes, projectMatches, contracts, forms, calendarEvents, applications, blacklist 
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Project methods
  createProject(project: InsertProject): Promise<Project>;
  getAllProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Resume methods
  createResume(resume: InsertResume): Promise<Resume>;
  getAllResumes(): Promise<Resume[]>;
  getResume(id: number): Promise<Resume | undefined>;
  updateResume(id: number, resume: Partial<Resume>): Promise<Resume | undefined>;
  deleteResume(id: number): Promise<boolean>;
  
  // Project Match methods
  createProjectMatch(match: Omit<ProjectMatch, 'id' | 'createdAt'>): Promise<ProjectMatch>;
  getMatchesForProject(projectId: number): Promise<ProjectMatch[]>;
  getMatchesForResume(resumeId: number): Promise<ProjectMatch[]>;
  getAllMatches(): Promise<ProjectMatch[]>;

  // Contract methods
  createContract(contract: InsertContract): Promise<Contract>;
  createContractFromApplication(application: Application, project: Project): Promise<Contract>;
  getAllContracts(): Promise<Contract[]>;
  getContract(id: number): Promise<Contract | undefined>;
  updateContract(id: number, contract: Partial<Contract>): Promise<Contract | undefined>;
  deleteContract(id: number): Promise<boolean>;

  // Form methods
  createForm(form: InsertForm): Promise<Form>;
  getAllForms(): Promise<Form[]>;
  getForm(id: number): Promise<Form | undefined>;
  deleteForm(id: number): Promise<boolean>;

  // Calendar Event methods
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  getAllCalendarEvents(): Promise<CalendarEvent[]>;
  getCalendarEvent(id: number): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: number): Promise<boolean>;

  // Application methods
  createApplication(application: InsertApplication): Promise<Application>;
  getAllApplications(): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  getApplicationsForProject(projectId: number): Promise<Application[]>;
  updateApplication(id: number, application: Partial<Application>): Promise<Application | undefined>;
  deleteApplication(id: number): Promise<boolean>;

  // Blacklist methods
  createBlacklist(blacklistItem: InsertBlacklist): Promise<Blacklist>;
  getAllBlacklist(): Promise<Blacklist[]>;
  getBlacklist(id: number): Promise<Blacklist | undefined>;
  deleteBlacklist(id: number): Promise<boolean>;
  checkBlacklist(name: string): Promise<Blacklist | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Resume methods
  async createResume(insertResume: InsertResume): Promise<Resume> {
    const [resume] = await db
      .insert(resumes)
      .values(insertResume)
      .returning();
    return resume;
  }

  async getAllResumes(): Promise<Resume[]> {
    return await db.select().from(resumes);
  }

  async getResume(id: number): Promise<Resume | undefined> {
    const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
    return resume;
  }

  async updateResume(id: number, updates: Partial<Resume>): Promise<Resume | undefined> {
    const [resume] = await db
      .update(resumes)
      .set(updates)
      .where(eq(resumes.id, id))
      .returning();
    return resume;
  }

  async deleteResume(id: number): Promise<boolean> {
    const result = await db.delete(resumes).where(eq(resumes.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Project methods
  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return result.rowCount > 0;
  }

  // Contract methods
  async createContract(insertContract: InsertContract): Promise<Contract> {
    const [contract] = await db
      .insert(contracts)
      .values(insertContract)
      .returning();
    return contract;
  }

  async createContractFromApplication(application: Application, project: Project): Promise<Contract> {
    const contractData: InsertContract = {
      contractName: `${project.title} - ${application.resumeName}`,
      clientName: project.source || "미정",
      transactionType: "매출",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
      amount: project.amount,
      status: "계약 대기",
      projectId: project.id,
      applicationId: application.id,
      description: `${application.resumeName} 합격자 계약`
    };
    
    return this.createContract(contractData);
  }

  async getAllContracts(): Promise<Contract[]> {
    return await db.select().from(contracts);
  }

  async getContract(id: number): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract;
  }

  async updateContract(id: number, updates: Partial<Contract>): Promise<Contract | undefined> {
    const [contract] = await db
      .update(contracts)
      .set(updates)
      .where(eq(contracts.id, id))
      .returning();
    return contract;
  }

  async deleteContract(id: number): Promise<boolean> {
    const result = await db.delete(contracts).where(eq(contracts.id, id));
    return result.rowCount > 0;
  }

  // Calendar Event methods
  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const [event] = await db
      .insert(calendarEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async getAllCalendarEvents(): Promise<CalendarEvent[]> {
    return await db.select().from(calendarEvents);
  }

  async getCalendarEvent(id: number): Promise<CalendarEvent | undefined> {
    const [event] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
    return event;
  }

  async deleteCalendarEvent(id: number): Promise<boolean> {
    const result = await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
    return result.rowCount > 0;
  }

  // Application methods
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db
      .insert(applications)
      .values(insertApplication)
      .returning();
    return application;
  }

  async getAllApplications(): Promise<Application[]> {
    return await db.select().from(applications);
  }

  async getApplication(id: number): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application;
  }

  async getApplicationsForProject(projectId: number): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.projectId, projectId));
  }

  async updateApplication(id: number, updates: Partial<Application>): Promise<Application | undefined> {
    const [application] = await db
      .update(applications)
      .set(updates)
      .where(eq(applications.id, id))
      .returning();
    return application;
  }

  async deleteApplication(id: number): Promise<boolean> {
    const result = await db.delete(applications).where(eq(applications.id, id));
    return result.rowCount > 0;
  }

  // Project Match methods
  async createProjectMatch(match: Omit<ProjectMatch, 'id' | 'createdAt'>): Promise<ProjectMatch> {
    const [projectMatch] = await db
      .insert(projectMatches)
      .values(match)
      .returning();
    return projectMatch;
  }

  async getMatchesForProject(projectId: number): Promise<ProjectMatch[]> {
    return await db.select().from(projectMatches).where(eq(projectMatches.projectId, projectId));
  }

  async getMatchesForResume(resumeId: number): Promise<ProjectMatch[]> {
    return await db.select().from(projectMatches).where(eq(projectMatches.resumeId, resumeId));
  }

  async getAllMatches(): Promise<ProjectMatch[]> {
    return await db.select().from(projectMatches);
  }

  // Form methods
  async createForm(insertForm: InsertForm): Promise<Form> {
    const [form] = await db
      .insert(forms)
      .values(insertForm)
      .returning();
    return form;
  }

  async getAllForms(): Promise<Form[]> {
    return await db.select().from(forms);
  }

  async getForm(id: number): Promise<Form | undefined> {
    const [form] = await db.select().from(forms).where(eq(forms.id, id));
    return form;
  }

  async deleteForm(id: number): Promise<boolean> {
    const result = await db.delete(forms).where(eq(forms.id, id));
    return result.rowCount > 0;
  }

  // User methods (기본 구현)
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Blacklist methods
  async createBlacklist(insertBlacklist: InsertBlacklist): Promise<Blacklist> {
    const [blacklistItem] = await db
      .insert(blacklist)
      .values(insertBlacklist)
      .returning();
    return blacklistItem;
  }

  async getAllBlacklist(): Promise<Blacklist[]> {
    return await db.select().from(blacklist);
  }

  async getBlacklist(id: number): Promise<Blacklist | undefined> {
    const [blacklistItem] = await db.select().from(blacklist).where(eq(blacklist.id, id));
    return blacklistItem;
  }

  async deleteBlacklist(id: number): Promise<boolean> {
    const result = await db.delete(blacklist).where(eq(blacklist.id, id));
    return result.rowCount > 0;
  }

  async checkBlacklist(name: string): Promise<Blacklist | undefined> {
    const [blacklistItem] = await db.select().from(blacklist).where(eq(blacklist.name, name));
    return blacklistItem;
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private resumes: Map<number, Resume>;
  private projectMatches: Map<number, ProjectMatch>;
  private contracts: Map<number, Contract>;
  private forms: Map<number, Form>;
  private calendarEvents: Map<number, CalendarEvent>;
  private applications: Map<number, Application>;
  private blacklistItems: Map<number, Blacklist>;
  private userIdCounter: number;
  private projectIdCounter: number;
  private resumeIdCounter: number;
  private matchIdCounter: number;
  private contractIdCounter: number;
  private formIdCounter: number;
  private eventIdCounter: number;
  private applicationIdCounter: number;
  private blacklistIdCounter: number;
  private dataFile: string = '';

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.resumes = new Map();
    this.projectMatches = new Map();
    this.contracts = new Map();
    this.forms = new Map();
    this.calendarEvents = new Map();
    this.applications = new Map();
    this.blacklistItems = new Map();
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.resumeIdCounter = 1;
    this.matchIdCounter = 1;
    this.contractIdCounter = 1;
    this.formIdCounter = 1;
    this.eventIdCounter = 1;
    this.applicationIdCounter = 1;
    this.blacklistIdCounter = 1;
  }

  // 모든 데이터 초기화 메서드
  clearAllData() {
    this.users.clear();
    this.projects.clear();
    this.resumes.clear();
    this.projectMatches.clear();
    this.contracts.clear();
    this.forms.clear();
    this.calendarEvents.clear();
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.resumeIdCounter = 1;
    this.matchIdCounter = 1;
    this.contractIdCounter = 1;
    this.formIdCounter = 1;
    this.eventIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Project methods
  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const project: Project = { 
      ...insertProject,
      status: insertProject.status || "진행중",
      description: insertProject.description || null,
      id, 
      createdAt: new Date() 
    };
    this.projects.set(id, project);
    return project;
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (project) {
      const updatedProject = { ...project, ...updates };
      this.projects.set(id, updatedProject);
      return updatedProject;
    }
    return undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Resume methods
  async createResume(insertResume: InsertResume): Promise<Resume> {
    const id = this.resumeIdCounter++;
    const resume: Resume = { 
      ...insertResume,
      skills: insertResume.skills || null,
      experience: insertResume.experience || null,
      industry: insertResume.industry || null,
      memo: insertResume.memo || null,
      hourlyRate: insertResume.hourlyRate || null,
      id, 
      uploadedAt: new Date() 
    };
    this.resumes.set(id, resume);
    return resume;
  }

  async getAllResumes(): Promise<Resume[]> {
    return Array.from(this.resumes.values());
  }

  async getResume(id: number): Promise<Resume | undefined> {
    return this.resumes.get(id);
  }

  async updateResume(id: number, updates: Partial<Resume>): Promise<Resume | undefined> {
    const resume = this.resumes.get(id);
    if (resume) {
      const updatedResume = { ...resume, ...updates };
      this.resumes.set(id, updatedResume);
      return updatedResume;
    }
    return undefined;
  }

  async deleteResume(id: number): Promise<boolean> {
    return this.resumes.delete(id);
  }

  // Project Match methods
  async createProjectMatch(insertMatch: Omit<ProjectMatch, 'id' | 'createdAt'>): Promise<ProjectMatch> {
    const id = this.matchIdCounter++;
    const match: ProjectMatch = { 
      ...insertMatch, 
      id, 
      createdAt: new Date() 
    };
    this.projectMatches.set(id, match);
    return match;
  }

  async getMatchesForProject(projectId: number): Promise<ProjectMatch[]> {
    return Array.from(this.projectMatches.values()).filter(
      match => match.projectId === projectId
    );
  }

  async getMatchesForResume(resumeId: number): Promise<ProjectMatch[]> {
    return Array.from(this.projectMatches.values()).filter(
      match => match.resumeId === resumeId
    );
  }

  async getAllMatches(): Promise<ProjectMatch[]> {
    return Array.from(this.projectMatches.values());
  }

  // Contract methods
  async createContract(insertContract: InsertContract): Promise<Contract> {
    const id = this.contractIdCounter++;
    const contract: Contract = { 
      ...insertContract,
      description: insertContract.description || null,
      status: insertContract.status || "계약 대기",
      projectId: insertContract.projectId || null,
      applicationId: insertContract.applicationId || null,
      netProfit: insertContract.netProfit || null,
      paymentDate: insertContract.paymentDate || null,
      id, 
      createdAt: new Date() 
    };
    this.contracts.set(id, contract);
    return contract;
  }

  // 지원자 상태가 합격으로 변경될 때 자동으로 계약 대기 생성
  async createContractFromApplication(application: Application, project: Project): Promise<Contract> {
    const contractData: InsertContract = {
      contractName: `${project.title} - ${application.resumeName}`,
      clientName: project.source || "미정",
      transactionType: "매출",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
      amount: project.amount,
      status: "계약 대기",
      projectId: project.id,
      applicationId: application.id,
      description: `${application.resumeName} 합격자 계약`
    };
    
    return this.createContract(contractData);
  }

  async getAllContracts(): Promise<Contract[]> {
    return Array.from(this.contracts.values());
  }

  async getContract(id: number): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async updateContract(id: number, updates: Partial<Contract>): Promise<Contract | undefined> {
    const contract = this.contracts.get(id);
    if (contract) {
      const updatedContract = { ...contract, ...updates };
      this.contracts.set(id, updatedContract);
      return updatedContract;
    }
    return undefined;
  }

  async deleteContract(id: number): Promise<boolean> {
    return this.contracts.delete(id);
  }

  // Form methods
  async createForm(insertForm: InsertForm): Promise<Form> {
    const id = this.formIdCounter++;
    const form: Form = { 
      ...insertForm, 
      id, 
      uploadedAt: new Date() 
    };
    this.forms.set(id, form);
    return form;
  }

  async getAllForms(): Promise<Form[]> {
    return Array.from(this.forms.values());
  }

  async getForm(id: number): Promise<Form | undefined> {
    return this.forms.get(id);
  }

  async deleteForm(id: number): Promise<boolean> {
    return this.forms.delete(id);
  }

  // Calendar Event methods
  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = this.eventIdCounter++;
    const event: CalendarEvent = { 
      ...insertEvent,
      relatedId: insertEvent.relatedId || null,
      id, 
      createdAt: new Date() 
    };
    this.calendarEvents.set(id, event);
    return event;
  }

  async getAllCalendarEvents(): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values());
  }

  async getCalendarEvent(id: number): Promise<CalendarEvent | undefined> {
    return this.calendarEvents.get(id);
  }

  async deleteCalendarEvent(id: number): Promise<boolean> {
    return this.calendarEvents.delete(id);
  }

  // Application methods
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.applicationIdCounter++;
    const application = { 
      id,
      resumeId: insertApplication.resumeId,
      projectId: insertApplication.projectId,
      resumeName: insertApplication.resumeName,
      clientCompany: insertApplication.clientCompany,
      targetCompany: insertApplication.targetCompany,
      status: insertApplication.status || "지원",
      appliedAt: new Date(),
      notes: insertApplication.notes || null,
      receivedAmount: insertApplication.receivedAmount || null,
      paidAmount: insertApplication.paidAmount || null,
    } as Application;
    this.applications.set(id, application);
    console.log(`💾 지원서 저장 완료: ID ${id}, projectId: ${application.projectId}, resumeId: ${application.resumeId}`);
    return application;
  }

  async getAllApplications(): Promise<Application[]> {
    return Array.from(this.applications.values());
  }

  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getApplicationsForProject(projectId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(app => app.projectId === projectId);
  }

  async updateApplication(id: number, updates: Partial<Application>): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, ...updates };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  async deleteApplication(id: number): Promise<boolean> {
    return this.applications.delete(id);
  }

  // Blacklist methods
  async createBlacklist(insertBlacklist: InsertBlacklist): Promise<Blacklist> {
    const blacklistItem: Blacklist = {
      id: this.blacklistIdCounter++,
      ...insertBlacklist,
      createdAt: new Date(),
    };
    this.blacklistItems.set(blacklistItem.id, blacklistItem);
    return blacklistItem;
  }

  async getAllBlacklist(): Promise<Blacklist[]> {
    return Array.from(this.blacklistItems.values());
  }

  async getBlacklist(id: number): Promise<Blacklist | undefined> {
    return this.blacklistItems.get(id);
  }

  async deleteBlacklist(id: number): Promise<boolean> {
    return this.blacklistItems.delete(id);
  }

  async checkBlacklist(name: string): Promise<Blacklist | undefined> {
    return Array.from(this.blacklistItems.values()).find(item => item.name === name);
  }
}

export const storage = new DatabaseStorage();
