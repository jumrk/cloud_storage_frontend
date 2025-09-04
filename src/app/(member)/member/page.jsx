import React from "react";
import Link from "next/link";
import { CiFolderOn } from "react-icons/ci";
import { PiToolboxThin } from "react-icons/pi";

function page() {
  return (
    <div className="p-4 sm:p-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-pink-100 via-white to-blue-100">
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-pink-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-blue-300/25 blur-3xl" />

        <div className="relative p-6 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">
            Khu vực thành viên
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Chào mừng bạn quay lại. Hãy chọn một mục bên dưới để bắt đầu làm
            việc thật nhanh và thoải mái.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FeatureCard
              title="Quản lý file"
              desc="Tải lên, duyệt và chia sẻ tệp của bạn."
              icon={<CiFolderOn className="text-3xl" />}
            />
            <FeatureCard
              title="Công cụ"
              desc="Các công cụ AI & media để tăng tốc công việc."
              icon={<PiToolboxThin className="text-3xl" />}
            />
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Tip text="Kéo–thả file để upload nhanh." />
        <Tip text="Dùng sidebar để chuyển nhanh giữa các khu vực." />
        <Tip text="Di động: bấm nút menu để mở danh mục." />
      </section>
    </div>
  );
}

function FeatureCard({ href, title, desc, icon }) {
  return (
    <div
      className="group block rounded-xl border border-slate-200 bg-white/80 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-pink-300 hover:shadow-lg"
      aria-label={title}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-medium text-slate-800">{title}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function Tip({ text }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
      {text}
    </div>
  );
}

export default page;
