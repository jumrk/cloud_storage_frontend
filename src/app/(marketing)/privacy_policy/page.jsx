import PrivacyPolicySection from "@/features/marketing/components/PrivacyPolicySection";
import React from "react";

export const metadata = {
  title: "Chính sách bảo mật - D2MBox",
  description:
    "Chính sách bảo mật và bảo vệ dữ liệu của D2MBox. Cam kết bảo vệ thông tin cá nhân và dữ liệu người dùng",
  keywords: [
    "chính sách bảo mật",
    "privacy policy",
    "bảo vệ dữ liệu",
    "D2MBox",
  ],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://d2mbox.com/privacy_policy",
    languages: {
      vi: "https://d2mbox.com/privacy_policy",
      en: "https://d2mbox.com/en/privacy_policy",
    },
  },
};
function page() {
  return <PrivacyPolicySection />;
}

export default page;
