import FAQSection from "@/features/marketing/components/FaqSection";
import React from "react";
export const metadata = {
  title: "Câu hỏi thường gặp - D2MBox",
  description:
    "Tìm câu trả lời cho các câu hỏi thường gặp về D2MBox, tính năng, giá cả, bảo mật và cách sử dụng",
  keywords: [
    "FAQ D2MBox",
    "câu hỏi thường gặp",
    "hướng dẫn sử dụng",
    "cloud storage FAQ",
  ],
  openGraph: {
    title: "FAQ - D2MBox",
    description: "Câu hỏi thường gặp về D2MBox",
    type: "website",
  },
  alternates: {
    canonical: "https://d2mbox.com/faq",
    languages: {
      vi: "https://d2mbox.com/faq",
      en: "https://d2mbox.com/en/faq",
    },
  },
};
function page() {
  return <FAQSection />;
}

export default page;
