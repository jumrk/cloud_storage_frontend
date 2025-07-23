"use client";
import React from "react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import {
  ShieldCheckIcon,
  CloudArrowUpIcon,
  UsersIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  LockClosedIcon,
  FolderOpenIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/solid";
import Lottie from "lottie-react";
import partnerLottie from "@/assets/animation/partner.json";
import sumenhLottie from "@/assets/animation/sumenh.json";
import targetLottie from "@/assets/animation/Target.json";

export default function AboutPage() {
  return (
    <div className="w-full min-h-screen bg-[#f7f8fa] pb-16">
      {/* Hero section */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-8 flex flex-col md:flex-row items-center gap-8">
        <ScrollReveal className="flex-1">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Khám phá sứ mệnh & giá trị của{" "}
            <span className="text-[#189ff2]">D2MBox</span>
          </h1>
          <p className="text-gray-700 text-lg mb-8 max-w-xl">
            D2MBox cam kết mang đến nền tảng lưu trữ, chia sẻ và quản lý dữ liệu
            an toàn, linh hoạt, tối ưu cho doanh nghiệp & cá nhân hiện đại.
          </p>
          <a
            href="/plans"
            className="inline-block bg-[#189ff2] text-white font-semibold px-8 py-3 rounded-lg shadow hover:bg-[#0d8ad1] transition"
          >
            Bắt đầu ngay
          </a>
        </ScrollReveal>
        <ScrollReveal className="flex-1 flex justify-center">
          <div className="w-full max-w-xl flex items-center justify-center">
            <Lottie animationData={sumenhLottie} loop={true} />
          </div>
        </ScrollReveal>
      </section>

      {/* Giá trị & Sứ mệnh */}
      <section className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScrollReveal>
            <ValueCard
              icon={
                <ShieldCheckIcon className="w-10 h-10 text-[#189ff2] mb-2" />
              }
              title="Bảo mật tuyệt đối"
              desc="Dữ liệu mã hóa, bảo vệ nhiều lớp, cam kết an toàn tuyệt đối."
            />
          </ScrollReveal>
          <ScrollReveal>
            <ValueCard
              icon={
                <CloudArrowUpIcon className="w-10 h-10 text-[#189ff2] mb-2" />
              }
              title="Lưu trữ linh hoạt"
              desc="Tích hợp Google Drive, mở rộng không giới hạn, đồng bộ đa nền tảng."
            />
          </ScrollReveal>
          <ScrollReveal>
            <ValueCard
              icon={<UsersIcon className="w-10 h-10 text-[#189ff2] mb-2" />}
              title="Quản lý nhóm thông minh"
              desc="Phân quyền dạng cây, leader tự quản lý thành viên, bảo mật nội bộ."
            />
          </ScrollReveal>
          <ScrollReveal>
            <ValueCard
              icon={<BoltIcon className="w-10 h-10 text-[#189ff2] mb-2" />}
              title="Tốc độ vượt trội"
              desc="Upload/download nhanh, thao tác mượt mà, tối ưu cho doanh nghiệp."
            />
          </ScrollReveal>
        </div>
      </section>

      {/* Hình ảnh/feature nổi bật */}
      <section className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 items-center">
        <ScrollReveal className="flex-1 flex justify-center">
          <div className="w-full h-56 md:h-72 bg-gradient-to-br from-[#e0f2fe] to-[#f7f8fa] rounded-2xl flex items-center justify-center shadow">
            <Lottie
              animationData={partnerLottie}
              loop={true}
              className="w-48 h-48 md:w-64 md:h-64"
            />
          </div>
        </ScrollReveal>
        <ScrollReveal className="flex-1">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            D2MBox – Đối tác tin cậy của bạn
          </h2>
          <ul className="space-y-3 text-gray-700 text-base">
            <li className="flex items-center gap-2">
              <FolderOpenIcon className="w-6 h-6 text-[#189ff2]" /> Lưu trữ &
              chia sẻ file, folder không giới hạn
            </li>
            <li className="flex items-center gap-2">
              <LockClosedIcon className="w-6 h-6 text-[#189ff2]" /> Phân quyền
              chi tiết, kiểm soát truy cập an toàn
            </li>
            <li className="flex items-center gap-2">
              <DevicePhoneMobileIcon className="w-6 h-6 text-[#189ff2]" /> Trải
              nghiệm mượt mà trên mọi thiết bị
            </li>
            <li className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-[#189ff2]" />{" "}
              Chat & thông báo realtime, hỗ trợ 24/7
            </li>
          </ul>
        </ScrollReveal>
      </section>

      {/* Số liệu/statistics */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScrollReveal>
            <StatCard value="99.99%" label="Uptime hệ thống" />
          </ScrollReveal>
          <ScrollReveal>
            <StatCard value="1PB+" label="Dung lượng lưu trữ" />
          </ScrollReveal>
          <ScrollReveal>
            <StatCard value="10,000+" label="Người dùng tin tưởng" />
          </ScrollReveal>
        </div>
      </section>

      {/* Mục tiêu/cam kết */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <ScrollReveal>
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Mục tiêu & cam kết của D2MBox
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700 text-base mt-4">
                <li>✔️ Cung cấp nền tảng lưu trữ an toàn, bảo mật</li>
                <li>✔️ Hỗ trợ doanh nghiệp chuyển đổi số hiệu quả</li>
                <li>✔️ Đảm bảo quyền riêng tư tuyệt đối cho người dùng</li>
                <li>✔️ Dịch vụ hỗ trợ tận tâm, chuyên nghiệp 24/7</li>
              </ul>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="w-48 h-48 bg-gradient-to-br from-[#e0f2fe] to-[#f7f8fa] rounded-2xl flex items-center justify-center shadow">
                <Lottie animationData={targetLottie} loop={true} />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Vision/định hướng */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <ScrollReveal>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            Định hướng phát triển
          </h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScrollReveal>
            <VisionCard
              title="Mở rộng tích hợp"
              desc="Kết nối nhiều dịch vụ cloud, API, tối ưu cho doanh nghiệp lớn."
            />
          </ScrollReveal>
          <ScrollReveal>
            <VisionCard
              title="AI & Tự động hóa"
              desc="Ứng dụng AI vào quản lý, tìm kiếm, bảo mật dữ liệu thông minh."
            />
          </ScrollReveal>
          <ScrollReveal>
            <VisionCard
              title="Hỗ trợ đa nền tảng"
              desc="Trải nghiệm liền mạch trên web, mobile, desktop, IoT."
            />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA cuối trang */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <ScrollReveal>
          <div className="bg-[#189ff2] rounded-2xl shadow-lg px-8 py-10 flex flex-col items-center w-full text-center">
            <h2 className="text-white font-bold text-2xl md:text-3xl mb-3">
              Sẵn sàng trải nghiệm D2MBox?
            </h2>
            <p className="text-white/90 mb-6 text-base md:text-lg">
              Đăng ký tài khoản ngay để nhận ưu đãi và khám phá mọi tính năng
              tuyệt vời của chúng tôi!
            </p>
            <a
              href="/Login"
              className="bg-white text-[#189ff2] font-bold px-8 py-3 rounded-lg text-lg shadow hover:bg-gray-100 transition"
            >
              Trải nghiệm ngay
            </a>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}

function ValueCard({ icon, title, desc }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center h-full">
      {icon}
      <div className="font-semibold mt-2 mb-1 text-center">{title}</div>
      <div className="text-gray-600 text-sm text-center">{desc}</div>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center h-full">
      <div className="text-3xl md:text-4xl font-extrabold text-[#189ff2] mb-2">
        {value}
      </div>
      <div className="text-gray-700 text-base text-center font-semibold">
        {label}
      </div>
    </div>
  );
}

function VisionCard({ title, desc }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center h-full">
      <div className="font-bold text-lg mb-2 text-[#189ff2] text-center">
        {title}
      </div>
      <div className="text-gray-600 text-sm text-center">{desc}</div>
    </div>
  );
}
