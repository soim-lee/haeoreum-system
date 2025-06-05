import { 
  FileText, 
  Users, 
  Calendar, 
  TrendingUp, 
  Shield, 
  Zap,
  Clock,
  CheckCircle
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "프로젝트 관리",
    description: "프로젝트 등록부터 진행상태 관리까지 체계적으로 관리하세요.",
    color: "bg-blue-500"
  },
  {
    icon: Users,
    title: "이력서 분석",
    description: "AI가 이력서를 자동 분석하여 최적의 프로젝트를 추천합니다.",
    color: "bg-green-500"
  },
  {
    icon: TrendingUp,
    title: "계약 현황",
    description: "계약 정보를 체계적으로 관리하고 종료일 알림을 받으세요.",
    color: "bg-purple-500"
  },
  {
    icon: Calendar,
    title: "스마트 캘린더",
    description: "모든 일정을 한눈에 보고 중요한 날짜를 놓치지 마세요.",
    color: "bg-orange-500"
  },
  {
    icon: Shield,
    title: "양식 관리",
    description: "각종 문서 양식을 업로드하고 언제든 다운로드할 수 있습니다.",
    color: "bg-red-500"
  },
  {
    icon: Zap,
    title: "업무 효율성",
    description: "반복적인 업무를 자동화하여 생산성을 극대화하세요.",
    color: "bg-yellow-500"
  }
];

const benefits = [
  "프로젝트 진행상태 실시간 추적",
  "AI 기반 이력서 자동 분석",
  "계약 종료일 자동 알림",
  "모바일 친화적 반응형 디자인",
  "직관적이고 현대적인 UI/UX",
  "데이터 백업 및 보안"
];

export default function FeaturesSection() {
  return (
    <>
      {/* 주요 기능 소개 */}
      <section className="section-padding bg-white">
        <div className="container-padding">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              업무 관리의 새로운 표준
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sunrise AI로 복잡한 업무 프로세스를 간단하고 효율적으로 관리하세요
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow duration-300">
                  <div className={`w-16 h-16 ${feature.color} rounded-lg flex items-center justify-center mb-6`}>
                    <IconComponent className="text-white h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 혜택 및 장점 */}
      <section className="section-padding bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container-padding">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                왜 Sunrise AI를 선택해야 할까요?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                복잡한 업무 관리를 단순화하고, AI의 도움으로 더 스마트하게 일하세요.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <a
                  href="/dashboard"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 inline-block"
                >
                  무료로 시작하기
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white p-8 rounded-xl shadow-xl">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <TrendingUp className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">업무 효율성</h3>
                    <p className="text-gray-600">평균 40% 향상</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">프로젝트 관리</span>
                    <div className="flex items-center">
                      <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                        <div className="w-20 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-500">85%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">이력서 분석</span>
                    <div className="flex items-center">
                      <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                        <div className="w-22 h-2 bg-green-600 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-500">92%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">일정 관리</span>
                    <div className="flex items-center">
                      <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                        <div className="w-18 h-2 bg-purple-600 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-500">78%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
                <Clock className="text-white h-12 w-12" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="section-padding bg-gray-900 text-white">
        <div className="container-padding text-center">
          <h2 className="text-4xl font-bold mb-6">
            지금 바로 시작해보세요
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            복잡한 업무 관리, 이제 WorkFlow Pro와 함께 간단하게 해결하세요
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/dashboard"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              무료 체험 시작
            </a>
            <a
              href="/projects"
              className="border-2 border-gray-600 text-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 hover:border-gray-500 transition-colors duration-200"
            >
              기능 더 보기
            </a>
          </div>
        </div>
      </section>
    </>
  );
}