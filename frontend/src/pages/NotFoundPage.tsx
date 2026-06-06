import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]" style={{ background: '#F4F6F9' }}>
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-gray-400 mt-4 mb-8">页面不存在</p>
      <Link to="/" className="px-6 py-2 bg-[#3D6A94] text-white rounded-lg hover:opacity-90 transition-opacity">
        返回首页
      </Link>
    </div>
  );
}
