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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ClipboardList, 
  Plus, 
  Calendar, 
  DollarSign,
  Edit,
  Building,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Users
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { insertContractSchema, type Contract, type InsertContract } from "@shared/schema";

export default function ContractsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [showPendingContracts, setShowPendingContracts] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
    staleTime: 10 * 60 * 1000, // 10분 캐시
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const [selectedContracts, setSelectedContracts] = useState<number[]>([]);

  const form = useForm({
    defaultValues: {
      contractName: "",
      clientName: "",
      transactionType: "매출",
      paymentDate: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      amount: "",
      description: "",
    },
  });

  const createContractMutation = useMutation({
    mutationFn: (data: InsertContract) => apiRequest("POST", "/api/contracts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      form.reset();
      setIsCreating(false);
      // 직접 fetch로 데이터 새로고침
      fetchContractsDirectly();
      toast({ title: "계약이 성공적으로 등록되었습니다!" });
    },
    onError: () => {
      toast({ title: "계약 등록에 실패했습니다.", variant: "destructive" });
    },
  });

  const updateContractMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Contract> }) => 
      apiRequest("PATCH", `/api/contracts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({ title: "계약이 업데이트되었습니다!" });
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      // 여러 계약을 순차적으로 삭제
      for (const id of ids) {
        await apiRequest("DELETE", `/api/contracts/${id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      setSelectedContracts([]); // 선택 초기화
      toast({ title: `${selectedContracts.length}개의 계약이 삭제되었습니다!` });
    },
  });

  const onSubmit = (data: any) => {
    console.log("Form submission data:", data);
    console.log("Form errors:", form.formState.errors);
    
    // 간단한 검증: 필수 필드만 확인
    if (!data.contractName || !data.clientName || !data.startDate || !data.endDate || !data.amount) {
      toast({ 
        title: "필수 정보를 모두 입력해주세요", 
        description: "계약명, 거래처명, 시작일, 종료일, 금액은 필수입니다.",
        variant: "destructive" 
      });
      return;
    }
    
    if (editingContract && isEditing) {
      updateContractMutation.mutate({ id: editingContract.id, data });
      setEditingContract(null);
      setIsEditing(false);
      setIsCreating(false);
    } else {
      // 새 계약은 바로 "진행중" 상태로 등록
      const contractData = {
        ...data,
        status: "진행중"
      };
      createContractMutation.mutate(contractData);
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    form.reset({
      contractName: contract.contractName,
      clientName: contract.clientName || "",
      transactionType: contract.transactionType,
      startDate: new Date(contract.startDate).toISOString().split('T')[0],
      endDate: new Date(contract.endDate).toISOString().split('T')[0],
      amount: contract.amount,
      paymentDate: contract.paymentDate || "",
      description: contract.description || "",
    });
    setIsEditing(true);
    setIsCreating(true); // 폼을 표시하기 위해 필요
  };

  const handleDelete = (id: number) => {
    if (confirm("정말로 이 계약을 삭제하시겠습니까?")) {
      deleteContractMutation.mutate([id]);
    }
  };

  // 체크박스 관련 함수들
  const handleSelectContract = (contractId: number) => {
    setSelectedContracts(prev => 
      prev.includes(contractId) 
        ? prev.filter(id => id !== contractId)
        : [...prev, contractId]
    );
  };

  const handleSelectAll = () => {
    const currentContracts = contracts.length > 0 ? contracts : testContracts;
    if (selectedContracts.length === currentContracts.length) {
      setSelectedContracts([]);
    } else {
      setSelectedContracts(currentContracts.map(c => c.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedContracts.length > 0 && confirm(`선택한 ${selectedContracts.length}개의 계약을 삭제하시겠습니까?`)) {
      deleteContractMutation.mutate(selectedContracts);
    }
  };

  const getContractStatus = (contract: Contract) => {
    // 계약 상태가 명시적으로 있는 경우 우선 사용
    if ((contract as any).status) {
      const status = (contract as any).status;
      switch (status) {
        case "계약 대기":
          return { status: "계약 대기", color: "bg-orange-100 text-orange-800", icon: AlertCircle };
        case "진행중":
          return { status: "진행중", color: "bg-green-100 text-green-800", icon: CheckCircle };
        case "완료":
          return { status: "완료", color: "bg-gray-100 text-gray-800", icon: CheckCircle };
        default:
          return { status: status, color: "bg-blue-100 text-blue-800", icon: AlertCircle };
      }
    }
    
    // 기존 날짜 기반 상태 계산 (호환성 유지)
    const today = new Date();
    const endDate = new Date(contract.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: "종료", color: "bg-gray-100 text-gray-800", icon: CheckCircle };
    } else if (diffDays <= 7) {
      return { status: "곧 종료", color: "bg-red-100 text-red-800", icon: AlertCircle };
    } else if (diffDays <= 30) {
      return { status: "종료 임박", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle };
    } else {
      return { status: "진행중", color: "bg-green-100 text-green-800", icon: CheckCircle };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container-padding py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">계약 현황</h1>
            <p className="text-gray-600">계약을 관리하고 종료일 알림을 받아보세요</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={showPendingContracts} onOpenChange={setShowPendingContracts}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  계약 대기 목록
                  {contracts.filter((c: Contract) => c.status === "계약 대기").length > 0 && (
                    <Badge className="ml-2 bg-orange-500 text-white">
                      {contracts.filter((c: Contract) => c.status === "계약 대기").length}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    계약 대기 목록
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {contracts.filter((c: Contract) => c.status === "계약 대기").length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        계약 대기 중인 항목이 없습니다
                      </h3>
                      <p className="text-gray-600">
                        지원자가 합격 처리되면 여기에 계약 대기 항목이 나타납니다.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {testContracts.filter(c => c.status === "계약 대기").map((contract) => (
                        <Card key={contract.id} className="p-4 border-orange-200 bg-orange-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-lg">{contract.contractName}</h4>
                                <Badge className="bg-orange-100 text-orange-800">
                                  계약 대기
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">거래처:</span> {contract.clientName}
                                </div>
                                <div>
                                  <span className="font-medium">거래 유형:</span> {contract.transactionType}
                                </div>
                                <div>
                                  <span className="font-medium">계약 기간:</span> {new Date(contract.startDate).toLocaleDateString()} ~ {new Date(contract.endDate).toLocaleDateString()}
                                </div>
                                <div>
                                  <span className="font-medium">계약 금액:</span> {contract.amount}
                                </div>
                                {contract.description && (
                                  <div className="col-span-2">
                                    <span className="font-medium">설명:</span> {contract.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const confirmed = window.confirm(`'${contract.contractName}' 계약을 진행 상태로 변경하시겠습니까?\n\n변경 후에는 계약 대기 목록에서 제거되고 일반 계약 목록으로 이동됩니다.`);
                                  
                                  if (confirmed) {
                                    // 계약 대기를 진행중으로 변경
                                    updateContractMutation.mutate({
                                      id: contract.id,
                                      data: { status: "진행중" }
                                    });
                                    
                                    // 성공 후 팝업 닫고 데이터 새로고침
                                    setTimeout(() => {
                                      setShowPendingContracts(false);
                                      fetchContractsDirectly();
                                      toast({
                                        title: "계약이 진행 상태로 변경되었습니다! 🎉",
                                        description: "계약 대기 목록에서 제거되고 일반 계약 목록으로 이동되었습니다.",
                                      });
                                    }, 500);
                                  }
                                }}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="mr-1 h-3 w-3" />
                                진행 시작
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  const confirmed = window.confirm(`'${contract.contractName}' 계약 대기를 취소하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`);
                                  
                                  if (confirmed) {
                                    // 계약 대기 삭제
                                    deleteContractMutation.mutate([contract.id]);
                                    
                                    // 성공 후 팝업 닫고 데이터 새로고침
                                    setTimeout(() => {
                                      fetchContractsDirectly();
                                      toast({
                                        title: "계약 대기가 취소되었습니다",
                                        description: "계약 대기 목록에서 삭제되었습니다.",
                                      });
                                    }, 500);
                                  }
                                }}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                <X className="mr-1 h-3 w-3" />
                                진행 취소
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              새 계약
            </Button>
          </div>
        </div>

        {/* 계약 등록/수정 폼 */}
        {isCreating && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingContract ? "계약 수정" : "새 계약 등록"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="contractName">계약명</Label>
                  <Input
                    id="contractName"
                    {...form.register("contractName")}
                    placeholder="계약명을 입력하세요"
                  />
                  {form.formState.errors.contractName && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.contractName.message}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">거래처명</Label>
                    <Input
                      id="clientName"
                      {...form.register("clientName")}
                      placeholder="거래처명을 입력하세요"
                    />
                    {form.formState.errors.clientName && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.clientName.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="transactionType">거래구분</Label>
                    <select
                      id="transactionType"
                      {...form.register("transactionType", { required: "거래구분을 선택하세요" })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="매입">매입</option>
                      <option value="매출">매출</option>
                    </select>
                    {form.formState.errors.transactionType && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.transactionType.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">시작일</Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...form.register("startDate", { 
                        setValueAs: (value) => new Date(value) 
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">종료일</Label>
                    <Input
                      id="endDate"
                      type="date"
                      {...form.register("endDate", { 
                        setValueAs: (value) => new Date(value) 
                      })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="amount">계약 금액</Label>
                    <Input
                      id="amount"
                      {...form.register("amount")}
                      placeholder="예: 10,000,000원"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="netProfit">순이익</Label>
                    <Input
                      id="netProfit"
                      {...form.register("netProfit")}
                      placeholder="예: 2,000,000원"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="paymentDate">지급일</Label>
                    <Input
                      id="paymentDate"
                      {...form.register("paymentDate")}
                      placeholder="예: 매월 25일, 계약완료 후 30일"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">계약 내용</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="계약에 대한 상세 내용을 입력하세요"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createContractMutation.isPending || updateContractMutation.isPending}
                  >
                    {editingContract ? "수정하기" : "등록하기"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                      setEditingContract(null);
                      form.reset();
                    }}
                  >
                    취소
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 계약 목록 */}
        <div className="space-y-4">
          {/* 선택 삭제 컨트롤 */}
          {contracts.length > 0 && (
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedContracts.length === contracts.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600">
                  전체 선택 ({selectedContracts.length}/{contracts.length}개 선택됨)
                </span>
              </div>
              {selectedContracts.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={deleteContractMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  선택 삭제 ({selectedContracts.length}개)
                </Button>
              )}
            </div>
          )}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">계약을 불러오는 중...</p>
            </div>
          ) : contracts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ClipboardList className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  등록된 계약이 없습니다
                </h3>
                <p className="text-gray-600 mb-6">
                  첫 번째 계약을 등록해보세요
                </p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  계약 등록
                </Button>
              </CardContent>
            </Card>
          ) : (
            (contracts.length > 0 ? contracts : testContracts)
              .filter(contract => contract.status !== "계약 대기") // 계약 대기 상태 제외
              .map((contract) => {
              const contractStatus = getContractStatus(contract);
              const StatusIcon = contractStatus.icon;
              
              return (
                <Card key={contract.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={selectedContracts.includes(contract.id)}
                          onCheckedChange={() => handleSelectContract(contract.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {contract.contractName}
                            </h3>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${contractStatus.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {contractStatus.status}
                            </div>
                          </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-gray-600">
                            <Building className="h-4 w-4 mr-2" />
                            <span className="font-medium">{contract.clientName}</span>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                              contract.transactionType === '매입' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {contract.transactionType}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center text-green-600 font-medium">
                              <DollarSign className="h-4 w-4 mr-2" />
                              계약금액: {contract.amount}
                            </div>
                            {contract.netProfit && (
                              <div className="flex items-center text-blue-600 font-medium">
                                <DollarSign className="h-4 w-4 mr-2" />
                                순이익: {contract.netProfit}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(contract.startDate).toLocaleDateString()} ~ {new Date(contract.endDate).toLocaleDateString()}
                          </div>
                          {contract.paymentDate && (
                            <div className="flex items-center text-purple-600">
                              <DollarSign className="h-4 w-4 mr-2" />
                              지급일: {contract.paymentDate}
                            </div>
                          )}
                        </div>
                        
                        {contract.description && (
                          <p className="text-gray-700 mb-3">{contract.description}</p>
                        )}
                        
                        <div className="text-sm text-gray-500">
                          등록일: {new Date(contract.createdAt!).toLocaleDateString()}
                        </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(contract)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(contract.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
    </div>
  );
}