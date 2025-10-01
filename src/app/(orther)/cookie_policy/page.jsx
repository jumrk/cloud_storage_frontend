import CookiePolicy from "@/components/orther/CookiePolicyPage";
import React from "react";
export const metadata = {
  title: "Chính sách cookie - D2MBox",
  description:
    "Chính sách sử dụng cookie của D2MBox. Thông tin về cách chúng tôi sử dụng cookie để cải thiện trải nghiệm người dùng",
  keywords: ["chính sách cookie", "cookie policy", "D2MBox"],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://d2mbox.com/cookie_policy",
    languages: {
      vi: "https://d2mbox.com/cookie_policy",
      en: "https://d2mbox.com/en/cookie_policy",
    },
  },
};
function page() {
  return <CookiePolicy />;
}

export default page;
