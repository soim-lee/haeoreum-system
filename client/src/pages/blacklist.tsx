import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  Plus, 
  User, 
  Calendar, 
  GraduationCap,
  FileText,
  Trash2,
  Search
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertBlacklistSchema, type Blacklist, type InsertBlacklist } from "@shared/schema";

export default function BlacklistPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: blacklist = [], isLoading } = useQuery<Blacklist[]>({
    queryKey: ["/api/blacklist"],
    queryFn: async () => {
      const response = await fetch("/api/blacklist");
      if (!response.ok) throw new Error("Failed to fetch blacklist");
      return response.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const form = useForm<InsertBlacklist>({
    resolver: zodResolver(insertBlacklistSchema),
    defaultValues: {
      name: "",
      birthDate: "",
      education: "",
      memo: "",
    },
  });

  const createBlacklistMutation = useMutation({
    mutationFn: (data: InsertBlacklist) => apiRequest("POST", "/api/blacklist", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] });
      queryClient.refetchQueries({ queryKey: ["/api/blacklist"] });
      toast({ title: "블랙리스트에 등록되었습니다!" });
      form.reset();
      setIsCreating(false);
    },
    onError: (error: any) => {
      toast({
        title: "등록 실패",
        description: error.message || "블랙리스트 등록에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const deleteBlacklistMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/blacklist/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] });
      queryClient.refetchQueries({ queryKey: ["/api/blacklist"] });
      toast({ title: "블랙리스트에서 삭제되었습니다!" });
    },
    onError: (error: any) => {
      toast({
        title: "삭제 실패",
        description: error.message || "블랙리스트 삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number, name: string) => {
    const confirmed = window.confirm(`"${name}"을(를) 블랙리스트에서 삭제하시겠습니까?`);
    if (confirmed) {
      deleteBlacklistMutation.mutate(id);
    }
  };

  const onSubmit = (data: InsertBlacklist) => {
    createBlacklistMutation.mutate(data);
  };

  // 검색 필터링
  const filteredBlacklist = blacklist.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container-padding py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">블랙리스트 관리</h1>
            <p className="text-gray-600">등록 제한 대상자를 관리하세요</p>
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                블랙리스트 등록
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  블랙리스트 등록
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이름 *</FormLabel>
                        <FormControl>
                          <Input placeholder="예: 홍길동" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>생년월일</FormLabel>
                        <FormControl>
                          <Input placeholder="예: 1990-01-01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="education"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>최종학력</FormLabel>
                        <FormControl>
                          <Input placeholder="예: 학사" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="memo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>메모</FormLabel>
                        <FormControl>
                          <Textarea placeholder="등록 사유나 추가 정보를 입력하세요" {...field} />
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
                      disabled={createBlacklistMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      등록
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* 검색창 */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 블랙리스트 목록 */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">블랙리스트를 불러오는 중...</p>
            </div>
          ) : filteredBlacklist.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? "검색 결과가 없습니다" : "등록된 블랙리스트가 없습니다"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? "다른 검색어를 시도해보세요." : "첫 번째 블랙리스트를 등록해보세요."}
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setIsCreating(true)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    블랙리스트 등록하기
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredBlacklist.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow border-red-100">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg mb-1 flex items-center gap-2">
                          <User className="h-5 w-5 text-red-600" />
                          {item.name}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {item.birthDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {item.birthDate}
                            </div>
                          )}
                          {item.education && (
                            <div className="flex items-center gap-1">
                              <GraduationCap className="h-4 w-4" />
                              {item.education}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item.id, item.name)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {item.memo && (
                    <CardContent className="pt-0">
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4 mt-0.5" />
                        <p>{item.memo}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}