import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, X, MapPin, Clock, Star, Briefcase } from "lucide-react";
import type { Project, InsertProject } from "../../../shared/schema";

export default function ProjectsSection() {
  const [formData, setFormData] = useState<InsertProject>({
    title: "",
    location: "",
    duration: "",
    grade: "",
    tasks: "",
    skills: [],
    description: ""
  });
  const [currentSkill, setCurrentSkill] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: InsertProject) => apiRequest("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({
        title: "프로젝트 등록 완료!",
        description: "새로운 프로젝트가 성공적으로 등록되었습니다.",
      });
      setFormData({
        title: "",
        location: "",
        duration: "",
        grade: "",
        tasks: "",
        skills: [],
        description: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: () => {
      toast({
        title: "등록 실패",
        description: "프로젝트 등록 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }));
      setCurrentSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.skills.length === 0) {
      toast({
        title: "스킬을 추가해주세요",
        description: "최소 1개 이상의 스킬을 입력해야 합니다.",
        variant: "destructive",
      });
      return;
    }
    createProjectMutation.mutate(formData);
  };

  return (
    <section id="projects" className="section-padding bg-white">
      <div className="container-padding">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">프로젝트 등록</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            새로운 프로젝트 정보를 등록하고 최적의 인재를 찾아보세요
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* 프로젝트 등록 폼 */}
          <div className="bg-gray-50 p-8 rounded-xl">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">새 프로젝트 등록</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">프로젝트 제목</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="예: React 웹 애플리케이션 개발"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">위치</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="예: 서울 강남구"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration">기간</Label>
                  <Input
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="예: 3개월"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="grade">등급</Label>
                <Input
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  placeholder="예: 시니어, 미들, 주니어"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tasks">업무 내용</Label>
                <Textarea
                  id="tasks"
                  name="tasks"
                  value={formData.tasks}
                  onChange={handleInputChange}
                  placeholder="담당하게 될 주요 업무를 설명해주세요"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label>필요 스킬</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    placeholder="스킬을 입력하세요"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" onClick={addSkill} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="description">추가 설명</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="프로젝트에 대한 추가 정보"
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                disabled={createProjectMutation.isPending}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
              >
                {createProjectMutation.isPending ? "등록 중..." : "프로젝트 등록"}
              </Button>
            </form>
          </div>

          {/* 등록된 프로젝트 목록 */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">등록된 프로젝트</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  등록된 프로젝트가 없습니다
                </div>
              ) : (
                projects.map((project: Project) => (
                  <div key={project.id} className="bg-white p-6 rounded-lg shadow-md border">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h4>
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {project.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {project.duration}
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        {project.grade}
                      </div>
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-1" />
                        프로젝트
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{project.tasks}</p>
                    <div className="flex flex-wrap gap-1">
                      {project.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}