import Footer from "@/components/ui/footer";
import Header from "@/components/ui/Header";
import Hero from "@/components/Hero";
import ScrollReveal from "@/components/ui/ScrollReveal";
import React from "react";
import {
  LockClosedIcon,
  BoltIcon,
  UserGroupIcon,
  DevicePhoneMobileIcon,
  UsersIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/solid";
import Desription from "@/components/Description";
import PlanList from "@/components/PlanList";
export const metadata = {
  title: "D2MBox",
};
export default function Home() {
  const features = [
    {
      icon: <LockClosedIcon className="w-8 h-8 text-[#1cadd9]" />,
      title: "Bảo mật tuyệt đối",
      description:
        "Dữ liệu được mã hóa và bảo vệ nhiều lớp, an toàn tuyệt đối.",
    },
    {
      icon: <BoltIcon className="w-8 h-8 text-[#1cadd9]" />,
      title: "Tốc độ siêu nhanh",
      description:
        "Tải lên và truy cập file cực nhanh, không giới hạn băng thông.",
    },
    {
      icon: <UserGroupIcon className="w-8 h-8 text-[#1cadd9]" />,
      title: "Phi tập trung & xác minh thủ công",
      description: "Tài khoản xác minh thủ công, không mở đăng ký công khai.",
    },
    {
      icon: <DevicePhoneMobileIcon className="w-8 h-8 text-[#1cadd9]" />,
      title: "Dung lượng lớn",
      description: "Lưu trữ lên đến 1PB, đáp ứng mọi nhu cầu doanh nghiệp.",
    },
    {
      icon: <UsersIcon className="w-8 h-8 text-[#1cadd9]" />,
      title: "Quản lý user thông minh",
      description:
        "Phân quyền theo nhóm, mỗi team như một hệ thống riêng biệt.",
    },
    {
      icon: <CurrencyDollarIcon className="w-8 h-8 text-[#1cadd9]" />,
      title: "Giá siêu rẻ",
      description:
        "Dung lượng khủng, chi phí cực thấp cho cả cá nhân & doanh nghiệp.",
    },
  ];

  return (
    <>
      <Header />
      <main className="w-full pt-20 relative overflow-hidden">
        <div className="max-w-screen-xl mx-auto p-4">
          <Hero />
          <div className="w-full mt-20 flex flex-col justify-center items-center">
            {/* Mô tả */}
            <Desription />
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
            {/* FAQ - Câu hỏi thường gặp */}
            <div className="w-full mt-16 max-w-2xl mx-auto">
              <ScrollReveal direction="up">
                <h2 className="text-primary font-bold text-center text-3xl mb-8">
                  CÂU HỎI THƯỜNG GẶP
                </h2>
              </ScrollReveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="w-full mt-16">
              <section className="w-full bg-[#e5e7eb] rounded-xl flex flex-col md:flex-row items-center md:items-stretch gap-8 md:gap-12 p-6 md:p-12 mb-10 max-w-5xl mx-auto">
                <div className="flex-1 flex flex-col  md:items-start text-center md:text-left">
                  <h2 className="text-2xl md:text-5xl font-semibold text-gray-900 mb-4 leading-tight">
                    Phát triển công việc nhóm của bạn với{" "}
                    <span className="text-[#189ff2]">D2MBox</span>
                  </h2>
                </div>
                <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left">
                  <p className="text-gray-700 text-sm md:text-base mb-6 max-w-xl">
                    Mang đội nhóm hoặc công ty của bạn lên nền tảng D2MBox – nơi
                    kết hợp giữa lưu trữ dữ liệu an toàn và quản lý công việc
                    hiệu quả. Dù bạn là startup nhỏ hay doanh nghiệp vừa, D2MBox
                    cung cấp dung lượng lưu trữ linh hoạt cùng với các công cụ
                    cộng tác mạnh mẽ: Tạo task, phân công nhiệm vụ, trao đổi
                    công việc trực tiếp trên web. Leader có thể dễ dàng tạo và
                    phân quyền tài khoản cho thành viên hoặc cộng tác viên, giúp
                    công việc vận hành mượt mà, minh bạch và có tổ chức.
                  </p>
                  <a
                    href="#plan-section"
                    className="bg-[#189ff2] text-white font-semibold px-6 py-2 rounded-md shadow hover:bg-[#0d8ad1] transition flex items-center gap-2 mt-2 md:mt-0"
                  >
                    Tìm hiểu thêm
                    <span className="ml-1">→</span>
                  </a>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* footer */}
        <Footer />
      </main>
    </>
  );
}
