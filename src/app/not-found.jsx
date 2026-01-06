"use client";
import { useRouter } from "next/navigation";
import { FiHome, FiArrowLeft, FiSearch } from "react-icons/fi";
import Link from "next/link";
export default function NotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl md:text-[12rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 leading-none">
            404
          </h1>
        </div>
        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trang không tìm thấy
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
          </p>
          <p className="text-sm text-gray-500">
            Có thể URL đã thay đổi hoặc trang đã bị xóa.
          </p>
        </div>
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FiArrowLeft className="text-lg" /> Quay lại
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-md"
          >
            <FiHome className="text-lg" /> Về trang chủ
          </Link>
        </div>
        {/* Search Suggestion */}
        <div className="mt-12 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <FiSearch className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">
              Bạn có thể thử:
            </h3>
          </div>
          <ul className="text-left text-sm text-gray-600 space-y-2">
            <li>• Kiểm tra lại URL đã nhập đúng chưa</li>
            <li>• Sử dụng thanh tìm kiếm để tìm nội dung bạn cần</li>
            <li>• Quay về trang chủ và điều hướng từ menu</li>
          </ul>
        </div>
        {/* Logo/Brand */}
        <div className="mt-12">
          <Link href="/" className="inline-block">
            <img
              src="/images/Logo_2.png"
              alt="Logo"
              className="h-12 mx-auto opacity-60 hover:opacity-100 transition-opacity"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
