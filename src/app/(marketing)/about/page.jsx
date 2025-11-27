import AboutSection from "@/features/marketing/components/AboutSection";
import React from "react";
export const metadata = {
  title: "Giới thiệu về D2MBox",
  description:
    "Tìm hiểu về D2MBox - giải pháp lưu trữ đám mây chuyên nghiệp với các tính năng AI, bảo mật cao và hiệu suất vượt trội",
  keywords: [
    "giới thiệu D2MBox",
    "về chúng tôi",
    "cloud storage",
    "lưu trữ đám mây",
    "AI tools",
  ],
  openGraph: {
    title: "Giới thiệu về D2MBox - Cloud Storage Solution",
    description:
      "Khám phá D2MBox - nền tảng lưu trữ đám mây thông minh với AI và bảo mật cao",
    type: "website",
    images: [
      {
        url: "/images/og-about.jpg",
        width: 1200,
        height: 630,
        alt: "D2MBox About Us",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Giới thiệu về D2MBox",
    description: "Khám phá D2MBox - nền tảng lưu trữ đám mây thông minh",
  },
  alternates: {
    canonical: "https://d2mbox.com/about",
    languages: {
      vi: "https://d2mbox.com/about",
      en: "https://d2mbox.com/en/about",
    },
  },
};
function page() {
  return <AboutSection />;
}

export default page;
