import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccessKey } from "@/hooks/useAccessKey";
import Home from "@/pages/home";
import ProjectsPage from "@/pages/projects";
import ResumesPage from "@/pages/resumes";
import ApplicationsPage from "@/pages/applications";
import ContractsPage from "@/pages/contracts";
import CalendarPage from "@/pages/calendar";
import FormsPage from "@/pages/forms";
import DashboardPage from "@/pages/dashboard";
import AIAgentPage from "@/pages/ai-agent";
import BlacklistPage from "@/pages/blacklist";
import AccessPage from "@/pages/access";
import { Toaster } from "@/components/ui/toaster";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function Router() {
  const { hasAccess, isLoading } = useAccessKey();

  // 로딩 중인 경우
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <Switch>
      {!hasAccess ? (
        <>
          <Route path="/" component={AccessPage} />
          <Route component={AccessPage} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/projects" component={ProjectsPage} />
          <Route path="/resumes" component={ResumesPage} />
          <Route path="/applications" component={ApplicationsPage} />
          <Route path="/contracts" component={ContractsPage} />
          <Route path="/calendar" component={CalendarPage} />
          <Route path="/forms" component={FormsPage} />
          <Route path="/blacklist" component={BlacklistPage} />
          <Route path="/ai-agent" component={AIAgentPage} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;