import React from "react";

function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-gray-800 to-gray-900 text-white py-10 mt-12 overflow-hidden">
      <div className="max-w-screen-xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h3 className="text-2xl font-bold mb-4">Liên Hệ Với Chúng Tôi</h3>
            <p className="text-gray-300">
              Địa chỉ: 205 Bình Đức 5, Phường Bình Đức, An Giang
            </p>
            <p className="text-gray-300">Email: contact-d2m@dammeviet.vn</p>
            <p className="text-gray-300">Điện thoại: +84 911 930 807</p>
            <p className="text-gray-300">
              Fanpage:{" "}
              <a
                href="https://www.facebook.com/dichthuatdammeviet"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                facebook.com/dichthuatdammeviet
              </a>
            </p>
            <p className="text-gray-300">Whatsapp/wechat: +84 911 930 807</p>
            <div className="mt-4 flex justify-center md:justify-start gap-4">
              <a href="#" className="text-gray-300 hover:text-white">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5.53 4.5 10.02 10 10.02s10-4.49 10-10.02c0-5.53-4.5-10.02-10-10.02zm0 18.63c-4.97 0-9-4.03-9-9.01s4.03-9.01 9-9.01 9 4.03 9 9.01-4.03 9.01-9 9.01z" />
                  <path d="M15.94 6.06c-1.14-1.14-2.98-1.14-4.12 0l-2.82 2.82c-1.14 1.14-1.14 2.98 0 4.12l2.82 2.82c.56.56 1.32.88 2.06.88s1.5-.32 2.06-.88l2.82-2.82c1.14-1.14 1.14-2.98 0-4.12l-2.82-2.82zm-2.82 7.24c-.38.38-.88.59-1.41.59s-1.03-.21-1.41-.59l-2.82-2.82c-.78-.78-.78-2.04 0-2.82l2.82-2.82c.78-.78 2.04-.78 2.82 0l2.82 2.82c.78.78.78 2.04 0 2.82l-2.82 2.82z" />
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.618 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.069-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="w-full md:w-1/2 text-center md:text-right">
            <h3 className="text-2xl font-bold mb-4">Liên Kết Nhanh</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Trang chủ
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Dịch vụ
                </a>
              </li>
              <li>
                <a
                  href="/privacy_policy"
                  className="text-gray-300 hover:text-white"
                >
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a
                  href="/terms_of_use"
                  className="text-gray-300 hover:text-white"
                >
                  Điều khoản dịch vụ
                </a>
              </li>
            </ul>
            <p className="mt-6 text-gray-400 text-sm">
              © 2025 xAI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
      {/* Hiệu ứng cong trên cùng */}
      <div className="absolute top-0 left-0 w-full h-16 bg-gray-100 -z-10 rounded-b-full"></div>
    </footer>
  );
}

export default Footer;
