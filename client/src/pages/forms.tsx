import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Upload, 
  Download,
  Trash2,
  Plus,
  Folder,
  Clock
} from "lucide-react";
import type { Form } from "@shared/schema";

export default function FormsPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formName, setFormName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: forms = [], isLoading } = useQuery<Form[]>({
    queryKey: ["/api/forms"],
  });

  const uploadFormMutation = useMutation({
    mutationFn: async ({ file, name }: { file: File; name: string }) => {
      const formData = new FormData();
      formData.append("form", file);
      formData.append("formName", name);
      
      const response = await fetch("/api/forms", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("업로드 실패");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      setSelectedFile(null);
      setFormName("");
      setIsUploading(false);
      toast({ title: "양식이 성공적으로 업로드되었습니다!" });
    },
    onError: () => {
      toast({ title: "양식 업로드에 실패했습니다.", variant: "destructive" });
    },
  });

  const deleteFormMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/forms/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({ title: "양식이 삭제되었습니다!" });
    },
  });

  const handleUpload = () => {
    if (selectedFile && formName.trim()) {
      uploadFormMutation.mutate({ file: selectedFile, name: formName.trim() });
    }
  };

  const handleDownload = (form: Form) => {
    // 다운로드 링크 생성하여 클릭
    const link = document.createElement('a');
    link.href = `/api/forms/${form.id}/download`;
    link.download = form.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "파일 다운로드를 시작합니다!" });
  };

  const handleDelete = (id: number) => {
    if (confirm("정말로 이 양식을 삭제하시겠습니까?")) {
      deleteFormMutation.mutate(id);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return <FileText className="h-8 w-8 text-blue-600" />;
  };

  const formatFileSize = (base64String: string) => {
    // Base64 문자열의 대략적인 바이트 크기 계산
    const bytes = (base64String.length * 3) / 4;
    if (bytes < 1024) return `${bytes.toFixed(0)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container-padding py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">양식 관리</h1>
            <p className="text-gray-600">각종 양식을 업로드하고 언제든지 다운로드하세요</p>
          </div>
          <Button
            onClick={() => setIsUploading(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            양식 업로드
          </Button>
        </div>

        {/* 양식 업로드 */}
        {isUploading && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>새 양식 업로드</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="formName">양식명</Label>
                  <Input
                    id="formName"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="양식의 이름을 입력하세요"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="form-file" className="text-base font-medium">파일 선택</Label>
                  <div className="relative">
                    <Input
                      id="form-file"
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="form-file"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                    >
                      <div className="text-center">
                        {selectedFile ? (
                          <div className="flex flex-col items-center">
                            <FileText className="h-8 w-8 text-blue-600 mb-2" />
                            <p className="text-sm font-medium text-blue-700">{selectedFile.name}</p>
                            <p className="text-xs text-blue-500 mt-1">
                              크기: {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="h-12 w-12 text-blue-400 mb-3" />
                            <p className="text-lg font-medium text-blue-600 mb-1">
                              파일을 선택하거나 드래그하여 업로드
                            </p>
                            <p className="text-sm text-blue-500">
                              모든 파일 형식을 지원합니다
                            </p>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                  {selectedFile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      파일 선택 취소
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpload}
                    disabled={!selectedFile || !formName.trim() || uploadFormMutation.isPending}
                  >
                    {uploadFormMutation.isPending ? "업로드 중..." : "업로드"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsUploading(false);
                      setSelectedFile(null);
                      setFormName("");
                    }}
                  >
                    취소
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 양식 목록 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">양식을 불러오는 중...</p>
            </div>
          ) : forms.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-12">
                  <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    등록된 양식이 없습니다
                  </h3>
                  <p className="text-gray-600 mb-6">
                    첫 번째 양식을 업로드해보세요
                  </p>
                  <Button onClick={() => setIsUploading(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    양식 업로드
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            forms.map((form) => (
              <Card key={form.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      {getFileIcon(form.fileName)}
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {form.formName}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {form.fileName}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {new Date(form.uploadedAt!).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      크기: {formatFileSize(form.fileData)}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(form)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      다운로드
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(form.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}