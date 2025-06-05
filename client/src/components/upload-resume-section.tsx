import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function UploadResumeSection() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedSource, setSelectedSource] = useState("직접 접수");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadResumeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('source', selectedSource);
      formData.append('email', email);
      formData.append('phone', phone);
      
      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('업로드 실패');
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      // 블랙리스트 확인
      if (data.isBlacklisted) {
        toast({
          title: "⚠️ 블랙리스트 대상자 등록됨",
          description: `${data.blacklistInfo.name}님은 블랙리스트에 등록된 대상자입니다. ${data.blacklistInfo.memo ? `사유: ${data.blacklistInfo.memo}` : ''}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "이력서 업로드 완료!",
          description: "이력서가 성공적으로 분석되었습니다.",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      setDialogOpen(false);
      setSelectedSource("직접 접수");
      setSelectedFile(null);
      setEmail("");
      setPhone("");
    },
    onError: async (error: any) => {
      try {
        // 서버 응답에서 블랙리스트 정보 확인
        if (error.response) {
          const errorData = await error.response.json();
          if (errorData.isBlacklisted) {
            toast({
              title: "⚠️ 등록 제한 대상자",
              description: `${errorData.blacklistInfo.name}님은 블랙리스트에 등록된 대상자입니다. ${errorData.blacklistInfo.memo ? `사유: ${errorData.blacklistInfo.memo}` : ''}`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "업로드 실패",
              description: errorData.message || "이력서 업로드 중 오류가 발생했습니다.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "업로드 실패",
            description: "이력서 업로드 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "업로드 실패",
          description: "이력서 업로드 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
      setSelectedFile(null);
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file) return;
    
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "지원하지 않는 파일 형식입니다",
        description: "PDF, DOC, DOCX 파일만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "파일 크기가 너무 큽니다",
        description: "10MB 이하의 파일만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "파일을 선택해주세요",
        description: "업로드할 이력서 파일을 먼저 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSource.trim()) {
      toast({
        title: "출처를 입력해주세요",
        description: "이력서 출처를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    uploadResumeMutation.mutate(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="p-6">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            이력서 업로드
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>이력서 업로드</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 정보 입력 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="source-input" className="text-sm font-medium text-gray-700 mb-2 block">
                  이력서 출처
                </Label>
                <Input
                  id="source-input"
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  placeholder="예: 잡코리아, 사람인 등"
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="email-input" className="text-sm font-medium text-gray-700 mb-2 block">
                  이메일
                </Label>
                <Input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="phone-input" className="text-sm font-medium text-gray-700 mb-2 block">
                  연락처
                </Label>
                <Input
                  id="phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-1234-5678"
                  className="w-full"
                />
              </div>
            </div>

            {/* 업로드 영역 */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 cursor-pointer ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedFile ? "파일 선택됨" : "이력서를 드래그하거나 클릭하여 선택"}
              </h3>
              {selectedFile ? (
                <p className="text-blue-600 mb-4 font-medium">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}KB)
                </p>
              ) : (
                <p className="text-gray-600 mb-4">
                  DOCX, PDF 파일을 업로드할 수 있습니다
                </p>
              )}
              
              <Button
                type="button"
                disabled={uploadResumeMutation.isPending}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors duration-200"
              >
                {selectedFile ? "다른 파일 선택" : "파일 선택"}
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileInputChange}
              />
            </div>

            {/* 등록하기 버튼 */}
            {selectedFile && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleUpload}
                  disabled={uploadResumeMutation.isPending || !selectedSource.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {uploadResumeMutation.isPending ? "등록 중..." : "등록하기"}
                </Button>
                <Button
                  onClick={() => {
                    setSelectedFile(null);
                    setSelectedSource("직접 접수");
                  }}
                  variant="outline"
                  disabled={uploadResumeMutation.isPending}
                >
                  취소
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}