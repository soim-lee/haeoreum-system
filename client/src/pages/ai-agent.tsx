import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  Users, 
  FileText, 
  Brain,
  MessageCircle,
  Loader2,
  Calendar
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Project, Resume, CalendarEvent, InsertCalendarEvent } from "@shared/schema";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: Array<{
    project: Project;
    resume: Resume;
    matchScore: number;
    reasons: string[];
  }>;
  calendarEvent?: InsertCalendarEvent;
}

export default function AIAgentPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: '안녕하세요! 저는 해오름인포텍 업무시스템의 AI 에이전트입니다.\n\n다음과 같은 업무를 도와드릴 수 있습니다:\n\n📊 **데이터 분석**\n• 모든 이력서 분석 ("이력서 분석해줘", "최충 이력서 분석해줘")\n• 매출 현황 분석 ("이번달 매출 얼마야?")\n• 계약 상태 분석 ("완료된 계약 현황 분석해줘")\n\n📋 **프로젝트 등록**\n• "새 Java 웹 개발 프로젝트 등록해줘, 예산 5000만원, 인원 3명, 서울"\n\n📅 **일정 등록**\n• "5월 30일 오후 2시 티지소프트 미팅 일정 등록해줘"\n• "내일 오전 10시 면접 일정 추가해줘"\n\n자연어로 편하게 대화해주세요!',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 자연어를 캘린더 이벤트로 파싱하는 함수
  const parseCalendarEvent = (message: string): InsertCalendarEvent | null => {
    const lowerMessage = message.toLowerCase();
    
    // 일정 등록 관련 키워드 확인
    if (!lowerMessage.includes('일정') && !lowerMessage.includes('미팅') && !lowerMessage.includes('회의')) {
      return null;
    }

    const currentYear = new Date().getFullYear();
    let parsedEvent: Partial<InsertCalendarEvent> = {};

    // 날짜 파싱
    const datePatterns = [
      /(\d{1,2})월\s*(\d{1,2})일/,
      /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/,
      /(\d{1,2})\/(\d{1,2})/,
      /(오늘|내일|모레)/
    ];

    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        if (match[0].includes('오늘')) {
          parsedEvent.date = new Date();
        } else if (match[0].includes('내일')) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          parsedEvent.date = tomorrow;
        } else if (match[0].includes('모레')) {
          const dayAfterTomorrow = new Date();
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
          parsedEvent.date = dayAfterTomorrow;
        } else if (match[3]) {
          // 년도가 포함된 경우
          parsedEvent.date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        } else {
          // 월일만 있는 경우
          parsedEvent.date = new Date(currentYear, parseInt(match[1]) - 1, parseInt(match[2]));
        }
        break;
      }
    }

    // 시간 파싱
    const timePatterns = [
      /(\d{1,2})시\s*(\d{1,2})?분?/,
      /오전\s*(\d{1,2})시/,
      /오후\s*(\d{1,2})시/,
      /(아침|점심|저녁|밤)/
    ];

    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        if (match[0].includes('오전')) {
          parsedEvent.time = `${match[1].padStart(2, '0')}:00`;
        } else if (match[0].includes('오후')) {
          const hour = parseInt(match[1]) === 12 ? 12 : parseInt(match[1]) + 12;
          parsedEvent.time = `${hour.toString().padStart(2, '0')}:00`;
        } else if (match[0].includes('아침')) {
          parsedEvent.time = '09:00';
        } else if (match[0].includes('점심')) {
          parsedEvent.time = '12:00';
        } else if (match[0].includes('저녁')) {
          parsedEvent.time = '18:00';
        } else if (match[0].includes('밤')) {
          parsedEvent.time = '20:00';
        } else {
          const hour = parseInt(match[1]);
          const minute = match[2] ? parseInt(match[2]) : 0;
          parsedEvent.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        }
        break;
      }
    }

    // 제목 추출 (회사명, 미팅명 등)
    const titlePatterns = [
      /([가-힣a-zA-Z]+)\s*(미팅|회의|만남)/,
      /([가-힣a-zA-Z]+)과?\s*(미팅|회의)/,
      /(미팅|회의|만남)\s*([가-힣a-zA-Z]+)/
    ];

    for (const pattern of titlePatterns) {
      const match = message.match(pattern);
      if (match) {
        if (match[1] && !['미팅', '회의', '만남'].includes(match[1])) {
          parsedEvent.title = `${match[1]} ${match[2] || '미팅'}`;
        } else if (match[2] && !['미팅', '회의', '만남'].includes(match[2])) {
          parsedEvent.title = `${match[2]} ${match[1]}`;
        }
        break;
      }
    }

    // 기본값 설정
    if (!parsedEvent.date) {
      parsedEvent.date = new Date();
    }
    if (!parsedEvent.time) {
      parsedEvent.time = '14:00';
    }
    if (!parsedEvent.title) {
      parsedEvent.title = '미팅';
    }

    return {
      title: parsedEvent.title,
      date: parsedEvent.date,
      time: parsedEvent.time,
      description: message
    } as InsertCalendarEvent;
  };

  const createCalendarEventMutation = useMutation({
    mutationFn: (data: InsertCalendarEvent) => apiRequest("POST", "/api/calendar-events", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      toast({ title: "일정이 캘린더에 등록되었습니다!" });
    },
  });

  const aiAnalysisMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai-agent/analyze", {
        message
      });
      return await response.json();
    },
    onSuccess: (response: any) => {
      console.log("AI Response received:", response);
      setIsTyping(false);
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: response.response,
        timestamp: new Date(),
        suggestions: response.suggestions
      };
      console.log("Adding AI message:", aiMessage);
      setMessages(prev => [...prev, aiMessage]);
    },
    onError: (error) => {
      setIsTyping(false);
      toast({
        title: "AI 분석 오류",
        description: "AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive"
      });
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // AI 프로젝트 분석 mutation
  const analyzeProjectMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai-agent/analyze-project", {
        message
      });
      return await response.json();
    },
    onSuccess: (response) => {
      setIsTyping(false);
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `✅ ${response.message}\n\n📋 분석된 프로젝트 정보:\n• 제목: ${response.project.title}\n• 위치: ${response.project.location}\n• 기간: ${response.project.duration}\n• 등급: ${response.project.grade}\n• 인원: ${response.project.headcount}\n• 기술: ${response.project.skills.join(', ')}\n• 예산: ${response.project.amount}\n\n프로젝트가 시스템에 등록되었습니다!`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      toast({ title: "프로젝트가 성공적으로 등록되었습니다!" });
    },
    onError: (error: any) => {
      setIsTyping(false);
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `❌ 프로젝트 분석 중 오류가 발생했습니다.\n\n${error.error || "알 수 없는 오류"}\n\n다시 시도해주시거나, 프로젝트 정보를 더 자세히 입력해주세요.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      toast({ 
        title: "프로젝트 등록 실패", 
        description: error.error || "프로젝트 등록 중 오류가 발생했습니다.",
        variant: "destructive" 
      });
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // 일정 등록 요청인지 확인
    const calendarEvent = parseCalendarEvent(inputMessage);
    
    if (calendarEvent) {
      // 일정 등록 처리
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `📅 일정을 분석했습니다!\n\n• 제목: ${calendarEvent.title}\n• 날짜: ${calendarEvent.date.toLocaleDateString('ko-KR')}\n• 시간: ${calendarEvent.time}\n• 설명: ${calendarEvent.description}\n\n캘린더에 등록하시겠습니까?`,
        timestamp: new Date(),
        calendarEvent: calendarEvent
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    } else {
      // 프로젝트 등록 키워드 확인
      const isProjectRegistration = inputMessage.toLowerCase().includes('프로젝트 등록') || 
                                   inputMessage.toLowerCase().includes('프로젝트 추가') ||
                                   inputMessage.toLowerCase().includes('새 프로젝트');
      
      if (isProjectRegistration) {
        // 프로젝트 등록 처리
        analyzeProjectMutation.mutate(inputMessage);
      } else {
        // 일반 AI 대화 분석 처리
        aiAnalysisMutation.mutate(inputMessage);
      }
    }
    
    setInputMessage("");
  };

  // 일정 등록 확인 함수
  const handleCalendarEventConfirm = (calendarEvent: InsertCalendarEvent) => {
    createCalendarEventMutation.mutate(calendarEvent);
    
    const aiMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: `✅ 일정이 캘린더에 등록되었습니다!\n\n캘린더 페이지에서 확인하실 수 있습니다.`,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, aiMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container-padding py-8">
        {/* 채팅 인터페이스 */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center">
              <MessageCircle className="mr-2 h-5 w-5" />
              AI 에이전트와 대화하기
              <Badge variant="secondary" className="ml-auto">
                <Sparkles className="w-3 h-3 mr-1" />
                실시간 분석
              </Badge>
            </CardTitle>
          </CardHeader>

          {/* 메시지 영역 */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.type === 'ai' && (
                      <Bot className="w-5 h-5 mt-0.5 text-blue-600" />
                    )}
                    {message.type === 'user' && (
                      <User className="w-5 h-5 mt-0.5 text-white" />
                    )}
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      
                      {/* 일정 등록 확인 버튼 */}
                      {message.calendarEvent && (
                        <div className="mt-4">
                          <Button
                            onClick={() => handleCalendarEventConfirm(message.calendarEvent!)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            일정 등록하기
                          </Button>
                        </div>
                      )}
                      
                      {/* AI 매칭 추천 */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <p className="font-semibold text-blue-600">🎯 추천 매칭:</p>
                          {message.suggestions.map((suggestion, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg border">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900">
                                  {suggestion.project.title} ↔ {suggestion.resume.fileName}
                                </h4>
                                <Badge variant="secondary">
                                  매칭도: {suggestion.matchScore}%
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p><strong>프로젝트:</strong> {suggestion.project.description}</p>
                                <p><strong>인재:</strong> {suggestion.resume.specialization || '전문분야 미등록'} • {suggestion.resume.experience || '경력 미등록'}년</p>
                              </div>
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700 mb-1">매칭 이유:</p>
                                <ul className="text-xs text-gray-600 space-y-1">
                                  {suggestion.reasons.map((reason, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="text-green-500 mr-1">•</span>
                                      {reason}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs mt-2 opacity-70">
                        {formatTimestamp(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* 타이핑 인디케이터 */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4 max-w-[70%]">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    <div className="flex items-center space-x-1">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-gray-600">AI가 분석 중입니다...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>

          {/* 입력 영역 */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="AI 에이전트에게 질문하세요... (예: '이번달 총 매출은 얼마인가요?', '최적의 인재 매칭을 추천해주세요')"
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="px-6"
              >
                {isTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enter 키로 전송 • Shift + Enter로 줄바꿈
            </p>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
}