import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRouter } from "wouter";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Building, Calendar, FileText, Users, Trash2, Edit } from "lucide-react";
import type { Application, InsertApplication, Resume } from "@shared/schema";
import { insertApplicationSchema } from "@shared/schema";

export default function ApplicationsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [location] = useLocation();
  const router = useRouter();
  const { toast } = useToast();

  // URL 파라미터에서 이력서 ID 추출
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const preselectedResumeId = urlParams.get('resumeId');

  const [liveApplications, setLiveApplications] = useState<Application[]>([]);

  const { data: applications = [], isLoading: applicationsLoading, refetch: refetchApplications } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    staleTime: 0,
    gcTime: 0,
  });

  const fetchLiveApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      const data = await response.json();
      setLiveApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch applications error:", error);
      setLiveApplications([]);
    }
  };

  // 페이지 로드 시 자동으로 데이터 가져오기
  useEffect(() => {
    fetchLiveApplications();
  }, []);

  // 실시간 업데이트 - 폴링 방식
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const response = await fetch('/api/applications');
        const newApplications = await response.json();
        const currentApplications = applications.length > 0 ? applications : liveApplications;
        
        if (JSON.stringify(newApplications) !== JSON.stringify(currentApplications)) {
          console.log('지원결과 데이터 변경 감지 - 목록 업데이트');
          setLiveApplications(newApplications);
          
          if (newApplications.length > currentApplications.length) {
            toast({ title: "새 지원결과가 등록되었습니다!", description: "목록이 자동으로 업데이트되었습니다." });
          } else if (newApplications.length < currentApplications.length) {
            toast({ title: "지원결과가 삭제되었습니다!", description: "목록이 자동으로 업데이트되었습니다." });
          } else {
            toast({ title: "지원결과가 수정되었습니다!", description: "목록이 자동으로 업데이트되었습니다." });
          }
        }
      } catch (error) {
        console.error('실시간 업데이트 확인 오류:', error);
      }
    };

    const intervalId = setInterval(checkForUpdates, 5000);
    return () => clearInterval(intervalId);
  }, [applications, liveApplications]);



  // 페이지 로드 시 강제로 데이터 새로고침
  useEffect(() => {
    refetchApplications();
    // React Query가 작동하지 않으니 직접 fetch도 실행
    fetchLiveApplications();
  }, [refetchApplications]);

  // 기존 함수 제거됨 - fetchLiveApplications로 대체

  const { data: resumes = [] } = useQuery<Resume[]>({
    queryKey: ["/api/resumes"],
  });

  const form = useForm<InsertApplication>({
    resolver: zodResolver(insertApplicationSchema),
    defaultValues: {
      resumeId: preselectedResumeId ? parseInt(preselectedResumeId) : 0,
      resumeName: "",
      clientCompany: "",
      targetCompany: "",
      status: "지원",
      notes: "",
    },
  });

  // 미리 선택된 이력서가 있으면 자동으로 등록 다이얼로그 열기
  useEffect(() => {
    if (preselectedResumeId && resumes.length > 0) {
      const selectedResume = resumes.find(r => r.id === parseInt(preselectedResumeId));
      if (selectedResume) {
        form.setValue('resumeId', selectedResume.id);
        form.setValue('resumeName', selectedResume.fileName);
        setIsCreating(true);
      }
    }
  }, [preselectedResumeId, resumes, form]);

  const createApplicationMutation = useMutation({
    mutationFn: (data: InsertApplication) => apiRequest("POST", "/api/applications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      form.reset();
      setIsCreating(false);
      setEditingApplication(null);
      // 이력서 목록 새로고침하여 상태 업데이트 반영
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      // 직접 fetch로 데이터 새로고침
      fetchLiveApplications();
      
      // URL 파라미터 정리
      if (preselectedResumeId) {
        window.history.replaceState({}, '', '/applications');
      }
      toast({ title: "지원등록을 완료하였습니다" });
    },
    onError: () => {
      toast({ title: "지원결과 등록에 실패했습니다.", variant: "destructive" });
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Application> }) => 
      apiRequest("PATCH", `/api/applications/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: "지원결과가 업데이트되었습니다!" });
    },
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/applications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: "지원결과가 삭제되었습니다!" });
    },
  });

  const onSubmit = (data: InsertApplication) => {
    const selectedResume = resumes.find(r => r.id === data.resumeId);
    if (selectedResume) {
      data.resumeName = selectedResume.fileName;
    }

    if (editingApplication) {
      updateApplicationMutation.mutate({ id: editingApplication.id, data });
      setEditingApplication(null);
    } else {
      createApplicationMutation.mutate(data);
    }
  };

  const handleEdit = (application: Application) => {
    setEditingApplication(application);
    form.reset({
      resumeId: application.resumeId,
      resumeName: application.resumeName,
      clientCompany: application.clientCompany,
      targetCompany: application.targetCompany,
      status: application.status,
      notes: application.notes || "",
    });
    setIsCreating(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("정말로 이 지원결과를 삭제하시겠습니까?")) {
      deleteApplicationMutation.mutate(id);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "지원": return "bg-blue-100 text-blue-800";
      case "결과대기": return "bg-yellow-100 text-yellow-800";
      case "합격": return "bg-green-100 text-green-800";
      case "탈락": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">지원결과 관리</h1>
            <p className="text-gray-600">인력 지원 현황을 관리하고 추적하세요</p>
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                지원결과 등록
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {editingApplication ? "지원결과 수정" : "새 지원결과 등록"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="overflow-y-auto flex-1 pr-2">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
                  <FormField
                    control={form.control}
                    name="resumeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이력서 선택</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="이력서를 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(preselectedResumeId && !editingApplication 
                              ? resumes.filter(resume => resume.id === parseInt(preselectedResumeId))
                              : resumes
                            ).map((resume) => (
                              <SelectItem key={resume.id} value={resume.id.toString()}>
                                {resume.fileName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientCompany"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>프로젝트를 받은 거래처명</FormLabel>
                        <FormControl>
                          <Input placeholder="거래처명을 입력하세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetCompany"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>인력 지원을 받은 거래처명</FormLabel>
                        <FormControl>
                          <Input placeholder="거래처명을 입력하세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>지원결과</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="상태를 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="지원">지원</SelectItem>
                            <SelectItem value="결과대기">결과대기</SelectItem>
                            <SelectItem value="탈락">탈락</SelectItem>
                            <SelectItem value="합격">합격</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="receivedAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>받는 금액</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="예: 300만원, 3,000,000원"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paidAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>주는 금액</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="예: 270만원, 2,700,000원"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>추가 메모</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="추가 사항이나 메모를 입력하세요"
                            className="resize-none"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false);
                        setEditingApplication(null);
                        form.reset();
                      }}
                    >
                      취소
                    </Button>
                    <Button type="submit">
                      {editingApplication ? "수정" : "등록"}
                    </Button>
                  </div>
                </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 테스트 버튼 */}
        <div className="mb-4">
          <Button onClick={fetchLiveApplications} variant="outline">
            직접 데이터 가져오기 (테스트)
          </Button>
          {liveApplications.length > 0 && (
            <p className="mt-2 text-sm text-green-600">
              직접 가져온 데이터: {liveApplications.length}개 발견
            </p>
          )}
        </div>

        <div className="grid gap-6">
          {applicationsLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-gray-600">지원결과를 불러오는 중...</p>
              </CardContent>
            </Card>
          ) : (applications.length === 0 && liveApplications.length === 0) ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">지원결과가 없습니다</h3>
                <p className="text-gray-600 mb-4">첫 번째 지원결과를 등록해보세요</p>
                <Button onClick={() => setIsCreating(true)}>
                  지원결과 등록
                </Button>
              </CardContent>
            </Card>
          ) : (
            (applications.length > 0 ? applications : liveApplications).map((application: Application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">{application.resumeName}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusBadgeColor(application.status)}>
                            {application.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(application)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(application.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">프로젝트 거래처</div>
                        <div className="font-medium">{application.clientCompany}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">지원 거래처</div>
                        <div className="font-medium">{application.targetCompany}</div>
                      </div>
                    </div>
                  </div>
                  
                  {(application.receivedAmount || application.paidAmount) && (
                    <div className="grid md:grid-cols-2 gap-4 mt-4 p-3 bg-blue-50 rounded-lg">
                      {application.receivedAmount && (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <div>
                            <div className="text-sm text-green-700 font-medium">받는 금액</div>
                            <div className="font-semibold text-green-800">{application.receivedAmount}</div>
                          </div>
                        </div>
                      )}
                      {application.paidAmount && (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                          <div>
                            <div className="text-sm text-red-700 font-medium">주는 금액</div>
                            <div className="font-semibold text-red-800">{application.paidAmount}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {application.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">메모</div>
                      <div className="text-sm">{application.notes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}