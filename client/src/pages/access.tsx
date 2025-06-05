import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building, Key } from "lucide-react";

const ACCESS_KEY = "sunrise050716"; // 액세스 키

export default function AccessPage() {
  const [accessKey, setAccessKey] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (accessKey === ACCESS_KEY) {
      // 액세스 허용 - 로컬 스토리지에 저장
      localStorage.setItem('techcorp_access', 'granted');
      toast({ title: "액세스 허용됨! 환영합니다!" });
      // 페이지 새로고침으로 상태 업데이트
      window.location.reload();
    } else {
      toast({ 
        title: "액세스 거부", 
        description: "올바른 액세스 키를 입력해주세요.",
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Building className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            해오름인포텍 업무 시스템
          </CardTitle>
          <p className="text-gray-600 mt-2">
            액세스 키를 입력하여 시스템에 접근하세요
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="accessKey" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                액세스 키
              </Label>
              <Input
                id="accessKey"
                type="password"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="액세스 키를 입력하세요"
                className="mt-1"
                required
              />
            </div>
            
            <Button type="submit" className="w-full">
              시스템 접근
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>힌트: <span className="font-medium">sunrise + 설립일</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}