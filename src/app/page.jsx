import Footer from "@/components/ui/footer";
import Header from "@/components/ui/Header";
import Hero from "@/components/Hero";
import ScrollReveal from "@/components/ui/ScrollReveal";
import React from "react";
import Desription from "@/components/Description";
import PlanList from "@/components/PlanList";
import { useTranslations } from "next-intl";

export const metadata = {
  title: "D2MBox - Cloud Storage Solution",
  description:
    "D2MBox - Giải pháp lưu trữ đám mây chuyên nghiệp với AI, bảo mật cao, và các công cụ media tiên tiến. Tăng tốc công việc của bạn ngay hôm nay!",
  keywords: [
    "cloud storage",
    "lưu trữ đám mây",
    "AI tools",
    "file management",
    "D2MBox",
  ],
  openGraph: {
    title: "D2MBox - Cloud Storage Solution",
    description:
      "Giải pháp lưu trữ đám mây chuyên nghiệp với AI và bảo mật cao",
    type: "website",
    images: [
      {
        url: "/images/og-homepage.jpg",
        width: 1200,
        height: 630,
        alt: "D2MBox Homepage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "D2MBox - Cloud Storage Solution",
    description: "Giải pháp lưu trữ đám mây chuyên nghiệp với AI",
  },
  alternates: {
    canonical: "https://d2mbox.com",
    languages: {
      vi: "https://d2mbox.com",
      en: "https://d2mbox.com/en",
    },
  },
};

export default function Home() {
  const t = useTranslations();
  return (
    <>
      <Header />
      <main className="w-full pt-20 relative overflow-hidden">
        <div className="max-w-screen-xl mx-auto p-4">
          <Hero />
          <div className="w-full mt-20 flex flex-col justify-center items-center">
            {/* Mô tả */}
            <Desription />
            {/* Bảng giá/thanh toán */}
            <div className="w-full mt-16" id="plan-section">
              <ScrollReveal direction="up">
                <h2 className="text-primary font-bold text-center text-3xl mb-8">
                  {t("plans.title")}
                </h2>
              </ScrollReveal>
              <ScrollReveal direction="down">
                <PlanList />
              </ScrollReveal>
            </div>
            {/* FAQ - Câu hỏi thường gặp */}
            <div className="w-full mt-16 max-w-2xl mx-auto">
              <ScrollReveal direction="up">
                <h2 className="text-primary font-bold text-center text-3xl mb-8">
                  {t("faq.title")}
                </h2>
              </ScrollReveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ScrollReveal direction="up">
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="font-semibold text-lg text-[#1cadd9] mb-2">
                      {t("faq.1_q")}
                    </h3>
                    <p className="text-gray-700">{t("faq.1_a")}</p>
                  </div>
                </ScrollReveal>
                <ScrollReveal direction="up">
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="font-semibold text-lg text-[#1cadd9] mb-2">
                      {t("faq.2_q")}
                    </h3>
                    <p className="text-gray-700">{t("faq.2_a")}</p>
                  </div>
                </ScrollReveal>
                <ScrollReveal direction="up">
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="font-semibold text-lg text-[#1cadd9] mb-2">
                      {t("faq.3_q")}
                    </h3>
                    <p className="text-gray-700">{t("faq.3_a")}</p>
                  </div>
                </ScrollReveal>
                <ScrollReveal direction="up">
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="font-semibold text-lg text-[#1cadd9] mb-2">
                      {t("faq.4_q")}
                    </h3>
                    <p className="text-gray-700">{t("faq.4_a")}</p>
                  </div>
                </ScrollReveal>
                <ScrollReveal direction="up">
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="font-semibold text-lg text-[#1cadd9] mb-2">
                      {t("faq.5_q")}
                    </h3>
                    <p className="text-gray-700">{t("faq.5_a")}</p>
                  </div>
                </ScrollReveal>
              </div>
            </div>

            {/* CTA cuối trang */}
            <div className="w-full mt-16">
              <section className="w-full bg-[#e5e7eb] rounded-xl flex flex-col md:flex-row items-center md:items-stretch gap-8 md:gap-12 p-6 md:p-12 mb-10 max-w-5xl mx-auto">
                <div className="flex-1 flex flex-col  md:items-start text-center md:text-left">
                  <h2 className="text-2xl md:text-5xl font-semibold text-gray-900 mb-4 leading-tight">
                    {t("cta.title")}{" "}
                    <span className="text-[#189ff2]">D2MBox</span>
                  </h2>
                </div>
                <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left">
                  <p className="text-gray-700 text-sm md:text-base mb-6 max-w-xl">
                    {t("cta.desc")}
                  </p>
                  <a
                    href="#plan-section"
                    className="bg-[#189ff2] text-white font-semibold px-6 py-2 rounded-md shadow hover:bg-[#0d8ad1] transition flex items-center gap-2 mt-2 md:mt-0"
                  >
                    {t("cta.btn")}
                    <span className="ml-1">→</span>
                  </a>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* footer */}
        <Footer />
      </main>
    </>
  );
}
