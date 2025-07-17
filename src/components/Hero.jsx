"use client";
import React from "react";
import Button_custom from "./ui/Button_custom";
import ScrollReveal from "./ui/ScrollReveal";
import { useRouter } from "next/navigation";
import { FaLock, FaPlay } from "react-icons/fa";

function Hero() {
  const router = useRouter();
  const handleGetStarted = () => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/home");
    } else {
      router.push("/Login");
    }
  };
  const handleScrollToPlan = () => {
    if (typeof window !== "undefined") {
      document
        .getElementById("plan-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };
  return (
    <div className="w-full min-h-[60vh] flex flex-col md:flex-row items-center justify-between md:px-14 py-8 gap-8">
      {/* Left: Text content */}
      <div className="flex-1 flex flex-col gap-6 max-w-2xl">
        <ScrollReveal direction="down">
          <h1 className="text-3xl md:text-5xl font-bold text-black leading-tight flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center bg-[#1cadd9] rounded-full px-2 py-1 mr-2">
              <FaLock className="text-white mr-1" />
            </span>
            <span className="relative">
              <span className="bg-[#1cadd9]/20 absolute inset-0 -z-10 rounded-md h-2/3 top-1/3 w-full"></span>
              <span className="text-[#1cadd9]">GIẢI PHÁP</span>
            </span>
            <span className="ml-2">LƯU TRỮ</span>
            <br />
            <span className="relative">
              <span className="bg-[#1cadd9]/10 absolute inset-0 -z-10 rounded-md h-2/3 top-1/3 w-full"></span>
              <span className="text-[#1cadd9]">AN TOÀN</span>
            </span>
            <span className="ml-2">VÀ</span>
            <span className="relative">
              <span className="bg-[#1cadd9]/20 absolute inset-0 -z-10 rounded-md h-2/3 top-1/3 w-full"></span>
              <span className="text-[#1cadd9]">TỐC ĐỘ CAO</span>
            </span>
          </h1>
        </ScrollReveal>
        <ScrollReveal direction="left">
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleGetStarted}
              className="bg-[#1cadd9] cursor-pointer text-white px-6 py-3 rounded-md font-semibold shadow hover:bg-[#189bc2] transition"
            >
              Bắt đầu
            </button>
            <button
              className="flex items-center gap-2 px-4 py-3 border border-[#1cadd9] text-[#1cadd9] rounded-md font-medium hover:bg-[#1cadd9]/10 transition"
              onClick={handleScrollToPlan}
            >
              <FaPlay className="text-xs" /> Xem gói dịch vụ
            </button>
          </div>
        </ScrollReveal>
        <ScrollReveal direction="up">
          <div className="flex gap-12 mt-10">
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-1">✖️</span>
              <span className="text-xl font-bold">20K+</span>
              <span className="text-gray-500 text-sm ">Người dùng</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-1">🗂️</span>
              <span className="text-xl font-bold">1M+</span>
              <span className="text-gray-500 text-sm">Tệp tải lên</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-1">⚪</span>
              <span className="text-xl font-bold">1 PB</span>
              <span className="text-gray-500 text-sm">Dung lượng lưu trữ</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
      {/* Right: Illustration & description */}
      <ScrollReveal direction="right">
        <div className="flex-1 flex flex-col items-center gap-8 max-w-xl">
          <img
            src="/images/Hero.jpeg"
            alt="hero-illustration"
            className="w-full max-w-md drop-shadow-2xl"
          />
          <div className="bg-white border-l-2 border-gray-300 pl-6 py-4 shadow-sm text-gray-700 text-base">
            Nền tảng của chúng tôi cung cấp một phương pháp lưu trữ dữ liệu phi
            tập trung, an toàn, đảm bảo dữ liệu nhạy cảm của bạn được bảo vệ
            khỏi truy cập và giả mạo trái phép. Với công nghệ tiên tiến, bạn có
            thể tin tưởng rằng dữ liệu của mình luôn an toàn và bảo mật.
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}

export default Hero;
