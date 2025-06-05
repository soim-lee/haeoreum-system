import { Cloud, Smartphone, Shield, TrendingUp, Bot, Settings, ArrowRight } from "lucide-react";

const businessAreas = [
  {
    icon: Cloud,
    title: "Cloud Solutions",
    description: "Scalable cloud infrastructure and migration services to modernize your business operations."
  },
  {
    icon: Smartphone,
    title: "Digital Transformation",
    description: "End-to-end digital transformation services to optimize processes and enhance productivity."
  },
  {
    icon: Shield,
    title: "Cybersecurity",
    description: "Comprehensive security solutions to protect your business from evolving cyber threats."
  },
  {
    icon: TrendingUp,
    title: "Data Analytics",
    description: "Advanced analytics and business intelligence solutions for data-driven decision making."
  },
  {
    icon: Bot,
    title: "AI & Machine Learning",
    description: "Intelligent automation and AI-powered solutions to revolutionize business processes."
  },
  {
    icon: Settings,
    title: "IT Consulting",
    description: "Strategic technology consulting to align IT infrastructure with business objectives."
  }
];

export default function BusinessSection() {
  return (
    <section id="business" className="section-padding bg-gray-50">
      <div className="container-padding">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Business Areas</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive solutions across multiple domains to meet diverse business needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {businessAreas.map((area, index) => {
            const IconComponent = area.icon;
            return (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg card-hover">
                <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center mb-6">
                  <IconComponent className="text-white h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{area.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {area.description}
                </p>
                <button className="text-accent font-medium hover:text-primary transition-colors duration-200 flex items-center">
                  Learn More <ArrowRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
