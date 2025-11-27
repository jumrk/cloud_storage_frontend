import ContactSection from "@/features/marketing/components/ContactSection";
import React from "react";

export const metadata = {
  title: "Hỗ trợ và liên hệ - D2MBox",
  description:
    "Liên hệ với đội ngũ D2MBox để được hỗ trợ kỹ thuật, tư vấn giải pháp lưu trữ đám mây và giải đáp mọi thắc mắc",
  keywords: ["liên hệ D2MBox", "hỗ trợ kỹ thuật", "tư vấn cloud storage"],
  openGraph: {
    title: "Hỗ trợ và liên hệ - D2MBox",
    description: "Liên hệ với đội ngũ D2MBox để được hỗ trợ và tư vấn",
    type: "website",
  },
  alternates: {
    canonical: "https://d2mbox.com/contact",
    languages: {
      vi: "https://d2mbox.com/contact",
      en: "https://d2mbox.com/en/contact",
    },
  },
};
function page() {
  return <ContactSection />;
}

export default page;
