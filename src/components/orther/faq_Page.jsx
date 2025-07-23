"use client";
import React, { useState, useRef } from "react";

const faqs = [
  {
    q: "D2MBox là gì?",
    a: "D2MBox là nền tảng lưu trữ đám mây hiện đại, giúp bạn lưu trữ, đồng bộ, chia sẻ dữ liệu cá nhân và doanh nghiệp một cách an toàn, bảo mật và tiện lợi. Bạn có thể truy cập dữ liệu mọi lúc, mọi nơi, trên mọi thiết bị chỉ với một tài khoản duy nhất. D2MBox phù hợp cho cả cá nhân, nhóm làm việc và doanh nghiệp muốn tối ưu hóa quản lý dữ liệu số.",
  },
  {
    q: "Dữ liệu của tôi có được bảo mật không?",
    a: "Chúng tôi áp dụng nhiều lớp bảo mật: mã hóa dữ liệu khi truyền và lưu trữ, kiểm soát truy cập nghiêm ngặt, xác thực đa yếu tố (2FA), kiểm thử bảo mật định kỳ. Chỉ bạn và những người bạn phân quyền mới có thể truy cập dữ liệu của bạn. D2MBox cam kết không chia sẻ dữ liệu cá nhân cho bên thứ ba khi chưa có sự đồng ý của bạn.",
  },
  {
    q: "Tôi có thể truy cập dữ liệu từ thiết bị nào?",
    a: "Bạn có thể truy cập D2MBox từ máy tính, điện thoại, tablet thông qua website hoặc ứng dụng (nếu có). Dữ liệu được đồng bộ hóa tức thì trên mọi thiết bị. Ví dụ: bạn tải file lên từ điện thoại, có thể mở ngay trên laptop mà không cần thao tác thêm.",
  },
  {
    q: "Làm sao để lấy lại mật khẩu khi quên?",
    a: "Bạn chỉ cần nhấn vào 'Quên mật khẩu' trên trang đăng nhập, nhập email đăng ký. Hệ thống sẽ gửi mã xác thực về email, bạn nhập mã này và đặt lại mật khẩu mới. Nếu gặp khó khăn, hãy liên hệ bộ phận hỗ trợ để được trợ giúp nhanh chóng.",
  },
  {
    q: "D2MBox có hỗ trợ chia sẻ file cho người ngoài hệ thống không?",
    a: "Có. Bạn có thể tạo link chia sẻ file/thư mục cho bất kỳ ai, kể cả người không có tài khoản D2MBox. Bạn có thể đặt mật khẩu, thời gian hết hạn, hoặc chỉ cho phép xem mà không tải về để kiểm soát quyền truy cập.",
  },
  {
    q: "Tôi có thể nâng cấp hoặc hạ cấp gói dịch vụ không?",
    a: "Bạn có thể nâng/hạ cấp gói bất cứ lúc nào trong phần quản lý tài khoản. Số dư hoặc thời hạn sẽ được tính toán tự động theo chính sách của D2MBox. Nếu cần tư vấn về gói phù hợp, hãy liên hệ bộ phận hỗ trợ để được giải đáp chi tiết.",
  },
  {
    q: "Thanh toán trên D2MBox có an toàn không?",
    a: "Chúng tôi sử dụng các cổng thanh toán uy tín, mã hóa giao dịch, không lưu trữ thông tin thẻ của bạn trên hệ thống. Mọi giao dịch đều được xác nhận qua email hoặc SMS để đảm bảo an toàn tuyệt đối cho người dùng.",
  },
  {
    q: "Tôi cần hỗ trợ thì liên hệ như thế nào?",
    a: "Bạn có thể liên hệ qua email contact-d2m@dammeviet.vn, hotline +84 911 930 807 hoặc gửi yêu cầu hỗ trợ trực tiếp trên website. Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giải đáp mọi thắc mắc và xử lý sự cố 24/7.",
  },
  {
    q: "Dữ liệu bị xóa có khôi phục lại được không?",
    a: "Bạn có thể khôi phục file đã xóa trong thời gian lưu trữ tạm thời (Recycle Bin, thường 15-30 ngày). Sau thời gian này, dữ liệu sẽ bị xóa vĩnh viễn khỏi hệ thống và không thể khôi phục. Hãy kiểm tra kỹ trước khi xóa dữ liệu quan trọng.",
  },
  {
    q: "Tôi có thể sử dụng D2MBox cho doanh nghiệp không?",
    a: "D2MBox cung cấp các gói dịch vụ và tính năng chuyên biệt cho doanh nghiệp: quản lý nhóm, phân quyền chi tiết, báo cáo sử dụng, tích hợp API, hỗ trợ triển khai riêng. Liên hệ chúng tôi để nhận tư vấn giải pháp phù hợp nhất cho doanh nghiệp của bạn.",
  },
];

function Accordion({ q, a, open, onClick, contentId }) {
  const contentRef = useRef(null);
  return (
    <div className="border-b last:border-b-0">
      <button
        className={`w-full text-left py-4 px-2 flex justify-between items-center focus:outline-none transition-colors hover:bg-[#f3f6fa] rounded-lg ${
          open ? "bg-[#f3f6fa]" : "bg-transparent"
        }`}
        onClick={onClick}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <span className="font-medium text-gray-800 text-base md:text-lg">
          {q}
        </span>
        <span
          className={`ml-2 transition-transform duration-300 ${
            open ? "rotate-90" : "rotate-0"
          }`}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
            <path
              d="M7 8l3 3 3-3"
              stroke="#189ff2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <div
        id={contentId}
        ref={contentRef}
        style={{
          maxHeight: open ? contentRef.current?.scrollHeight : 0,
          opacity: open ? 1 : 0,
          transition: "max-height 0.4s cubic-bezier(.4,0,.2,1), opacity 0.3s",
        }}
        className="overflow-hidden bg-[#f8fafc] rounded-b-lg"
        aria-hidden={!open}
      >
        <div className="px-4 pb-4 pt-1 text-gray-600 text-base">{a}</div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div className="w-full min-h-screen bg-[#f7f8fa] pb-16">
      <section className="max-w-2xl mx-auto px-4 pt-12 pb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#189ff2] mb-6 text-center">
          Câu hỏi thường gặp
        </h1>
        <div className="rounded-2xl shadow bg-white divide-y border border-gray-100">
          {faqs.map((item, idx) => (
            <Accordion
              key={item.q}
              q={item.q}
              a={item.a}
              open={openIdx === idx}
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              contentId={`faq-content-${idx}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
