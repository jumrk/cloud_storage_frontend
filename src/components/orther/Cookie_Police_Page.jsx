"use client";
import { useRef } from "react";

const sections = [
  { id: "intro", label: "1. Giới thiệu" },
  { id: "what", label: "2. Cookie là gì?" },
  { id: "types", label: "3. Loại cookie chúng tôi sử dụng" },
  { id: "purpose", label: "4. Mục đích sử dụng cookie" },
  { id: "manage", label: "5. Quản lý & tắt cookie" },
  { id: "rights", label: "6. Quyền của người dùng" },
  { id: "changes", label: "7. Thay đổi chính sách" },
  { id: "contact", label: "8. Liên hệ" },
];

export default function CookiePolicy() {
  const refs = useRef({});
  const scrollToSection = (id) => {
    refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full min-h-screen bg-white pb-16">
      <div className="max-w-5xl mx-auto px-4 pt-10 flex flex-col md:flex-row gap-10">
        {/* Nội dung chính */}
        <main className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
            Chính Sách Cookie
          </h1>
          <div className="text-gray-500 text-sm mb-6">
            Cập nhật lần cuối: 22/07/2025
          </div>
          <div className="space-y-10 text-gray-800 text-base leading-relaxed">
            <section ref={(el) => (refs.current["intro"] = el)} id="intro">
              <h2 className="text-xl font-semibold mb-2">1. Giới thiệu</h2>
              <p>
                Trang này giải thích cách D2MBox sử dụng cookie và các công nghệ
                tương tự để nhận diện bạn khi truy cập website/dịch vụ của chúng
                tôi. Việc sử dụng dịch vụ đồng nghĩa với việc bạn đồng ý với
                chính sách cookie này.
              </p>
            </section>
            <section ref={(el) => (refs.current["what"] = el)} id="what">
              <h2 className="text-xl font-semibold mb-2">2. Cookie là gì?</h2>
              <p>
                Cookie là các tệp nhỏ được lưu trữ trên thiết bị của bạn khi bạn
                truy cập website. Cookie giúp website ghi nhớ thông tin về bạn
                (như đăng nhập, tùy chọn, lịch sử truy cập) để cải thiện trải
                nghiệm sử dụng.
              </p>
            </section>
            <section ref={(el) => (refs.current["types"] = el)} id="types">
              <h2 className="text-xl font-semibold mb-2">
                3. Loại cookie chúng tôi sử dụng
              </h2>
              <ul className="list-disc pl-6">
                <li>
                  <b>Cookie cần thiết:</b> Giúp website hoạt động cơ bản (đăng
                  nhập, bảo mật, điều hướng...)
                </li>
                <li>
                  <b>Cookie chức năng:</b> Ghi nhớ tùy chọn cá nhân hóa (ngôn
                  ngữ, giao diện...)
                </li>
                <li>
                  <b>Cookie phân tích:</b> Thu thập dữ liệu ẩn danh về hành vi
                  người dùng để cải thiện dịch vụ.
                </li>
                <li>
                  <b>Cookie quảng cáo:</b> Hỗ trợ hiển thị quảng cáo phù hợp
                  (nếu có).
                </li>
              </ul>
            </section>
            <section ref={(el) => (refs.current["purpose"] = el)} id="purpose">
              <h2 className="text-xl font-semibold mb-2">
                4. Mục đích sử dụng cookie
              </h2>
              <ul className="list-disc pl-6">
                <li>
                  Ghi nhớ thông tin đăng nhập, tránh phải nhập lại mỗi lần truy
                  cập.
                </li>
                <li>Lưu trữ tùy chọn cá nhân hóa giao diện, ngôn ngữ.</li>
                <li>
                  Phân tích, đo lường hiệu quả website, phát hiện lỗi, tối ưu
                  trải nghiệm.
                </li>
                <li>Hỗ trợ bảo mật, phát hiện truy cập bất thường.</li>
                <li>Hiển thị quảng cáo phù hợp với sở thích (nếu có).</li>
              </ul>
            </section>
            <section ref={(el) => (refs.current["manage"] = el)} id="manage">
              <h2 className="text-xl font-semibold mb-2">
                5. Quản lý & tắt cookie
              </h2>
              <p>
                Bạn có thể tùy chỉnh trình duyệt để từ chối hoặc xóa cookie bất
                cứ lúc nào. Tuy nhiên, việc tắt cookie có thể ảnh hưởng đến một
                số tính năng của website (ví dụ: không tự động đăng nhập, mất
                tùy chọn cá nhân hóa).
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>
                  Hướng dẫn quản lý cookie thường có trong phần Cài đặt
                  (Settings) của trình duyệt.
                </li>
                <li>
                  Bạn cũng có thể sử dụng chế độ ẩn danh (Incognito) để hạn chế
                  lưu cookie.
                </li>
              </ul>
            </section>
            <section ref={(el) => (refs.current["rights"] = el)} id="rights">
              <h2 className="text-xl font-semibold mb-2">
                6. Quyền của người dùng
              </h2>
              <ul className="list-disc pl-6">
                <li>
                  Quyền được biết, kiểm soát, xóa cookie trên thiết bị của mình.
                </li>
                <li>
                  Quyền từ chối cookie không cần thiết cho hoạt động cơ bản của
                  website.
                </li>
                <li>Quyền liên hệ với D2MBox để hỏi về việc sử dụng cookie.</li>
              </ul>
            </section>
            <section ref={(el) => (refs.current["changes"] = el)} id="changes">
              <h2 className="text-xl font-semibold mb-2">
                7. Thay đổi chính sách
              </h2>
              <p>
                Chính sách cookie có thể được cập nhật để phù hợp với quy định
                pháp luật hoặc nhu cầu vận hành. Mọi thay đổi sẽ được thông báo
                trên website.
              </p>
            </section>
            <section ref={(el) => (refs.current["contact"] = el)} id="contact">
              <h2 className="text-xl font-semibold mb-2">8. Liên hệ</h2>
              <ul className="list-disc pl-6 mt-2">
                <li>
                  Email:{" "}
                  <a
                    href="mailto:contact-d2m@dammeviet.vn"
                    className="text-[#189ff2] underline"
                  >
                    contact-d2m@dammeviet.vn
                  </a>
                </li>
                <li>
                  Hotline:{" "}
                  <a
                    href="tel:+84911930807"
                    className="text-[#189ff2] underline"
                  >
                    +84 911 930 807
                  </a>
                </li>
                <li>Địa chỉ: 205 Bình Đức 5, Phường Bình Đức, An Giang</li>
              </ul>
              <p className="mt-2">
                Chúng tôi sẽ phản hồi trong vòng 3 ngày làm việc.
              </p>
            </section>
          </div>
        </main>
        {/* Mục lục bên phải */}
        <aside className="hidden md:block w-64 flex-shrink-0 pt-2">
          <div className="sticky top-24 bg-white rounded-xl border border-gray-100 shadow p-4">
            <div className="font-bold text-gray-700 mb-2 text-base">
              Mục lục
            </div>
            <ul className="space-y-2 text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    className="text-left text-[#189ff2] hover:underline focus:outline-none"
                    onClick={() => scrollToSection(s.id)}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
