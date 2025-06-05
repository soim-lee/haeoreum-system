import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Target, 
  FileText, 
  Briefcase, 
  TrendingUp, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import type { Project, Resume, ProjectMatch } from "../../../shared/schema";

export default function MatchingSection() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedResume, setSelectedResume] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: resumes = [] } = useQuery({
    queryKey: ["/api/resumes"],
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["/api/project-matches"],
  });

  const generateMatchMutation = useMutation({
    mutationFn: () => apiRequest("/api/generate-matches", {
      method: "POST",
      body: JSON.stringify({
        projectId: selectedProject,
        resumeId: selectedResume
      }),
    }),
    onSuccess: () => {
      toast({
        title: "매칭 분석 완료!",
        description: "AI가 프로젝트와 이력서의 매칭도를 분석했습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/project-matches"] });
    },
    onError: () => {
      toast({
        title: "분석 실패",
        description: "매칭 분석 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateMatch = () => {
    if (!selectedProject || !selectedResume) {
      toast({
        title: "선택 필요",
        description: "프로젝트와 이력서를 모두 선택해주세요.",
        variant: "destructive",
      });
      return;
    }
    generateMatchMutation.mutate();
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getMatchIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <section id="matching" className="section-padding bg-white">
      <div className="container-padding">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">매칭 결과</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI가 분석한 프로젝트와 이력서의 매칭 확률을 확인하세요
          </p>
        </div>

        {/* 매칭 생성 섹션 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl mb-12">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            새로운 매칭 분석
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                프로젝트 선택
              </label>
              <select
                value={selectedProject || ""}
                onChange={(e) => setSelectedProject(Number(e.target.value) || null)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">프로젝트를 선택하세요</option>
                {projects.map((project: Project) => (
                  <option key={project.id} value={project.id}>
                    {project.title} ({project.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이력서 선택
              </label>
              <select
                value={selectedResume || ""}
                onChange={(e) => setSelectedResume(Number(e.target.value) || null)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">이력서를 선택하세요</option>
                {resumes.map((resume: Resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.fileName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={handleGenerateMatch}
              disabled={generateMatchMutation.isPending || !selectedProject || !selectedResume}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              {generateMatchMutation.isPending ? "분석 중..." : "매칭 분석 시작"}
            </Button>
          </div>
        </div>

        {/* 매칭 결과 목록 */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">매칭 분석 결과</h3>
          
          {matches.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                매칭 결과가 없습니다
              </h4>
              <p className="text-gray-600">
                프로젝트와 이력서를 선택하여 매칭 분석을 시작해보세요
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {matches.map((match: ProjectMatch) => {
                const project = projects.find((p: Project) => p.id === match.projectId);
                const resume = resumes.find((r: Resume) => r.id === match.resumeId);
                const score = Number(match.matchScore);

                return (
                  <div key={match.id} className="bg-white border rounded-xl p-6 shadow-lg">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Briefcase className="h-5 w-5 text-blue-600" />
                          <h4 className="text-xl font-semibold text-gray-900">
                            {project?.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                          <FileText className="h-5 w-5 text-green-600" />
                          <span className="text-gray-700">{resume?.fileName}</span>
                        </div>
                      </div>
                      
                      <div className={`text-center p-4 rounded-lg ${getMatchColor(score)}`}>
                        <div className="flex items-center justify-center mb-1">
                          {getMatchIcon(score)}
                        </div>
                        <div className="text-2xl font-bold">{score}%</div>
                        <div className="text-sm">매칭도</div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">매칭 점수</span>
                        <span className="text-sm text-gray-600">{score}/100</span>
                      </div>
                      <Progress value={score} className="h-3" />
                    </div>

                    {match.skillMatch && match.skillMatch.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          일치하는 스킬:
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {match.skillMatch.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {match.analysis && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          AI 분석 결과:
                        </h5>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {match.analysis}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 text-xs text-gray-500 text-right">
                      분석 일시: {new Date(match.createdAt!).toLocaleString('ko-KR')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}