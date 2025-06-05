import { Button } from "@/components/ui/button";
import { scrollToSection } from "@/lib/smooth-scroll";
import { FileText, Users, Target } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-10"></div>
      
      <div className="relative container-padding py-24 lg:py-32">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            업무 관리를
            <br />
            <span className="text-blue-200">한 곳에서 완벽하게</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
            프로젝트, 이력서, 계약, 일정을 통합 관리하는 스마트 워크플로우 플랫폼
          </p>
          
          <div className="grid md:grid-cols-4 gap-6 mb-10 max-w-5xl mx-auto">
            <div className="bg-white bg-opacity-10 p-6 rounded-lg">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">프로젝트 관리</h3>
              <p className="text-blue-100">프로젝트 등록, 진행상태 관리</p>
            </div>
            <div className="bg-white bg-opacity-10 p-6 rounded-lg">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">이력서 분석</h3>
              <p className="text-blue-100">AI 자동 분석 및 매칭</p>
            </div>
            <div className="bg-white bg-opacity-10 p-6 rounded-lg">
              <Target className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">계약 현황</h3>
              <p className="text-blue-100">계약 관리 및 일정 알림</p>
            </div>
            <div className="bg-white bg-opacity-10 p-6 rounded-lg">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">양식 관리</h3>
              <p className="text-blue-100">문서 업로드 및 다운로드</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/dashboard"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg text-center"
            >
              지금 시작하기
            </a>
            <a
              href="/projects"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-200 text-center"
            >
              기능 둘러보기
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}