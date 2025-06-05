import { Eye, Target, Building } from "lucide-react";

export default function CompanySection() {
  return (
    <section id="company" className="section-padding bg-white">
      <div className="container-padding">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">About Our Company</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            With over two decades of experience, we are committed to delivering innovative solutions that drive business success.
          </p>
        </div>

        {/* 회사 이미지 섹션 */}
        <div className="mb-12">
          <div className="rounded-xl shadow-lg w-full h-64 bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Modern Workplace</h3>
              <p className="text-gray-600">Innovation-driven environment</p>
            </div>
          </div>
        </div>

        {/* 비전/미션을 가로로 배치 */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-50 p-6 rounded-xl">
            <div className="flex items-center mb-4">
              <Eye className="text-accent h-8 w-8 mr-4" />
              <h3 className="text-2xl font-semibold text-gray-900">Our Vision</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              To be the global leader in innovative technology solutions, empowering businesses to achieve unprecedented growth and efficiency.
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl">
            <div className="flex items-center mb-4">
              <Target className="text-accent h-8 w-8 mr-4" />
              <h3 className="text-2xl font-semibold text-gray-900">Our Mission</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              We deliver cutting-edge solutions with unwavering commitment to quality, innovation, and customer success, building lasting partnerships.
            </p>
          </div>
        </div>

        {/* 통계를 가로로 배치 */}
        <div className="grid grid-cols-3 gap-8">
          <div className="text-center bg-white p-6 rounded-xl shadow-lg">
            <div className="text-4xl font-bold text-accent mb-2">20+</div>
            <div className="text-lg text-gray-600">Years Experience</div>
          </div>
          <div className="text-center bg-white p-6 rounded-xl shadow-lg">
            <div className="text-4xl font-bold text-accent mb-2">500+</div>
            <div className="text-lg text-gray-600">Happy Clients</div>
          </div>
          <div className="text-center bg-white p-6 rounded-xl shadow-lg">
            <div className="text-4xl font-bold text-accent mb-2">1000+</div>
            <div className="text-lg text-gray-600">Projects Completed</div>
          </div>
        </div>
      </div>
    </section>
  );
}
