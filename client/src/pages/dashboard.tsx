import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Users, 
  Calendar, 
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  BarChart3,
  PieChart,
  RefreshCw
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import type { Project, Resume, Contract, CalendarEvent } from "@shared/schema";

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const queryClient = useQueryClient();
  
  // 대시보드 데이터 조회 - 직접 fetch 사용
  const { data: projects = [], isLoading: projectsLoading, refetch: refetchProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });

  const { data: resumes = [], isLoading: resumesLoading, refetch: refetchResumes } = useQuery<Resume[]>({
    queryKey: ["/api/resumes"],
    queryFn: async () => {
      const response = await fetch("/api/resumes");
      if (!response.ok) throw new Error("Failed to fetch resumes");
      return response.json();
    },
  });

  const { data: contracts = [], isLoading: contractsLoading, refetch: refetchContracts } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
    queryFn: async () => {
      const response = await fetch("/api/contracts");
      if (!response.ok) throw new Error("Failed to fetch contracts");
      return response.json();
    },
  });

  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar-events"],
    queryFn: async () => {
      const response = await fetch("/api/calendar-events");
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
  });

  // 수동 새로고침 함수
  const handleRefreshData = async () => {
    try {
      // 캐시 완전 무효화
      queryClient.removeQueries({ queryKey: ["/api/projects"] });
      queryClient.removeQueries({ queryKey: ["/api/resumes"] });
      queryClient.removeQueries({ queryKey: ["/api/contracts"] });
      queryClient.removeQueries({ queryKey: ["/api/calendar-events"] });
      
      // 강제 리페치
      await Promise.all([
        refetchProjects(),
        refetchResumes(), 
        refetchContracts(),
        refetchEvents()
      ]);
      
      console.log('대시보드 데이터 새로고침 완료');
    } catch (error) {
      console.error('데이터 새로고침 실패:', error);
    }
  };

  // 로딩 상태 확인
  const isLoading = projectsLoading || resumesLoading || contractsLoading || eventsLoading;



  // 통계 계산
  const activeProjects = projects.filter((p: Project) => p.status === "진행중").length;
  const completedProjects = projects.filter((p: Project) => p.status === "완료").length;
  const upcomingDeadlines = events.filter((e: CalendarEvent) => {
    const eventDate = new Date(e.date);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  }).length;

  const stats = [
    {
      title: "진행중인 프로젝트",
      value: activeProjects,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "등록된 이력서",
      value: resumes.length,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "계약 건수",
      value: contracts.length,
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "완료된 프로젝트",
      value: completedProjects,
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  // 실제 데이터 기반 차트 데이터 생성
  const generateChartData = () => {
    const currentMonth = new Date().getMonth();
    const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    
    // 실제 데이터 기반으로 월별 데이터 생성
    return months.slice(0, 6).map((month, index) => {
      // 현재 월 기준으로 실제 데이터만 표시
      const isCurrentMonth = index === currentMonth;
      
      return {
        name: month,
        프로젝트: isCurrentMonth ? projects.length : 0,
        계약금액: isCurrentMonth ? contracts.reduce((sum, contract) => {
          const amount = parseInt(contract.amount.replace(/[^0-9]/g, '')) || 0;
          return sum + amount;
        }, 0) : 0,
        이력서: isCurrentMonth ? resumes.length : 0
      };
    });
  };

  const chartData = generateChartData();

  // 프로젝트 상태 파이 차트 데이터
  const projectStatusData = [
    { name: "진행중", value: activeProjects, color: "#3B82F6" },
    { name: "완료", value: completedProjects, color: "#10B981" },
    { name: "대기", value: projects.length - activeProjects - completedProjects, color: "#F59E0B" }
  ];

  // 계약 금액 총합
  const totalContractAmount = contracts.reduce((sum, contract) => {
    const amount = parseInt(contract.amount.replace(/[^0-9]/g, '')) || 0;
    return sum + amount;
  }, 0);

  // 월별 계약 현황
  const contractTrendData = contracts.slice(0, 6).map((contract, index) => ({
    name: `${index + 1}월`,
    매출: parseInt(contract.amount.replace(/[^0-9]/g, '')) || 0,
    순이익: (contract as any).netProfit ? parseInt((contract as any).netProfit.replace(/[^0-9]/g, '')) || 0 : 0
  }));


  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">업무 대시보드</h1>
            <p className="text-gray-600 mt-2">실시간 업무 현황을 확인하세요</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleRefreshData}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </Button>
            <Button
              variant={timeRange === "monthly" ? "default" : "outline"}
              onClick={() => setTimeRange("monthly")}
              size="sm"
            >
              월별
            </Button>
            <Button
              variant={timeRange === "quarterly" ? "default" : "outline"}
              onClick={() => setTimeRange("quarterly")}
              size="sm"
            >
              분기별
            </Button>
            <Button
              variant={timeRange === "yearly" ? "default" : "outline"}
              onClick={() => setTimeRange("yearly")}
              size="sm"
            >
              연별
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            // 스켈레톤 로딩 상태
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                      <Skeleton className="h-12 w-12 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            // 실제 데이터 표시
            stats.map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 월별 업무 현황 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                월별 업무 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === "계약금액") {
                        return [`${(value as number).toLocaleString()}원`, name];
                      }
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="프로젝트" fill="#3B82F6" />
                  <Bar dataKey="이력서" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 프로젝트 상태 분포 */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <PieChart className="h-5 w-5 text-blue-600" />
                프로젝트 상태 분포
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                {/* 파이 차트 */}
                <div className="relative">
                  <ResponsiveContainer width="100%" height={220}>
                    <RechartsPieChart>
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#1D4ED8" />
                        </linearGradient>
                        <linearGradient id="completedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="waitingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#F59E0B" />
                          <stop offset="100%" stopColor="#D97706" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        startAngle={90}
                        endAngle={450}
                      >
                        {projectStatusData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? "url(#progressGradient)" : 
                                  index === 1 ? "url(#completedGradient)" : 
                                  "url(#waitingGradient)"} 
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value}개`, name]}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  
                  {/* 중앙 총계 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{projects.length}</div>
                      <div className="text-sm text-gray-500">총 프로젝트</div>
                    </div>
                  </div>
                </div>

                {/* 상태별 상세 정보 */}
                <div className="space-y-4">
                  {projectStatusData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium text-gray-700">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{item.value}개</div>
                        <div className="text-xs text-gray-500">
                          {projects.length > 0 ? ((item.value / projects.length) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 계약 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              계약 매출 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-gray-600">총 계약금액</p>
              <p className="text-2xl font-bold text-green-600">
                {totalContractAmount.toLocaleString()}원
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={contractTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${(value as number).toLocaleString()}원`]}
                />
                <Line type="monotone" dataKey="매출" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="순이익" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 최근 계약 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              최근 계약
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contracts.slice(0, 5).map((contract: Contract) => (
                <div key={contract.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{contract.contractName}</p>
                    <p className="text-sm text-gray-600">{contract.clientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{contract.amount}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      contract.transactionType === "매출" ? "bg-green-100 text-green-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {contract.transactionType}
                    </span>
                  </div>
                </div>
              ))}
              {contracts.length === 0 && (
                <p className="text-gray-500 text-center py-4">등록된 계약이 없습니다</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}