import { Heart, Clock, GraduationCap, PiggyBank, Gamepad2, Plane } from "lucide-react";

const benefits = [
  {
    icon: Heart,
    title: "Comprehensive Health Insurance",
    description: "Full medical, dental, and vision coverage for employees and their families."
  },
  {
    icon: Clock,
    title: "Flexible Work Arrangements",
    description: "Remote work options and flexible hours to maintain work-life balance."
  },
  {
    icon: GraduationCap,
    title: "Professional Development",
    description: "Continuous learning opportunities, certifications, and career advancement programs."
  },
  {
    icon: PiggyBank,
    title: "Retirement Planning",
    description: "401(k) matching and comprehensive retirement benefits package."
  },
  {
    icon: Gamepad2,
    title: "Recreation & Wellness",
    description: "On-site gym, wellness programs, and recreational activities for team building."
  },
  {
    icon: Plane,
    title: "Generous PTO",
    description: "Competitive vacation time, sick leave, and paid holidays for rest and rejuvenation."
  }
];

export default function WelfareSection() {
  return (
    <section id="welfare" className="section-padding bg-white">
      <div className="container-padding">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Employee Welfare & Benefits</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We believe in creating an environment where our team members thrive both professionally and personally.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            {/* To use your own image, replace this div with:
                <img src="/src/assets/team-collaboration.jpg" alt="Happy diverse team collaborating in modern office" className="rounded-xl shadow-lg w-full h-96 object-cover" />
            */}
            <div className="rounded-xl shadow-lg w-full h-96 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Team Wellness</h3>
                <p className="text-gray-600">Supporting our people's success</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconComponent className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
