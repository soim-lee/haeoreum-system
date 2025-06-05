import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, Sunrise, Building2 } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center px-4">
      <div className="text-center text-white max-w-2xl mx-auto">
        {/* 로고 섹션 */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <Sunrise className="w-10 h-10 text-yellow-300" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <Building2 className="w-3 h-3 text-blue-900" />
            </div>
          </div>
        </div>

        {/* 404 메시지 */}
        <div className="mb-8">
          <h1 className="text-8xl md:text-9xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-blue-100">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="text-lg text-blue-200 mb-8 max-w-md mx-auto">
            요청하신 페이지가 존재하지 않거나<br />
            잘못된 주소로 접근하셨습니다.
          </p>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/">
            <Button 
              size="lg" 
              className="bg-white text-blue-900 hover:bg-blue-50 font-semibold px-8 py-4 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <Home className="mr-2 w-5 h-5" />
              홈으로 돌아가기
            </Button>
          </Link>
          
          <Button 
            onClick={() => window.history.back()}
            variant="outline" 
            size="lg"
            className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg rounded-xl backdrop-blur-sm transition-all duration-300"
          >
            <ArrowLeft className="mr-2 w-5 h-5" />
            이전 페이지
          </Button>
        </div>

        {/* 도움말 섹션 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-center">
            <Search className="mr-2 w-5 h-5" />
            찾고 계신 페이지가 있나요?
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Link href="/dashboard" className="hover:text-yellow-300 transition-colors">
              📊 대시보드
            </Link>
            <Link href="/projects" className="hover:text-yellow-300 transition-colors">
              📋 프로젝트
            </Link>
            <Link href="/resumes" className="hover:text-yellow-300 transition-colors">
              👥 이력서
            </Link>
            <Link href="/contracts" className="hover:text-yellow-300 transition-colors">
              📄 계약
            </Link>
            <Link href="/calendar" className="hover:text-yellow-300 transition-colors">
              📅 캘린더
            </Link>
            <Link href="/forms" className="hover:text-yellow-300 transition-colors">
              📁 양식
            </Link>
            <Link href="/access" className="hover:text-yellow-300 transition-colors">
              🔐 접속
            </Link>
            <Link href="/" className="hover:text-yellow-300 transition-colors">
              🏠 홈
            </Link>
          </div>
        </div>

        {/* 브랜드 정보 */}
        <div className="mt-8 text-blue-300 text-sm">
          <p>Sunrise Info - 해오름인포텍 업무 시스템</p>
        </div>
      </div>
    </div>
  );
}
