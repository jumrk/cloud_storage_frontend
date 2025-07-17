import Footer from "@/components/ui/footer";
import Header from "@/components/ui/Header";
import Hero from "@/components/Hero";
import PlanList from "@/components/PlanList";
import ScrollReveal from "@/components/ui/ScrollReveal";
import React from "react";
export const metadata = {
  title: "Trang chủ",
};
export default function Home() {
  const features = [
    {
      icon: <span className="text-4xl mb-2">🔒</span>,
      title: "Bảo mật tuyệt đối",
      description:
        "Dữ liệu được mã hóa và bảo vệ nhiều lớp, an toàn tuyệt đối.",
    },
    {
      icon: <span className="text-4xl mb-2">⚡</span>,
      title: "Tốc độ siêu nhanh",
      description:
        "Tải lên và truy cập file cực nhanh, không giới hạn băng thông.",
    },
    {
      icon: <span className="text-4xl mb-2">👤</span>,
      title: "Phi tập trung & xác minh thủ công",
      description: "Tài khoản xác minh thủ công, không mở đăng ký công khai.",
    },
    {
      icon: <span className="text-4xl mb-2">💾</span>,
      title: "Dung lượng lớn",
      description: "Lưu trữ lên đến 1PB, đáp ứng mọi nhu cầu doanh nghiệp.",
    },
    {
      icon: <span className="text-4xl mb-2">👥</span>,
      title: "Quản lý user thông minh",
      description:
        "Phân quyền theo nhóm, mỗi team như một hệ thống riêng biệt.",
    },
    {
      icon: <span className="text-4xl mb-2">💸</span>,
      title: "Giá siêu rẻ",
      description:
        "Dung lượng khủng, chi phí cực thấp cho cả cá nhân & doanh nghiệp.",
    },
  ];

  return (
    <>
      <Header />
      <main className="w-full pt-20">
        <div className="max-w-screen-xl mx-auto p-4">
          <Hero />
          <div className="w-full mt-20 flex flex-col justify-center items-center">
            {/* Tính năng */}
            <ScrollReveal>
              <h2 className="text-primary font-bold text-center text-3xl">
                TÍNH NĂNG NỔI BẬT
              </h2>
            </ScrollReveal>
            <div className="w-full mt-6 flex gap-6 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-8 md:overflow-visible md:pb-0 scrollbar-hide">
              {features.map((feature, idx) => (
                <ScrollReveal direction="up" key={idx}>
                  <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center h-full border border-[#e0f7fa] min-w-[260px] md:min-w-0">
                    {feature.icon}
                    <h3 className="text-[#02599c] font-bold text-lg md:text-xl mt-2 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base">
                      {feature.description}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Mô tả */}
            <div className="mt-8 space-y-8 md:space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
                <div className="w-full">
                  <ScrollReveal>
                    <img
                      className="w-full h-72 object-contain rounded-lg"
                      src="/images/feature_b1.png"
                      alt="Đồng bộ và lưu trữ thông minh"
                      loading="lazy"
                    />
                  </ScrollReveal>
                </div>
                <ScrollReveal direction="down">
                  <div className="flex flex-col justify-center text-center md:text-left">
                    <p className="text-[#01579B] font-bold text-sm md:text-lg uppercase tracking-wide">
                      Đồng bộ & lưu trữ thông minh
                    </p>
                    <h2 className="text-primary font-bold text-2xl md:text-4xl mt-2">
                      Tải lên file dễ dàng
                    </h2>
                    <p className="text-primary/80 text-sm md:text-lg mt-3 max-w-md mx-auto md:mx-0">
                      Chỉ với vài cú nhấp, bạn có thể tải lên bất kỳ tệp nào từ
                      thiết bị của mình và lưu trữ trực tiếp trên nền tảng.
                    </p>
                  </div>
                </ScrollReveal>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
                <div className="w-full md:order-2">
                  <ScrollReveal>
                    <img
                      className="w-full h-72 object-contain rounded-lg"
                      src="/images/feature_b2.png"
                      alt="Chia sẻ tệp nhanh chóng"
                      loading="lazy"
                    />
                  </ScrollReveal>
                </div>
                <ScrollReveal direction="down">
                  <div className="flex flex-col justify-center text-center md:text-left md:order-1">
                    <p className="text-[#01579B] font-bold text-sm md:text-lg uppercase tracking-wide">
                      Chia sẻ & quản lý thông minh
                    </p>
                    <h2 className="text-primary font-bold text-2xl md:text-4xl mt-2">
                      Chia sẻ tệp nhanh chóng
                    </h2>
                    <p className="text-primary/80 text-sm md:text-lg mt-3 max-w-md mx-auto md:mx-0">
                      Dễ dàng chia sẻ tệp với đồng nghiệp hoặc bạn bè chỉ trong
                      vài giây, với các tùy chọn quản lý linh hoạt.
                    </p>
                  </div>
                </ScrollReveal>
              </div>
              {/* Bảng giá/thanh toán */}
              <div className="w-full mt-16" id="plan-section">
                <ScrollReveal direction="up">
                  <h2 className="text-primary font-bold text-center text-3xl mb-8">
                    GÓI DỊCH VỤ
                  </h2>
                </ScrollReveal>
                <ScrollReveal direction="down">
                  <PlanList />
                </ScrollReveal>
              </div>
            </div>

            {/* FAQ - Câu hỏi thường gặp */}
            <div className="w-full mt-16 max-w-2xl mx-auto">
              <ScrollReveal direction="up">
                <h2 className="text-primary font-bold text-center text-3xl mb-8">
                  CÂU HỎI THƯỜNG GẶP
                </h2>
              </ScrollReveal>
              <div className="space-y-6">
                <ScrollReveal direction="up">
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="font-semibold text-lg text-[#1cadd9] mb-2">
                      1. Dữ liệu của tôi có thực sự an toàn không?
                    </h3>
                    <p className="text-gray-700">
                      Chúng tôi sử dụng công nghệ mã hóa hiện đại và xác minh
                      thủ công để đảm bảo dữ liệu của bạn luôn được bảo vệ tối
                      đa, tránh truy cập trái phép.
                    </p>
                  </div>
                </ScrollReveal>
                <ScrollReveal direction="up">
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="font-semibold text-lg text-[#1cadd9] mb-2">
                      2. Tôi có thể nâng cấp/downgrade gói dịch vụ bất cứ lúc
                      nào không?
                    </h3>
                    <p className="text-gray-700">
                      Bạn có thể thay đổi gói dịch vụ bất cứ lúc nào chỉ với vài
                      thao tác đơn giản trong trang quản lý tài khoản.
                    </p>
                  </div>
                </ScrollReveal>
                <ScrollReveal direction="up">
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="font-semibold text-lg text-[#1cadd9] mb-2">
                      3. Thanh toán như thế nào? Có xuất hóa đơn không?
                    </h3>
                    <p className="text-gray-700">
                      Chúng tôi hỗ trợ nhiều hình thức thanh toán (chuyển khoản,
                      ví điện tử...). Hóa đơn VAT sẽ được gửi cho bạn sau khi
                      thanh toán thành công.
                    </p>
                  </div>
                </ScrollReveal>
                <ScrollReveal direction="up">
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="font-semibold text-lg text-[#1cadd9] mb-2">
                      4. Nếu gặp sự cố, tôi có được hỗ trợ nhanh không?
                    </h3>
                    <p className="text-gray-700">
                      Đội ngũ hỗ trợ luôn sẵn sàng 24/7 qua email, điện thoại,
                      fanpage và các kênh chat trực tuyến.
                    </p>
                  </div>
                </ScrollReveal>
                <ScrollReveal direction="up">
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="font-semibold text-lg text-[#1cadd9] mb-2">
                      5. Dung lượng lưu trữ có thể mở rộng thêm không?
                    </h3>
                    <p className="text-gray-700">
                      Bạn có thể liên hệ với chúng tôi để được tư vấn nâng cấp
                      dung lượng phù hợp với nhu cầu sử dụng.
                    </p>
                  </div>
                </ScrollReveal>
              </div>
            </div>

            {/* CTA cuối trang */}
            <div className="w-full mt-16 flex justify-center">
              <ScrollReveal direction="up">
                <div className="bg-[#1cadd9] rounded-2xl shadow-lg px-8 py-10 flex flex-col items-center w-full max-w-3xl text-center">
                  <h2 className="text-white font-bold text-2xl md:text-3xl mb-3">
                    Sẵn sàng trải nghiệm dịch vụ lưu trữ an toàn & tốc độ?
                  </h2>
                  <p className="text-white/90 mb-6 text-base md:text-lg">
                    Đăng ký tài khoản ngay để nhận ưu đãi và khám phá mọi tính
                    năng tuyệt vời của chúng tôi!
                  </p>
                  <a
                    href="/Login"
                    className="bg-white text-[#1cadd9] font-bold px-8 py-3 rounded-lg text-lg shadow hover:bg-gray-100 transition"
                  >
                    Đăng ký ngay
                  </a>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>

        {/* footer */}
        <Footer />
      </main>
    </>
  );
}
