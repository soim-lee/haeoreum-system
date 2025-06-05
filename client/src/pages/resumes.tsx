import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import UploadResumeSection from "@/components/upload-resume-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Upload, 
  Edit, 
  Trash2, 
  Clock,
  User,
  Briefcase,
  Download,
  Send,
  Search,
  X
} from "lucide-react";
import { Link } from "wouter";
import type { Resume, ProjectMatch, Project } from "@shared/schema";

export default function ResumesPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [memo, setMemo] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedResumes, setSelectedResumes] = useState<Set<number>>(new Set());
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedResumeForApply, setSelectedResumeForApply] = useState<Resume | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectSearchTerm, setProjectSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [testResumes, setTestResumes] = useState<Resume[]>([]);

  const { data: resumes = [], isLoading } = useQuery<Resume[]>({
    queryKey: ["/api/resumes"],
    queryFn: async () => {
      const response = await fetch("/api/resumes");
      if (!response.ok) {
        throw new Error("이력서 목록을 불러올 수 없습니다");
      }
      return response.json();
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("프로젝트 목록을 불러올 수 없습니다");
      }
      return response.json();
    },
  });

  // 전체 지원서 목록 조회 (지원 상태 확인용)
  const { data: applications = [] } = useQuery({
    queryKey: ["/api/applications"],
    queryFn: async () => {
      const response = await fetch("/api/applications");
      if (!response.ok) {
        throw new Error("지원서 목록을 불러올 수 없습니다");
      }
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const fetchResumesDirectly = async () => {
    try {
      const response = await fetch('/api/resumes');
      const data = await response.json();
      setTestResumes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch resumes error:", error);
      setTestResumes([]);
    }
  };

  // 페이지 로드 시 자동으로 데이터 가져오기
  useEffect(() => {
    fetchResumesDirectly();
  }, []);

  // 실시간 업데이트 - 폴링 방식
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const response = await fetch('/api/resumes');
        const newResumes = await response.json();
        const currentResumes = resumes.length > 0 ? resumes : testResumes;
        
        if (JSON.stringify(newResumes) !== JSON.stringify(currentResumes)) {
          console.log('이력서 데이터 변경 감지 - 목록 업데이트');
          setTestResumes(newResumes);
          
          if (newResumes.length > currentResumes.length) {
            toast({ title: "새 이력서가 등록되었습니다!", description: "목록이 자동으로 업데이트되었습니다." });
          } else if (newResumes.length < currentResumes.length) {
            toast({ title: "이력서가 삭제되었습니다!", description: "목록이 자동으로 업데이트되었습니다." });
          } else {
            toast({ title: "이력서가 수정되었습니다!", description: "목록이 자동으로 업데이트되었습니다." });
          }
        }
      } catch (error) {
        console.error('실시간 업데이트 확인 오류:', error);
      }
    };

    const intervalId = setInterval(checkForUpdates, 2000);
    return () => clearInterval(intervalId);
  }, [resumes, testResumes]);

  const { data: matches = [] } = useQuery<ProjectMatch[]>({
    queryKey: ["/api/project-matches"],
  });



  const uploadResumeMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("resume", file);
        
        const response = await fetch("/api/upload-resume", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`${file.name} 업로드 실패`);
        }
        
        return { file: file.name, result: await response.json() };
      });
      
      return await Promise.all(uploadPromises);
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-matches"] });
      setSelectedFiles([]);
      setIsUploading(false);
      toast({ title: `${results.length}개의 이력서가 성공적으로 업로드되었습니다!` });
    },
    onError: (error) => {
      toast({ title: "일부 이력서 업로드에 실패했습니다.", variant: "destructive" });
    },
  });

  const updateResumeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Resume> }) => 
      apiRequest("PATCH", "/api/resumes/" + id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      setEditingResume(null);
      setMemo("");
      setHourlyRate("");
      toast({ title: "이력서가 업데이트되었습니다!" });
    },
  });

  const deleteResumeMutation = useMutation({
    mutationFn: (id: number) => {
      console.log("🗑️ 삭제 요청:", id);
      return apiRequest("DELETE", `/api/resumes/${id}`);
    },
    onSuccess: () => {
      console.log("✅ 삭제 성공");
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-matches"] });
      toast({ title: "이력서가 삭제되었습니다!" });
    },
    onError: (error) => {
      console.error("❌ 삭제 실패:", error);
      toast({ title: "이력서 삭제에 실패했습니다.", variant: "destructive" });
    }
  });

  const deleteManyResumesMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => apiRequest("DELETE", "/api/resumes/" + id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-matches"] });
      setSelectedResumes(new Set());
      toast({ title: "선택한 이력서들이 삭제되었습니다!" });
    },
  });

  const handleFileUpload = (files: File[]) => {
    uploadResumeMutation.mutate(files);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleEdit = (resume: Resume) => {
    setEditingResume(resume);
    setMemo(resume.memo || "");
    setHourlyRate(resume.hourlyRate || "");
    setEmail(resume.email || "");
    setPhone(resume.phone || "");
  };

  const handleSaveEdit = () => {
    if (editingResume) {
      updateResumeMutation.mutate({
        id: editingResume.id,
        data: { memo, hourlyRate, email, phone }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("정말로 이 이력서를 삭제하시겠습니까?")) {
      deleteResumeMutation.mutate(id);
    }
  };

  // 지원취소 뮤테이션
  const cancelApplicationMutation = useMutation({
    mutationFn: (resumeId: number) => apiRequest("DELETE", `/api/applications/resume/${resumeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: "지원이 취소되었습니다" });
    },
    onError: () => {
      toast({ title: "지원취소에 실패했습니다", variant: "destructive" });
    },
  });

  const handleCancelApplication = (resumeId: number) => {
    if (confirm("정말로 지원을 취소하시겠습니까? 관련 지원결과 데이터가 모두 삭제됩니다.")) {
      cancelApplicationMutation.mutate(resumeId);
    }
  };

  // 지원하기 팝업 관련 함수들
  const handleApplyClick = (resume: Resume) => {
    setSelectedResumeForApply(resume);
    setApplyDialogOpen(true);
    setSelectedProjectId("");
    setProjectSearchTerm("");
  };

  const handleApplySubmit = async () => {
    if (!selectedResumeForApply || !selectedProjectId) {
      toast({ title: "프로젝트를 선택해주세요", variant: "destructive" });
      return;
    }
    
    try {
      console.log("🚀 지원서 전송 시작:", {
        resumeId: selectedResumeForApply.id,
        projectId: parseInt(selectedProjectId),
        resumeName: selectedResumeForApply.fileName
      });
      
      // 지원하기 API 호출 (직접 fetch 사용)
      const applicationData = {
        resumeId: selectedResumeForApply.id,
        projectId: parseInt(selectedProjectId),
        status: "지원",
        notes: `${selectedResumeForApply.fileName}으로 지원`
      };
      
      console.log("📡 서버 요청 전송 중...", applicationData);
      
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(applicationData),
      });
      
      console.log("📡 서버 응답 상태:", response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ 서버 오류 응답:", errorText);
        throw new Error(`서버 오류: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("✅ 지원서 전송 성공:", result);
      
      toast({ title: "지원이 완료되었습니다!" });
      setApplyDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
    } catch (error) {
      console.error("❌ 지원서 전송 실패:", error);
      toast({ title: `지원에 실패했습니다: ${error.message}`, variant: "destructive" });
    }
  };

  // 이력서의 지원 상태 확인 함수
  const getResumeApplicationStatus = (resumeId: number) => {
    const resumeApplications = applications.filter((app: any) => app.resumeId === resumeId);
    if (resumeApplications.length === 0) return null;
    
    // 가장 최근 지원서의 상태 반환
    const latestApplication = resumeApplications.sort((a: any, b: any) => 
      new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    )[0];
    
    return {
      status: latestApplication.status,
      projectName: latestApplication.targetCompany,
      appliedAt: latestApplication.appliedAt
    };
  };

  // 해당 이력서가 지원한 프로젝트 ID 목록 가져오기
  const getAppliedProjectIds = (resumeId: number) => {
    return applications
      .filter((app: any) => app.resumeId === resumeId)
      .map((app: any) => app.projectId);
  };

  // 이력서 검색 필터링 함수
  const getFilteredResumes = () => {
    if (!searchTerm.trim()) return resumes;

    return resumes.filter((resume: Resume) => {
      const searchLower = searchTerm.toLowerCase();
      
      // 전체 검색
      if (searchFilter === "all") {
        return (
          resume.fileName.toLowerCase().includes(searchLower) ||
          (resume.extractedText && resume.extractedText.toLowerCase().includes(searchLower)) ||
          (resume.skills && resume.skills.join(' ').toLowerCase().includes(searchLower)) ||
          (resume.source && resume.source.toLowerCase().includes(searchLower))
        );
      }
      
      // 이름으로 검색
      if (searchFilter === "name") {
        return resume.fileName.toLowerCase().includes(searchLower) ||
               (resume.extractedText && resume.extractedText.toLowerCase().includes(searchLower));
      }
      
      // 스킬로 검색
      if (searchFilter === "skills") {
        return resume.skills && resume.skills.join(' ').toLowerCase().includes(searchLower);
      }
      
      // 출처로 검색
      if (searchFilter === "source") {
        return resume.source && resume.source.toLowerCase().includes(searchLower);
      }
      
      return true;
    });
  };

  // 프로젝트 검색 필터링 (이미 지원한 프로젝트 제외)
  const getAvailableProjects = (resumeId?: number) => {
    let availableProjects = projects.filter(project =>
      project.title.toLowerCase().includes(projectSearchTerm.toLowerCase())
    );

    // 특정 이력서가 선택된 경우, 이미 지원한 프로젝트 제외
    if (resumeId) {
      const appliedProjectIds = getAppliedProjectIds(resumeId);
      availableProjects = availableProjects.filter(project => 
        !appliedProjectIds.includes(project.id)
      );
    }

    return availableProjects;
  };

  const handleSelectResume = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedResumes);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedResumes(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedResumes(new Set(resumes.map(r => r.id)));
    } else {
      setSelectedResumes(new Set());
    }
  };

  const handleDeleteSelected = () => {
    if (selectedResumes.size === 0) {
      toast({ title: "삭제할 이력서를 선택해주세요.", variant: "destructive" });
      return;
    }
    
    if (confirm(`선택한 ${selectedResumes.size}개의 이력서를 삭제하시겠습니까?`)) {
      deleteManyResumesMutation.mutate(Array.from(selectedResumes));
    }
  };

  const handleDownload = (resume: Resume) => {
    // 다운로드 링크 생성하여 클릭
    const link = document.createElement('a');
    link.href = `/api/resumes/${resume.id}/download`;
    link.download = `${resume.fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "이력서 다운로드를 시작합니다!" });
  };

  const getMatchesForResume = (resumeId: number) => {
    return matches.filter(match => match.resumeId === resumeId);
  };

  // AI가 분석한 등급 또는 기존 로직으로 백업 계산
  const getGradeFromResume = (resume: Resume) => {
    // AI가 분석한 등급이 있으면 우선 사용
    if (resume.grade) return resume.grade;
    
    // 백업: 경력과 학력 기반 계산
    if (!resume.experience) return null;
    
    const match = resume.experience.match(/(\d+)년/);
    if (!match) return null;
    
    const years = parseInt(match[1]);
    const education = resume.education || "학사";
    
    // 학력별 등급 기준 적용
    if (education === "전문학사") {
      if (years >= 1 && years <= 9) return "초급";
      if (years >= 10 && years <= 12) return "중급";
      if (years >= 13) return "고급";
    } else {
      // 학사, 대학원, 기타는 학사 기준 적용
      if (years >= 1 && years <= 6) return "초급";
      if (years >= 7 && years <= 9) return "중급";
      if (years >= 10) return "고급";
    }
    
    return null;
  };

  // 등급별 색상 설정
  const getGradeColor = (grade: string | null) => {
    switch (grade) {
      case "초급":
        return "bg-green-100 text-green-800 border border-green-200";
      case "중급":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "고급":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container-padding py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">이력서 관리</h1>
            <p className="text-gray-600">이력서를 업로드하고 AI 분석으로 프로젝트 매칭을 받아보세요</p>
          </div>
          <UploadResumeSection />
        </div>

        {/* 검색 기능 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="이력서 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={searchFilter} onValueChange={setSearchFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="검색 범위" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="name">이름</SelectItem>
                <SelectItem value="skills">스킬</SelectItem>
                <SelectItem value="source">출처</SelectItem>
              </SelectContent>
            </Select>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSearchFilter("all");
                }}
                className="whitespace-nowrap"
              >
                <X className="h-4 w-4 mr-2" />
                초기화
              </Button>
            )}
          </div>
          
          {searchTerm && (
            <div className="mt-3 text-sm text-gray-600">
              <span className="font-medium">{getFilteredResumes().length}</span>개의 이력서가 검색되었습니다.
            </div>
          )}
        </div>

        {/* 이력서 수정 모달 */}
        {editingResume && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>이력서 정보 수정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>파일명</Label>
                  <p className="text-gray-700">{editingResume.fileName}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">연락처</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010-1234-5678"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="memo">메모</Label>
                  <Textarea
                    id="memo"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="이 이력서에 대한 메모를 입력하세요"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="hourlyRate">시급/단가</Label>
                  <Input
                    id="hourlyRate"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="예: 50,000원/시간"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveEdit}
                    disabled={updateResumeMutation.isPending}
                  >
                    {updateResumeMutation.isPending ? "저장 중..." : "저장"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingResume(null);
                      setMemo("");
                      setHourlyRate("");
                      setEmail("");
                      setPhone("");
                    }}
                  >
                    취소
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 이력서 목록 */}
        <div className="space-y-6">
          {getFilteredResumes().length > 0 && (
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center space-x-4">
                <Checkbox
                  checked={selectedResumes.size === getFilteredResumes().length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600">
                  전체 선택 ({selectedResumes.size}/{getFilteredResumes().length})
                </span>
              </div>
              
              {selectedResumes.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={deleteManyResumesMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  선택한 이력서 삭제 ({selectedResumes.size})
                </Button>
              )}
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">이력서를 불러오는 중...</p>
            </div>
          ) : getFilteredResumes().length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? "검색 결과가 없습니다" : "등록된 이력서가 없습니다"}
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? "다른 검색어를 시도해보세요" : "상단의 이력서 업로드 버튼을 사용해보세요"}
                </p>
              </CardContent>
            </Card>
          ) : (
            getFilteredResumes().map((resume, index) => {
              const resumeMatches = getMatchesForResume(resume.id);
              
              return (
                <Card key={resume.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <Checkbox
                        checked={selectedResumes.has(resume.id)}
                        onCheckedChange={(checked) => handleSelectResume(resume.id, checked as boolean)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="font-semibold text-blue-600">#{index + 1}</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              {resume.fileName}
                            </h3>
                            {(resume as any).isBlacklisted && (
                              <Badge variant="destructive" className="bg-red-100 text-red-800 border border-red-200">
                                블랙리스트
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            {(() => {
                              const applicationStatus = getResumeApplicationStatus(resume.id);
                              if (applicationStatus) {
                                return (
                                  <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                                      {applicationStatus.status} → {applicationStatus.projectName}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleApplyClick(resume)}
                                      className="text-purple-600 hover:text-purple-700"
                                      title="추가 지원하기"
                                    >
                                      <Send className="h-4 w-4 mr-1" />
                                      추가지원
                                    </Button>
                                  </div>
                                );
                              } else {
                                return (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApplyClick(resume)}
                                    className="text-purple-600 hover:text-purple-700"
                                    title="지원하기"
                                  >
                                    <Send className="h-4 w-4 mr-1" />
                                    지원하기
                                  </Button>
                                );
                              }
                            })()}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(resume)}
                              className="text-green-600 hover:text-green-700"
                              title="다운로드"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(resume)}
                              className="text-blue-600 hover:text-blue-700"
                              title="수정"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(resume.id)}
                              className="text-red-600 hover:text-red-700"
                              title="삭제"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4 text-gray-600">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              {new Date(resume.uploadedAt!).toLocaleDateString()}
                            </div>
                            {resume.source && (
                              <div className="flex items-center">
                                <span className="text-sm px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                  📌 {resume.source}
                                </span>
                              </div>
                            )}
                            {resume.email && (
                              <div className="flex items-center">
                                <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                  📧 {resume.email}
                                </span>
                              </div>
                            )}
                            {resume.phone && (
                              <div className="flex items-center">
                                <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                  📞 {resume.phone}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* 등급 표시 */}
                          {getGradeFromResume(resume) && (
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(getGradeFromResume(resume))}`}>
                              {getGradeFromResume(resume)}
                            </div>
                          )}
                        </div>

                        {/* AI 분석 결과: 업계, 전문 분야, 주력 스킬 */}
                        <div className="mb-4 space-y-3">
                          {/* 업계 분류 */}
                          {resume.industry && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">🏢 업계</h4>
                              <div className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                                {resume.industry}
                              </div>
                            </div>
                          )}
                          
                          {/* 전문 분야 */}
                          {resume.specialty && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">🎯 전문 분야</h4>
                              <div className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                {resume.specialty}
                              </div>
                            </div>
                          )}
                          
                          {/* 주력 스킬 */}
                          {resume.mainSkills && resume.mainSkills.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">⭐ 주력 스킬</h4>
                              <div className="flex flex-wrap gap-2">
                                {resume.mainSkills.map((skill, skillIndex) => (
                                  <span key={skillIndex} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* 전체 스킬 (기존) */}
                          {resume.skills && resume.skills.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">🛠️ 전체 스킬</h4>
                              <div className="flex flex-wrap gap-1">
                                {resume.skills.slice(0, 8).map((skill, skillIndex) => (
                                  <span key={skillIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    {skill}
                                  </span>
                                ))}
                                {resume.skills.length > 8 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                                    +{resume.skills.length - 8}개 더
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {resumeMatches.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                              추천 프로젝트 ({resumeMatches.length}개)
                            </h4>
                            <div className="space-y-2">
                              {resumeMatches.map((match) => {
                                const project = projects.find((p: Project) => p.id === match.projectId);
                                if (!project) return null;
                                
                                return (
                                  <div key={match.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium text-blue-900">{project.title}</p>
                                        <p className="text-sm text-blue-700">매칭도: {match.matchScore}%</p>
                                      </div>
                                      <Badge className="bg-blue-100 text-blue-800">
                                        추천
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <Footer />

      {/* 지원하기 팝업 */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>프로젝트 지원하기</DialogTitle>
            <DialogDescription>
              {selectedResumeForApply?.fileName}로 지원할 프로젝트를 선택해주세요
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 프로젝트 검색 */}
            <div>
              <Label htmlFor="project-search">프로젝트 검색</Label>
              <Input
                id="project-search"
                placeholder="프로젝트명을 입력하세요..."
                value={projectSearchTerm}
                onChange={(e) => setProjectSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            
            {/* 프로젝트 선택 */}
            <div>
              <Label>프로젝트 선택</Label>
              <div className="mt-2 max-h-60 overflow-y-auto border rounded-md">
                {getAvailableProjects(selectedResumeForApply?.id).length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    지원 가능한 프로젝트가 없습니다 (이미 모든 프로젝트에 지원하셨습니다)
                  </div>
                ) : (
                  getAvailableProjects(selectedResumeForApply?.id).map((project) => (
                    <div
                      key={project.id}
                      className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                        selectedProjectId === project.id.toString() ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedProjectId(project.id.toString())}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="project"
                          value={project.id}
                          checked={selectedProjectId === project.id.toString()}
                          onChange={() => setSelectedProjectId(project.id.toString())}
                          className="text-blue-600"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{project.title}</h4>
                          <p className="text-sm text-gray-500">{project.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              project.status === '진행중' ? 'bg-green-100 text-green-800' :
                              project.status === '완료' ? 'bg-gray-100 text-gray-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {project.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {project.grade} · {project.headcount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleApplySubmit}
              disabled={!selectedProjectId}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              지원하기
            </Button>
            <Button
              variant="outline"
              onClick={() => setApplyDialogOpen(false)}
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}