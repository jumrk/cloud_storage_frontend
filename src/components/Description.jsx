"use client";
import React, { useRef, useState, useEffect } from "react";
import ScrollReveal from "./ui/ScrollReveal";
import ScrollParallaxLottie from "./ui/ScrollParallaxLottie";
import Share from "@/assets/animation/Share.json";
import wirel from "@/assets/animation/wirel.json";
import Expert from "@/assets/animation/Expert.json";
import UI from "@/assets/animation/UI.json";
import Upload from "@/assets/animation/upload.json";

export default function Description() {
  const features = [
    {
      title: "Tự tạo & quản lý người dùng nhóm",
      desc: "Tự tạo và quản lý người dùng trong nhóm mà không cần thông qua hệ thống trung tâm.",
      animation: wirel,
    },
    {
      title: "Chia sẻ bộ nhớ & thao tác nhanh",
      desc: "Các thành viên sử dụng chung bộ nhớ, thao tác chỉ trong vài cú click.",
      animation: wirel,
    },
    {
      title: "Phân quyền dạng cây",
      desc: "Xây dựng mô hình phân quyền dạng cây, mỗi leader là một “admin thu nhỏ” của hệ thống riêng.",
      animation: wirel,
    },
    {
      title: "Toàn quyền kiểm soát team",
      desc: "Bạn nắm toàn quyền kiểm soát team mình – như một hệ thống riêng biệt trong hệ thống lớn.",
      animation: wirel,
    },
  ];
  return (
    <div>
      {/* Thêm vào đây  */}
      <ScrollReveal>
        <div className="w-full flex flex-col mt-20 items-center mb-14">
          <ScrollReveal>
            <h2 className="text-2xl text-center md:text-3xl font-bold text-[#0258a8] mb-10">
              PHÂN QUYỀN NGƯỜI DÙNG THÔNG MINH
            </h2>
          </ScrollReveal>
          <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2  gap-10 items-center">
            {/* Ảnh minh họa bên trái */}
            <div className="flex justify-center">
              <ScrollReveal>
                <ScrollParallaxLottie animationData={Expert} />
              </ScrollReveal>
            </div>
            {/* Danh sách tính năng bên phải - auto slider đẹp */}
            <ScrollReveal direction="right">
              <FeatureSlider features={features} />
            </ScrollReveal>
          </div>
        </div>
      </ScrollReveal>

      <div className="mt-8 space-y-8 md:space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 items-center">
          <div className="w-full">
            <ScrollReveal>
              <ScrollParallaxLottie animationData={Upload} />
            </ScrollReveal>
          </div>

          <ScrollReveal direction="down">
            <ScrollReveal>
              <div className="flex flex-col justify-center text-center md:text-left">
                <p className="text-[#01579B] font-bold text-sm md:text-lg uppercase tracking-wide">
                  Đồng bộ & Lưu trữ Thông minh
                </p>
                <h2 className="text-primary font-bold text-2xl md:text-4xl mt-2">
                  Tải lên nhanh chóng, lưu trữ an toàn
                </h2>
                <p className="text-primary/80 text-sm md:text-lg mt-3 max-w-md mx-auto md:mx-0">
                  Chỉ với vài cú nhấp chuột, bạn có thể tải bất kỳ tệp nào từ
                  thiết bị lên hệ thống. Dữ liệu được lưu trữ an toàn, đồng bộ
                  hóa tự động, giúp bạn truy cập mọi lúc, mọi nơi.
                </p>
              </div>
            </ScrollReveal>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 items-center">
          <div className="w-full md:order-2">
            <ScrollReveal>
              <ScrollParallaxLottie animationData={Share} />
            </ScrollReveal>
          </div>

          <ScrollReveal direction="down">
            <ScrollReveal>
              <div className="flex flex-col items-end justify-center text-center md:text-left md:order-1">
                <div>
                  <p className="text-[#01579B] font-bold text-sm md:text-lg uppercase tracking-wide">
                    Chia sẻ & Quản lý Linh Hoạt
                  </p>
                  <h2 className="text-primary font-bold text-2xl md:text-4xl mt-2">
                    Chia sẻ trong tích tắc
                  </h2>
                  <p className="text-primary/80 text-sm md:text-lg mt-3 max-w-md mx-auto md:mx-0">
                    Gửi tệp đến đồng nghiệp, bạn bè hoặc nhóm làm việc chỉ trong
                    vài giây. Tùy chỉnh quyền truy cập (xem, chỉnh sửa, tải
                    xuống) dễ dàng, đảm bảo tính bảo mật và kiểm soát chặt chẽ.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 items-center">
          <div className="w-full">
            <ScrollReveal>
              <ScrollParallaxLottie animationData={UI} />
            </ScrollReveal>
          </div>

          <ScrollReveal direction="down">
            <ScrollReveal>
              <div className="flex flex-col justify-center text-center md:text-left md:order-1">
                <p className="text-[#01579B] font-bold text-sm md:text-lg uppercase tracking-wide">
                  Giao diện Hiện Đại & Dễ Sử Dụng
                </p>
                <h2 className="text-primary font-bold text-2xl md:text-4xl mt-2">
                  Thiết kế trực quan, thao tác đơn giản
                </h2>
                <p className="text-primary/80 text-sm md:text-lg mt-3 max-w-md mx-auto md:mx-0">
                  Giao diện tối ưu trải nghiệm người dùng: Đẹp mắt, gọn gàng và
                  dễ quản lý. Quản lý tất cả từ tệp đến người dùng chỉ trong vài
                  bước đơn giản, tiết kiệm thời gian thao tác.
                </p>
              </div>
            </ScrollReveal>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}

// Thêm component FeatureSlider
function FeatureSlider({ features }) {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
      {features.map((item, idx) => (
        <ScrollReveal key={idx}>
          <div
            className="relative group w-full bg-white rounded-xl border border-blue-100 shadow p-4 flex flex-col items-center h-full flex-1 transition-transform duration-200
              hover:-translate-y-1 hover:border-[#189ff2]"
          >
            {/* Số thứ tự nhỏ, chỉ hiện trên md trở lên */}
            <div className="hidden md:flex absolute -top-4 left-1/2 -translate-x-1/2 items-center justify-center w-8 h-8 rounded-full bg-blue-50 border border-blue-200 shadow text-blue-700 text-lg font-bold select-none">
              {idx + 1}
            </div>
            <div className="mt-4 md:mt-6 font-bold text-primary text-base md:text-lg mb-1 text-center">
              {item.title}
            </div>
            <div className="text-gray-700 text-sm md:text-base max-w-md text-center">
              {item.desc}
            </div>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}
