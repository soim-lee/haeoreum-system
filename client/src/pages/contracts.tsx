import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { 
  ClipboardList, 
  Plus, 
  Building2, 
  Calendar, 
  DollarSign,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Users
} from "lucide-react";
import type { Contract, InsertContract } from "@shared/schema";
import { insertContractSchema } from "@shared/schema";

export default function ContractsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [showPendingContracts, setShowPendingContracts] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
    queryFn: async () => {
      const response = await fetch("/api/contracts");
      if (!response.ok) throw new Error("Failed to fetch contracts");
      return response.json();
    },
    staleTime: 0, // 캐시 비활성화
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // 대기 중인 계약 필터링
  const pendingContracts = contracts.filter((c: Contract) => c.status === "계약 대기");
  
  // 승인된 계약만 표시 (계약 대기 제외)
  const approvedContracts = contracts.filter((c: Contract) => c.status !== "계약 대기");

  const form = useForm({
    resolver: zodResolver(insertContractSchema),
    defaultValues: {
      contractName: "",
      clientName: "",
      transactionType: "매출",
      startDate: "",
      endDate: "",
      amount: "",
      paymentDate: "",
      description: "",
      netProfit: "",
    },
  });

  const createContractMutation = useMutation({
    mutationFn: (data: InsertContract) => apiRequest("POST", "/api/contracts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.refetchQueries({ queryKey: ["/api/contracts"] });
      toast({ title: "계약이 생성되었습니다!" });
      form.reset();
      setIsCreating(false);
    },
  });

  const updateContractMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Contract> }) => 
      apiRequest("PATCH", `/api/contracts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({ title: "계약이 업데이트되었습니다!" });
      setEditingContract(null);
      setIsCreating(false);
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/contracts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({ title: "계약이 삭제되었습니다!" });
    },
  });

  const onSubmit = (data: any) => {
    // 날짜 문자열을 Date 객체로 변환 (paymentDate는 텍스트로 유지)
    const processedData = {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      paymentDate: data.paymentDate || null, // 텍스트 그대로 저장
    };

    if (editingContract) {
      updateContractMutation.mutate({ id: editingContract.id, data: processedData });
    } else {
      const contractData = { ...processedData, status: "진행중" };
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
      paymentDate: contract.paymentDate || "미정",
      description: contract.description || "",
      netProfit: contract.netProfit || "",
    });
    setIsCreating(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("정말로 이 계약을 삭제하시겠습니까?")) {
      deleteContractMutation.mutate(id);
    }
  };

  const getContractStatus = (contract: Contract) => {
    const endDate = new Date(contract.endDate);
    const today = new Date();
    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

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
                  {pendingContracts.length > 0 && (
                    <Badge className="ml-2 bg-orange-500 text-white">
                      {pendingContracts.length}
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
                  {pendingContracts.length === 0 ? (
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
                      {pendingContracts.map((contract) => (
                        <Card key={contract.id} className="p-4 border-orange-200 bg-orange-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold text-lg">{contract.contractName}</h4>
                              <p className="text-gray-600">{contract.clientName}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                금액: {contract.amount} | 기간: {new Date(contract.startDate).toLocaleDateString()} ~ {new Date(contract.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  updateContractMutation.mutate({ 
                                    id: contract.id, 
                                    data: { status: "진행중" } 
                                  });
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                계약 승인
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(contract)}
                              >
                                <Edit className="h-4 w-4" />
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
              onClick={() => {
                setEditingContract(null);
                form.reset();
                setIsCreating(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              새 계약 등록
            </Button>
          </div>
        </div>

        {/* 계약 등록/수정 폼 */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContract ? "계약 수정" : "새 계약 등록"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contractName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>계약명 *</FormLabel>
                        <FormControl>
                          <Input placeholder="계약명을 입력하세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>거래처명 *</FormLabel>
                        <FormControl>
                          <Input placeholder="거래처명을 입력하세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="transactionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>거래 유형</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="거래 유형 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="매출">매출</SelectItem>
                            <SelectItem value="매입">매입</SelectItem>
                            <SelectItem value="용역">용역</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>계약 금액 *</FormLabel>
                        <FormControl>
                          <Input placeholder="예: 5,000,000원" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>시작일 *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>종료일 *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>결제일</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="결제일 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="미정">결제일 미정</SelectItem>
                            <SelectItem value="매월 5일">매월 5일</SelectItem>
                            <SelectItem value="매월 10일">매월 10일</SelectItem>
                            <SelectItem value="매월 15일">매월 15일</SelectItem>
                            <SelectItem value="매월 25일">매월 25일</SelectItem>
                            <SelectItem value="매월 30일">매월 30일</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="netProfit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>순이익</FormLabel>
                        <FormControl>
                          <Input placeholder="예: 1,000,000원" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>설명</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="계약에 대한 추가 설명을 입력하세요"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                    취소
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createContractMutation.isPending || updateContractMutation.isPending}
                  >
                    {editingContract ? "수정" : "등록"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* 계약 목록 */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">계약을 불러오는 중...</p>
            </div>
          ) : approvedContracts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ClipboardList className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  등록된 계약이 없습니다
                </h3>
                <p className="text-gray-600 mb-6">
                  첫 번째 계약을 등록해보세요.
                </p>
                <Button 
                  onClick={() => setIsCreating(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  계약 등록하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {approvedContracts.map((contract) => {
                const statusInfo = getContractStatus(contract);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <Card key={contract.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg mb-1">{contract.contractName}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {contract.clientName}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {contract.amount}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.status}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(contract)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(contract.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">거래 유형</p>
                          <p className="font-medium">{contract.transactionType}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">시작일</p>
                          <p className="font-medium">
                            {new Date(contract.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">종료일</p>
                          <p className="font-medium">
                            {new Date(contract.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">결제일</p>
                          <p className="font-medium">{contract.paymentDate || "-"}</p>
                        </div>
                      </div>
                      {contract.description && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-600">{contract.description}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}