import { Building } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-700 text-white py-8">
      <div className="container-padding">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4 flex items-center justify-center">
            <Building className="mr-2 h-6 w-6" />
            <span>해오름인포텍</span>
          </div>
          <p className="text-gray-300 mb-6">
            AI가 만드는 미래, 더 스마트한 업무 환경으로 비즈니스 혁신을 이끌어 갑니다
          </p>
        </div>

        <div className="border-t border-gray-600 pt-6 text-center">
          <p className="text-gray-300 text-sm">
            © 2025 해오름인포텍. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
