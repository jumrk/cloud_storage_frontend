import TermsSection from "@/features/marketing/components/TermsSection";
import React from "react";
export const metadata = {
  title: "Điều khoản sử dụng - D2MBox",
  description:
    "Điều khoản và điều kiện sử dụng dịch vụ D2MBox. Quy định về quyền và nghĩa vụ của người dùng",
  keywords: ["điều khoản sử dụng", "terms of use", "quy định D2MBox"],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://d2mbox.com/terms_of_use",
    languages: {
      vi: "https://d2mbox.com/terms_of_use",
      en: "https://d2mbox.com/en/terms_of_use",
    },
  },
};
function page() {
  return <TermsSection />;
}

export default page;
