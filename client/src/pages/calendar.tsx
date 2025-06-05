import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertCalendarEventSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Bell,
  FileText,
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  StickyNote,
  AlertTriangle
} from "lucide-react";
import type { CalendarEvent, Contract, Project } from "@shared/schema";

export default function CalendarPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar-events"],
    queryFn: async () => {
      const response = await fetch("/api/calendar-events");
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // 디버깅용 로그
  console.log("Events data:", events);
  console.log("Events loading:", eventsLoading);
  console.log("Events error:", eventsError);

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
    queryFn: async () => {
      const response = await fetch("/api/contracts");
      if (!response.ok) throw new Error("Failed to fetch contracts");
      return response.json();
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // 디버깅용 로그
  console.log("Contracts data:", contracts);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const form = useForm({
    resolver: zodResolver(insertCalendarEventSchema),
    defaultValues: {
      title: "",
      date: new Date(),
      time: "",
      description: "",
      memo: "",
      type: "메모"
    }
  });

  const createEventMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/calendar-events", {
      ...data,
      date: data.date.toISOString().split('T')[0]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      queryClient.refetchQueries({ queryKey: ["/api/calendar-events"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "일정이 저장되었습니다!" });
    },
    onError: () => {
      toast({ title: "일정 저장에 실패했습니다", variant: "destructive" });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/calendar-events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      toast({ title: "일정이 삭제되었습니다!" });
    }
  });

  const onSubmit = (data: any) => {
    createEventMutation.mutate(data);
  };

  // 월 네비게이션 함수
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDayModalOpen(true);
  };

  // 선택된 날짜의 일정 가져오기
  const getSelectedDateEvents = () => {
    if (!selectedDate) return { events: [], contracts: [] };
    
    const dayEvents = events.filter(event => 
      new Date(event.date).toDateString() === selectedDate.toDateString()
    );
    
    const dayContracts = contracts.filter(contract => 
      new Date(contract.endDate).toDateString() === selectedDate.toDateString()
    );
    
    return { events: dayEvents, contracts: dayContracts };
  };

  // 선택된 월의 이벤트 필터링
  const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const currentMonthEvents = events
    .filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= currentMonthStart && eventDate <= currentMonthEnd;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 디버깅용 로그
  console.log("Events:", events);
  console.log("Current month events:", currentMonthEvents);

  // 계약 종료일 기준으로 알림 생성 (30일 전부터 표시)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const contractDeadlines = contracts
    .map(contract => {
      const endDate = new Date(contract.endDate);
      endDate.setHours(0, 0, 0, 0); // 시간을 00:00:00으로 설정
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        ...contract,
        daysUntilEnd: diffDays,
        urgency: diffDays <= 0 ? "expired" : diffDays <= 7 ? "urgent" : diffDays <= 30 ? "warning" : "normal"
      };
    })
    .filter(contract => contract.daysUntilEnd <= 30) // 30일 이내 계약만 표시
    .sort((a, b) => a.daysUntilEnd - b.daysUntilEnd);

  // 디버깅용 로그
  console.log("Contract deadlines:", contractDeadlines);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "contract_end":
        return ClipboardList;
      case "project_deadline":
        return FileText;
      default:
        return CalendarIcon;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "contract_end":
        return "bg-red-100 text-red-800";
      case "project_deadline":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      case "urgent":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "expired":
      case "urgent":
        return AlertCircle;
      case "warning":
        return Clock;
      default:
        return CheckCircle;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container-padding py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">캘린더</h1>
            <p className="text-gray-600">중요한 일정과 마감일을 확인하세요</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                일정 등록
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>새 일정 등록</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>제목</FormLabel>
                        <FormControl>
                          <Input placeholder="메모 제목을 입력하세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>날짜</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>시간 (선택사항)</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>분류</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="분류를 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="메모">📝 메모</SelectItem>
                            <SelectItem value="회의">🤝 회의</SelectItem>
                            <SelectItem value="할일">✅ 할일</SelectItem>
                            <SelectItem value="중요">⚠️ 중요</SelectItem>
                            <SelectItem value="개인">👤 개인</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>상세 내용</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="상세 내용을 입력하세요..."
                            rows={3}
                            {...field} 
                          />
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
                        <FormLabel>추가 메모</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="추가 메모나 참고사항..."
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={createEventMutation.isPending}
                      className="flex-1"
                    >
                      {createEventMutation.isPending ? "저장 중..." : "저장"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      취소
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 다가오는 이벤트 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월 일정
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousMonth}
                    className="h-8 w-8 p-0"
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToCurrentMonth}
                    className="h-8 px-2 text-xs"
                  >
                    오늘
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextMonth}
                    className="h-8 w-8 p-0"
                  >
                    →
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentMonthEvents.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">이번 달 예정된 이벤트가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentMonthEvents.map((event) => {
                    const EventIcon = getEventIcon(event.type);
                    const eventDate = new Date(event.date);
                    const diffTime = eventDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="p-2 bg-white rounded-lg mr-3">
                            <EventIcon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{event.title}</h4>
                            <p className="text-sm text-gray-600">
                              {eventDate.toLocaleDateString()} 
                              {diffDays === 0 && " (오늘)"}
                              {diffDays === 1 && " (내일)"}
                              {diffDays > 1 && ` (${diffDays}일 후)`}
                            </p>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 계약 마감 알림 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                계약 마감 알림
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contractDeadlines.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-500">임박한 계약 마감일이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contractDeadlines.map((contract) => {
                    const UrgencyIcon = getUrgencyIcon(contract.urgency);
                    
                    return (
                      <div 
                        key={contract.id} 
                        className={`p-4 rounded-lg border-2 ${getUrgencyColor(contract.urgency)}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <UrgencyIcon className="h-5 w-5 mr-3" />
                            <div>
                              <h4 className="font-medium">{contract.contractName}</h4>
                              <p className="text-sm">
                                종료일: {new Date(contract.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {contract.daysUntilEnd <= 0 
                                ? "종료됨" 
                                : `${contract.daysUntilEnd}일 남음`
                              }
                            </p>
                            <p className="text-sm">{contract.amount}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 월간 캘린더 뷰 (간단한 버전) */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월 캘린더
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousMonth}
                  className="h-8 w-8 p-0"
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToCurrentMonth}
                  className="h-8 px-2 text-xs"
                >
                  오늘
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextMonth}
                  className="h-8 w-8 p-0"
                >
                  →
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <div key={day} className="text-center font-medium text-gray-600 p-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }, (_, i) => {
                const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const startDate = new Date(firstDayOfMonth);
                startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
                
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isToday = date.toDateString() === today.toDateString();
                
                const dayEvents = events.filter(event => 
                  new Date(event.date).toDateString() === date.toDateString()
                );
                
                const dayContracts = contracts.filter(contract => 
                  new Date(contract.endDate).toDateString() === date.toDateString()
                );
                
                return (
                  <div 
                    key={i} 
                    onClick={() => handleDateClick(date)}
                    className={`p-2 min-h-[80px] border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                      isCurrentMonth ? "bg-white" : "bg-gray-50"
                    } ${isToday ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  >
                    <div className={`text-sm ${
                      isCurrentMonth ? "text-gray-900" : "text-gray-400"
                    } ${isToday ? "font-bold text-blue-600" : ""}`}>
                      {date.getDate()}
                    </div>
                    
                    <div className="space-y-1 mt-1">
                      {dayEvents.map((event) => (
                        <div key={event.id} className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate">
                          {event.title}
                        </div>
                      ))}
                      {dayContracts.map((contract) => (
                        <div key={contract.id} className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded truncate">
                          {contract.contractName} 종료
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 날짜별 일정 상세 모달 */}
      <Dialog open={isDayModalOpen} onOpenChange={setIsDayModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              {selectedDate?.toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })} 일정
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {(() => {
              const { events: dayEvents, contracts: dayContracts } = getSelectedDateEvents();
              const hasAnySchedule = dayEvents.length > 0 || dayContracts.length > 0;
              
              if (!hasAnySchedule) {
                return (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">이 날짜에 등록된 일정이 없습니다</p>
                  </div>
                );
              }
              
              return (
                <>
                  {/* 일정 이벤트 */}
                  {dayEvents.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        일정 ({dayEvents.length}개)
                      </h3>
                      <div className="space-y-3">
                        {dayEvents.map((event) => (
                          <div key={event.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-blue-900">{event.title}</h4>
                                <p className="text-sm text-blue-700 mt-1">
                                  <Clock className="inline h-3 w-3 mr-1" />
                                  {event.time}
                                </p>
                                {event.description && (
                                  <p className="text-sm text-blue-600 mt-2">{event.description}</p>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingEvent(event);
                                    setIsDayModalOpen(false);
                                    setIsDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteEventMutation.mutate(event.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 계약 마감일 */}
                  {dayContracts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        계약 마감일 ({dayContracts.length}개)
                      </h3>
                      <div className="space-y-3">
                        {dayContracts.map((contract) => (
                          <div key={contract.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-red-900">{contract.contractName}</h4>
                                <p className="text-sm text-red-700 mt-1">
                                  거래처: {contract.clientName}
                                </p>
                                <p className="text-sm text-red-700">
                                  계약금액: {contract.amount}
                                </p>
                                <p className="text-sm text-red-600 mt-2">
                                  <AlertTriangle className="inline h-3 w-3 mr-1" />
                                  계약 종료일
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}