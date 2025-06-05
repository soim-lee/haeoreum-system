import { Quote, Star, Building } from "lucide-react";

const testimonials = [
  {
    content: "TechCorp transformed our entire IT infrastructure. Their expertise and dedication to our success was evident throughout the entire process.",
    author: {
      initials: "JD",
      name: "John Doe",
      position: "CTO, Fortune 500 Company"
    }
  },
  {
    content: "Outstanding service and innovative solutions. They consistently deliver beyond expectations and have become a trusted partner.",
    author: {
      initials: "SM",
      name: "Sarah Miller",
      position: "VP Technology, Healthcare Corp"
    }
  },
  {
    content: "Their cloud migration strategy saved us 40% in operational costs while improving our system performance significantly.",
    author: {
      initials: "RJ",
      name: "Robert Johnson",
      position: "IT Director, Financial Services"
    }
  }
];

export default function CustomersSection() {
  return (
    <section id="customers" className="section-padding bg-gray-50">
      <div className="container-padding">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Trusted by Industry Leaders</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're proud to partner with forward-thinking organizations across various industries.
          </p>
        </div>

        {/* Customer Logos */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-16">
          {['TechStart', 'InnovateCorp', 'GlobalTech', 'FutureSoft', 'DataFlow', 'CloudFirst'].map((companyName, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Building className="h-6 w-6 text-gray-500" />
                </div>
                <div className="text-sm font-semibold text-gray-600">{companyName}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <Quote className="text-accent h-6 w-6 mr-2" />
                <div className="flex text-yellow-400">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={starIndex} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white font-semibold mr-4">
                  <span>{testimonial.author.initials}</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.author.position}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
