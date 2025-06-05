import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, CheckSquare, BarChart } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Real-time messaging and file sharing"
  },
  {
    icon: Calendar,
    title: "Schedule Management", 
    description: "Integrated calendar and meeting rooms"
  },
  {
    icon: CheckSquare,
    title: "Project Tracking",
    description: "Monitor progress and deadlines"
  },
  {
    icon: BarChart,
    title: "Analytics Dashboard",
    description: "Performance metrics and insights"
  }
];

export default function GroupwareSection() {
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  const [isLogging, setIsLogging] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);

    try {
      // Here you would typically authenticate with your backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Login Successful!",
        description: "Redirecting to your dashboard...",
      });
      
      // In a real app, you would redirect to the groupware dashboard
      setLoginData({ email: "", password: "" });
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLogging(false);
    }
  };

  const handleForgotPassword = () => {
    toast({
      title: "Password Reset",
      description: "Password reset link will be sent to your email.",
    });
  };

  return (
    <section id="groupware" className="section-padding gradient-bg text-white">
      <div className="container-padding">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-6">Employee Groupware Portal</h2>
          <p className="text-xl max-w-3xl mx-auto text-blue-100">
            Access your workspace, collaborate with teams, and manage projects efficiently.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-blue-100 text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-4">Employee Login</h3>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="sr-only">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={loginData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password" className="sr-only">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isLogging}
                className="w-full bg-white text-primary py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
              >
                {isLogging ? "Logging in..." : "Access Groupware"}
              </Button>
            </form>
            <p className="text-sm text-blue-100 mt-4">
              <button 
                onClick={handleForgotPassword}
                className="hover:text-white transition-colors duration-200 underline"
              >
                Forgot Password?
              </button>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
