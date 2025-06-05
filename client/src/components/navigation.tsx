import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  Building, 
  BarChart3, 
  FolderOpen, 
  FileText, 
  FileCheck, 
  Calendar, 
  Files, 
  Bot,
  Shield,
  X 
} from "lucide-react";
import { Link, useLocation } from "wouter";

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: BarChart3 },
  { href: "/projects", label: "프로젝트", icon: FolderOpen },
  { href: "/resumes", label: "이력서", icon: FileText },
  { href: "/contracts", label: "계약현황", icon: FileCheck },
  { href: "/calendar", label: "캘린더", icon: Calendar },
  { href: "/forms", label: "양식관리", icon: Files },
  { href: "/blacklist", label: "블랙리스트", icon: Shield },
  { href: "/ai-agent", label: "AI 에이전트", icon: Bot },
];

export default function Navigation() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location] = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Top Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center px-4 fixed top-0 left-0 right-0 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="mr-4"
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        <Link href="/dashboard">
          <div className="text-xl font-bold text-primary flex items-center cursor-pointer hover:text-blue-700 transition-colors duration-200">
            <Building className="mr-2 h-7 w-7" />
            <span>Sunrise AI</span>
          </div>
        </Link>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 z-50 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="text-lg font-bold text-primary flex items-center">
            <Building className="mr-2 h-6 w-6" />
            <span>Sunrise AI</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6">
          <div className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content Spacer */}
      <div className="pt-16" />
    </>
  );
}
