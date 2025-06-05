import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Plus, 
  MapPin, 
  Calendar, 
  Star,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Users,
  UserCheck
} from "lucide-react";
import { insertProjectSchema, type Project, type InsertProject, type Application } from "@shared/schema";

export default function ProjectsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<"진행중" | "완료">("진행중");
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState("all");
  const [selectedProjectForApplications, setSelectedProjectForApplications] = useState<Project | null>(null);
  const [isApplicationsDialogOpen, setIsApplicationsDialogOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const availableSkills = [
    "Java", "Spring", "JavaScript", "React", "Node.js", "Python", "Django",
    "PHP", "Laravel", "C#", ".NET", "Angular", "Vue.js", "TypeScript",
    "MySQL", "PostgreSQL", "Oracle", "MongoDB", "Redis", "Docker",
    "Kubernetes", "AWS", "Azure", "GCP", "Jenkins", "Git", "Linux",
    "HTML", "CSS", "Bootstrap", "Tailwind", "Flutter", "React Native",
    "Swift", "Kotlin", "Go", "Rust", "Ruby", "Rails", "Express"
  ];

  const [testProjects, setTestProjects] = useState<Project[]>([]);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("프로젝트 목록을 불러올 수 없습니다");
      }
      return response.json();
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const fetchProjectsDirectly = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setTestProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch projects error:", error);
      setTestProjects([]);
    }
  };

  // 페이지 로드 시 자동으로 데이터 가져오기
  useEffect(() => {
    fetchProjectsDirectly();
  }, []);

  // 실시간 업데이트 - 폴링 방식
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const response = await fetch('/api/projects');
        const newProjects = await response.json();
        const currentProjects = projects.length > 0 ? projects : testProjects;
        
        if (JSON.stringify(newProjects) !== JSON.stringify(currentProjects)) {
          console.log('프로젝트 데이터 변경 감지 - 목록 업데이트');
          setTestProjects(newProjects);
          
          if (newProjects.length > currentProjects.length) {
            toast({ title: "새 프로젝트가 등록되었습니다!", description: "목록이 자동으로 업데이트되었습니다." });
          } else if (newProjects.length < currentProjects.length) {
            toast({ title: "프로젝트가 삭제되었습니다!", description: "목록이 자동으로 업데이트되었습니다." });
          } else {
            toast({ title: "프로젝트가 수정되었습니다!", description: "목록이 자동으로 업데이트되었습니다." });
          }
        }
      } catch (error) {
        console.error('실시간 업데이트 확인 오류:', error);
      }
    };

    const intervalId = setInterval(checkForUpdates, 2000);
    return () => clearInterval(intervalId);
  }, [projects, testProjects]);

  // 프로젝트 검색 필터링 함수
  const getFilteredProjects = () => {
    const currentProjects = projects.length > 0 ? projects : testProjects;
    return currentProjects.filter(project => {
      const matchesStatus = project.status === activeTab;
      
      if (!searchTerm.trim()) return matchesStatus;
      
      const searchLower = searchTerm.toLowerCase();
      
      // 전체 검색
      if (searchFilter === "all") {
        return matchesStatus && (
          project.title.toLowerCase().includes(searchLower) ||
          (project.skills && project.skills.join(' ').toLowerCase().includes(searchLower)) ||
          (project.grade && project.grade.toLowerCase().includes(searchLower)) ||
          (project.description && project.description.toLowerCase().includes(searchLower)) ||
          (project.tasks && project.tasks.toLowerCase().includes(searchLower))
        );
      }
      
      // 프로젝트명으로 검색
      if (searchFilter === "name") {
        return matchesStatus && project.title.toLowerCase().includes(searchLower);
      }
      
      // 스킬로 검색
      if (searchFilter === "skills") {
        return matchesStatus && project.skills && 
               project.skills.join(' ').toLowerCase().includes(searchLower);
      }
      
      // 등급으로 검색
      if (searchFilter === "grade") {
        return matchesStatus && project.grade && 
               project.grade.toLowerCase().includes(searchLower);
      }
      
      return matchesStatus;
    });
  };

  const filteredProjects = getFilteredProjects();

  // 프로젝트별 지원자 목록 조회
  const { data: projectApplications = [], refetch: refetchApplications } = useQuery<Application[]>({
    queryKey: ["/api/projects", selectedProjectForApplications?.id, "applications"],
    queryFn: async () => {
      if (!selectedProjectForApplications) return [];
      const response = await fetch(`/api/projects/${selectedProjectForApplications.id}/applications`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) throw new Error("지원자 목록 조회 실패");
      return response.json();
    },
    enabled: !!selectedProjectForApplications,
    staleTime: 0,
    gcTime: 0,
  });

  // 지원 상태 업데이트 (합격 시 계약 대기 생성 및 지원자 삭제)
  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/applications/${applicationId}`, { status });
      return response;
    },
    onSuccess: (_, { status }) => {
      refetchApplications();
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] }); // 계약 목록도 새로고침
      
      if (status === "합격") {
        toast({
          title: "계약 대기가 생성되었습니다! 🎉",
          description: "지원자가 합격 처리되어 계약 현황에 계약 대기가 추가되었습니다.",
        });
      } else {
        toast({
          title: "상태가 업데이트되었습니다!",
          description: "지원자 상태가 성공적으로 변경되었습니다.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "상태 업데이트 실패",
        description: error.message || "상태 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 지원자 삭제 (합격 처리 후)
  const deleteApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      return apiRequest("DELETE", `/api/applications/${applicationId}`);
    },
    onSuccess: () => {
      refetchApplications();
      toast({
        title: "지원자가 목록에서 제거되었습니다",
        description: "합격 처리된 지원자가 지원자 목록에서 삭제되었습니다.",
      });
    },
  });

  // 지원자 상태 변경 처리 함수
  const handleApplicationStatusChange = async (applicationId: number, newStatus: string) => {
    if (newStatus === "합격") {
      const confirmed = window.confirm("계약 대기 상태로 변경하시겠습니까?\n\n'예'를 클릭하면:\n- 계약 현황에 계약 대기가 생성됩니다\n- 해당 지원자는 목록에서 삭제됩니다");
      
      if (confirmed) {
        // 먼저 상태를 합격으로 업데이트 (서버에서 계약 대기 자동 생성)
        await updateApplicationStatusMutation.mutateAsync({ applicationId, status: "합격" });
        
        // 그 후 지원자를 목록에서 삭제
        setTimeout(() => {
          deleteApplicationMutation.mutate(applicationId);
        }, 1000); // 1초 후 삭제 (계약 생성이 완료된 후)
        
        // 지원자 목록 창 닫기
        setIsApplicationsDialogOpen(false);
      }
    } else {
      // 검토, 탈락 등 다른 상태 변경 시 확인 알림
      const confirmed = window.confirm(`지원자 상태를 "${newStatus}"으로 변경하시겠습니까?`);
      
      if (confirmed) {
        updateApplicationStatusMutation.mutate({ applicationId, status: newStatus });
        // 상태 변경 후 지원자 목록 창 닫기
        setIsApplicationsDialogOpen(false);
      }
    }
  };

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      title: "",
      location: "",
      duration: "",
      grade: "",
      headcount: "",
      tasks: "",
      amount: "",
      source: "",
      skills: [],
      description: "",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: InsertProject) => apiRequest("POST", "/api/projects", data),
    onSuccess: () => {
      // 프로젝트 관련 모든 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      queryClient.refetchQueries({ queryKey: ["/api/projects"] });
      form.reset();
      setSelectedSkills([]);
      setIsCreating(false);
      setEditingProject(null);
      toast({ title: "프로젝트가 성공적으로 등록되었습니다!" });
    },
    onError: () => {
      toast({ title: "프로젝트 등록에 실패했습니다.", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertProject) => {
    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data });
      setEditingProject(null);
      setIsCreating(false);
      form.reset();
    } else {
      createProjectMutation.mutate(data);
    }
  };

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Project> }) => 
      apiRequest("PATCH", `/api/projects/${id}`, data),
    onSuccess: () => {
      // 프로젝트 관련 모든 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      queryClient.refetchQueries({ queryKey: ["/api/projects"] });
      toast({ title: "프로젝트가 업데이트되었습니다!" });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: () => {
      // 모든 캐시 강제 삭제 및 새로고침
      queryClient.removeQueries({ queryKey: ["/api/projects"] });
      queryClient.removeQueries({ queryKey: ["/api/resumes"] });
      queryClient.removeQueries({ queryKey: ["/api/contracts"] });
      queryClient.removeQueries({ queryKey: ["/api/calendar-events"] });
      // 강제로 새로 데이터 가져오기
      queryClient.fetchQuery({ queryKey: ["/api/projects"] });
      toast({ title: "프로젝트가 삭제되었습니다!" });
    },
  });



  const handleProjectStatusChange = (project: Project, completed: boolean) => {
    updateProjectMutation.mutate({
      id: project.id,
      data: { status: completed ? "완료" : "진행중" }
    });
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.reset({
      title: project.title,
      location: project.location,
      duration: project.duration,
      grade: project.grade,
      headcount: project.headcount,
      tasks: project.tasks,
      amount: project.amount,
      source: project.source,
      skills: project.skills,
      coreSkills: project.coreSkills || "",
      coreWork: project.coreWork || "",
      description: project.description || "",
    });
    setIsCreating(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) {
      deleteProjectMutation.mutate(id);
    }
  };

  // 프로젝트 선택/해제 핸들러
  const handleProjectSelect = (projectId: number, checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, projectId]);
    } else {
      setSelectedProjects(prev => prev.filter(id => id !== projectId));
    }
  };

  // 전체 선택/해제 핸들러
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(filteredProjects.map(p => p.id));
    } else {
      setSelectedProjects([]);
    }
  };

  // 선택된 프로젝트들을 완료 처리
  const handleBulkComplete = async () => {
    if (selectedProjects.length === 0) {
      toast({ title: "선택된 프로젝트가 없습니다", variant: "destructive" });
      return;
    }

    const targetStatus = activeTab === "진행중" ? "완료" : "진행중";
    
    try {
      await Promise.all(
        selectedProjects.map(id => 
          updateProjectMutation.mutateAsync({
            id,
            data: { status: targetStatus }
          })
        )
      );
      
      setSelectedProjects([]);
      toast({ 
        title: `${selectedProjects.length}개 프로젝트가 ${targetStatus} 처리되었습니다!` 
      });
    } catch (error) {
      toast({ 
        title: "일괄 처리 중 오류가 발생했습니다", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container-padding py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">프로젝트 관리</h1>
            <p className="text-gray-600">프로젝트를 등록하고 진행상태를 관리하세요</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Select value={searchFilter} onValueChange={setSearchFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="name">프로젝트명</SelectItem>
                  <SelectItem value="skills">스킬</SelectItem>
                  <SelectItem value="grade">등급</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative">
                <Input
                  placeholder={
                    searchFilter === "all" ? "전체 검색..." :
                    searchFilter === "name" ? "프로젝트명 검색..." :
                    searchFilter === "skills" ? "스킬 검색..." :
                    "등급 검색..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  새 프로젝트
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>새 프로젝트 등록</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">프로젝트명</Label>
                      <Input
                        id="title"
                        {...form.register("title")}
                        placeholder="프로젝트명을 입력하세요"
                      />
                      {form.formState.errors.title && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="location">위치</Label>
                      <Input
                        id="location"
                        {...form.register("location")}
                        placeholder="예: 서울시 강남구"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration">기간</Label>
                      <Input
                        id="duration"
                        {...form.register("duration")}
                        placeholder="예: 3개월, 6개월"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="amount">금액</Label>
                      <Input
                        id="amount"
                        {...form.register("amount")}
                        placeholder="예: 5,000,000원"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="grade">등급</Label>
                      <Input
                        id="grade"
                        {...form.register("grade")}
                        placeholder="예: 고급, 중급, 초급"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="headcount">인원수</Label>
                      <Input
                        id="headcount"
                        {...form.register("headcount")}
                        placeholder="예: 3명, 5명"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="source">프로젝트 출처</Label>
                      <Input
                        id="source"
                        {...form.register("source")}
                        placeholder="예: 직접문의, 에이전시, 플랫폼"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tasks">업무 내용</Label>
                    <Textarea
                      id="tasks"
                      {...form.register("tasks")}
                      placeholder="담당할 업무를 상세히 설명해주세요"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="coreSkills">핵심 스킬</Label>
                    <Input
                      id="coreSkills"
                      {...form.register("coreSkills")}
                      placeholder="예: React, Node.js, TypeScript, Python"
                    />
                  </div>

                  <div>
                    <Label htmlFor="coreWork">핵심 업무</Label>
                    <Input
                      id="coreWork"
                      {...form.register("coreWork")}
                      placeholder="예: 프론트엔드 개발, 백엔드 API 구축, 데이터베이스 설계"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                    >
                      {editingProject ? "수정하기" : "등록하기"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false);
                        setEditingProject(null);
                        form.reset();
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>



        {/* 프로젝트 상태 탭 */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("진행중")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "진행중"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Clock className="inline-block w-4 h-4 mr-2" />
            진행중 ({projects.filter(p => p.status === "진행중").length})
          </button>
          <button
            onClick={() => setActiveTab("완료")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "완료"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <CheckCircle className="inline-block w-4 h-4 mr-2" />
            완료 ({projects.filter(p => p.status === "완료").length})
          </button>
        </div>

        {/* 일괄 선택 및 처리 버튼 */}
        {filteredProjects.length > 0 && (
          <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={selectedProjects.length === filteredProjects.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">
                전체 선택 ({selectedProjects.length}/{filteredProjects.length})
              </span>
            </div>
            
            {selectedProjects.length > 0 && (
              <Button
                onClick={handleBulkComplete}
                variant={activeTab === "진행중" ? "default" : "outline"}
                size="sm"
              >
                {activeTab === "진행중" ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    선택된 프로젝트 완료 처리 ({selectedProjects.length}개)
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    선택된 프로젝트 진행중으로 변경 ({selectedProjects.length}개)
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* 프로젝트 목록 */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">프로젝트를 불러오는 중...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {activeTab} 프로젝트가 없습니다
                </h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === "진행중" ? "첫 번째 프로젝트를 등록해보세요" : "완료된 프로젝트가 없습니다"}
                </p>
                {activeTab === "진행중" && (
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    프로젝트 등록
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredProjects.map((project) => (
              <Card key={project.id} className={`hover:shadow-md transition-shadow ${
                selectedProjects.includes(project.id) ? "ring-2 ring-blue-500" : ""
              }`}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* 헤더 영역 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedProjects.includes(project.id)}
                          onCheckedChange={(checked) => 
                            handleProjectSelect(project.id, checked as boolean)
                          }
                        />
                        <h3 className={`text-xl font-bold ${
                          project.status === "완료" ? "line-through text-gray-500" : "text-gray-900"
                        }`}>
                          {project.title}
                        </h3>
                        <Badge variant={project.status === "완료" ? "secondary" : "default"} className="ml-2">
                          {project.status}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProjectForApplications(project);
                            setIsApplicationsDialogOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Users className="h-4 w-4 mr-1" />
                          지원자 목록
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(project)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(project.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 프로젝트 기본 정보 */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">위치</div>
                        <div className="flex items-center justify-center text-sm font-medium">
                          <MapPin className="h-3 w-3 mr-1" />
                          {project.location}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">기간</div>
                        <div className="flex items-center justify-center text-sm font-medium">
                          <Calendar className="h-3 w-3 mr-1" />
                          {project.duration}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">등급/인원</div>
                        <div className="flex items-center justify-center text-sm font-medium">
                          <Star className="h-3 w-3 mr-1" />
                          {project.grade} · {project.headcount}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">금액</div>
                        <div className="text-sm font-bold text-green-600">
                          {project.amount}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">출처</div>
                        <div className="text-sm font-medium text-blue-600">
                          {project.source}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">등록일</div>
                        <div className="text-sm font-medium text-gray-700">
                          {project.createdAt ? new Date(project.createdAt).toLocaleDateString('ko-KR') : '정보 없음'}
                        </div>
                      </div>
                    </div>

                    {/* 핵심 스킬 & 핵심 업무 */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          핵심 스킬
                        </h4>
                        <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                          <p className="text-sm text-blue-800">
                            {project.coreSkills || "핵심 스킬을 추가해주세요"}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          핵심 업무
                        </h4>
                        <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                          <p className="text-sm text-green-800">
                            {project.coreWork || "핵심 업무를 추가해주세요"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 업무 내용 */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">업무 내용</h4>
                      <p className="text-gray-700 text-sm leading-relaxed bg-white p-3 rounded-lg border">
                        {project.tasks}
                      </p>
                    </div>


                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* 지원자 목록 팝업 */}
      <Dialog open={isApplicationsDialogOpen} onOpenChange={setIsApplicationsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProjectForApplications?.title} - 지원자 목록
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {(projectApplications as any[]).length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  지원자가 없습니다
                </h3>
                <p className="text-gray-600">
                  아직 이 프로젝트에 지원한 인재가 없습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(projectApplications as any[]).map((application: any) => (
                  <Card key={application.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-lg">{application.resumeName}</h4>
                          <Badge 
                            variant={
                              application.status === "합격" ? "default" :
                              application.status === "검토" ? "secondary" :
                              application.status === "탈락" ? "destructive" : "outline"
                            }
                            className={
                              application.status === "합격" ? "bg-green-100 text-green-800" :
                              application.status === "검토" ? "bg-yellow-100 text-yellow-800" :
                              application.status === "탈락" ? "bg-red-100 text-red-800" : ""
                            }
                          >
                            {application.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">거래처:</span> {application.clientCompany}
                          </div>
                          <div>
                            <span className="font-medium">지원처:</span> {application.targetCompany}
                          </div>
                          <div>
                            <span className="font-medium">지원일:</span> {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : "정보 없음"}
                          </div>
                          {application.notes && (
                            <div className="col-span-2">
                              <span className="font-medium">메모:</span> {application.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Select
                          value={application.status}
                          onValueChange={(newStatus) => {
                            handleApplicationStatusChange(application.id, newStatus);
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="지원">지원</SelectItem>
                            <SelectItem value="검토">검토</SelectItem>
                            <SelectItem value="탈락">탈락</SelectItem>
                            <SelectItem value="합격">합격</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}