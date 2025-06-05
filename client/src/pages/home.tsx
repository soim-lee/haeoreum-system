import Navigation from "@/components/navigation";
import { Brain, Zap, Shield, Users, BarChart3, Sparkles, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navigation />
      
      {/* 메인 히어로 섹션 - 모던 SaaS 스타일 */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 배경 패턴 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5"></div>
        
        {/* 플로팅 요소들 */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-indigo-200/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-20 w-24 h-24 bg-purple-200/25 rounded-full blur-xl animate-pulse delay-500"></div>

        {/* 중앙 컨텐츠 */}
        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
          {/* 상단 배지 */}
          <div className="mb-8 flex justify-center">
            <Badge variant="secondary" className="px-4 py-2 text-sm bg-blue-100 text-blue-700 border-blue-200">
              <Sparkles className="w-4 h-4 mr-2" />
              AI 기반 업무 관리 플랫폼
            </Badge>
          </div>

          {/* 메인 제목 */}
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Sunrise AI
            </span>
          </h1>
          
          {/* 부제목 */}
          <h2 className="text-xl md:text-2xl font-medium mb-6 text-slate-600">
            해오름인포텍의 스마트 업무 생산성 플랫폼
          </h2>

          {/* 설명 */}
          <p className="text-lg md:text-xl text-slate-500 mb-16 max-w-3xl mx-auto leading-relaxed">
            AI 기반 이력서 분석, 스마트 프로젝트 매칭, 통합 업무 관리로<br />
            <span className="font-semibold text-slate-700">업무 효율성을 10배 향상</span>시키는 차세대 플랫폼
          </p>

          {/* 핵심 기능 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 hover:border-blue-300/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800">AI 이력서 분석</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Gemini AI 기술로 이력서를 자동 분석하여<br />
                정확한 경력과 스킬을 추출합니다
              </p>
            </div>
            
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 hover:border-indigo-300/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800">스마트 매칭</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                프로젝트 요구사항과 인재 역량을<br />
                지능적으로 매칭하여 최적의 팀을 구성
              </p>
            </div>
            
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 hover:border-purple-300/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800">통합 대시보드</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                프로젝트부터 계약까지 모든 업무를<br />
                하나의 플랫폼에서 체계적으로 관리
              </p>
            </div>
          </div>

          {/* 통계 섹션 */}
          <div className="grid grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-blue-600 mb-2">10x</div>
              <div className="text-sm text-slate-600">업무 효율성 향상</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-indigo-600 mb-2">95%</div>
              <div className="text-sm text-slate-600">매칭 정확도</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-purple-600 mb-2">24/7</div>
              <div className="text-sm text-slate-600">자동화 모니터링</div>
            </div>
          </div>

          {/* 추가 기능 배지들 */}
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="outline" className="px-4 py-2 bg-white/50 border-slate-300 text-slate-700">
              <Shield className="w-4 h-4 mr-2" />
              보안 강화
            </Badge>
            <Badge variant="outline" className="px-4 py-2 bg-white/50 border-slate-300 text-slate-700">
              <Users className="w-4 h-4 mr-2" />
              팀 협업
            </Badge>
            <Badge variant="outline" className="px-4 py-2 bg-white/50 border-slate-300 text-slate-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              실시간 분석
            </Badge>
          </div>
        </div>

        {/* 하단 스크롤 인디케이터 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-slate-400 animate-bounce">
          <ChevronDown className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
