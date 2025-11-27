"use client";

import React from "react";
import Hero from "@/features/marketing/components/Hero";
import Description from "@/features/marketing/components/Description";
import ScrollReveal from "@/shared/ui/ScrollReveal";
import PlanListWithUser from "@/features/plans/components/PlanListWithUser";
import useMarketingPage from "@/features/marketing/hooks/useMarketingPage";

export default function Home() {
  const { t } = useMarketingPage();

  return (
    <>
      <main className="relative w-full overflow-hidden pt-20">
        <div className="mx-auto max-w-screen-xl p-4">
          <Hero />
          <div className="mt-20 flex w-full flex-col items-center justify-center">
            <Description />

            <div className="mt-16 w-full" id="plan-section">
              <ScrollReveal direction="up">
                <h2 className="text-primary mb-8 text-center text-3xl font-bold">
                  {t("plans.title")}
                </h2>
              </ScrollReveal>
              <PlanListWithUser />
            </div>

            <div className="mx-auto mt-16 w-full max-w-2xl">
              <ScrollReveal direction="up">
                <h2 className="text-primary mb-8 text-center text-3xl font-bold">
                  {t("faq.title")}
                </h2>
              </ScrollReveal>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <ScrollReveal direction="up">
                  <div className="bg-white rounded-lg p-5 shadow">
                    <h3 className="text-accent mb-2 text-lg font-semibold">
                      {t("faq.1_q")}
                    </h3>
                    <p className="text-text-muted">{t("faq.1_a")}</p>
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="up">
                  <div className="bg-white rounded-lg p-5 shadow">
                    <h3 className="text-accent mb-2 text-lg font-semibold">
                      {t("faq.2_q")}
                    </h3>
                    <p className="text-text-muted">{t("faq.2_a")}</p>
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="up">
                  <div className="bg-white rounded-lg p-5 shadow">
                    <h3 className="text-accent mb-2 text-lg font-semibold">
                      {t("faq.3_q")}
                    </h3>
                    <p className="text-text-muted">{t("faq.3_a")}</p>
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="up">
                  <div className="bg-white rounded-lg p-5 shadow">
                    <h3 className="text-accent mb-2 text-lg font-semibold">
                      {t("faq.4_q")}
                    </h3>
                    <p className="text-text-muted">{t("faq.4_a")}</p>
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="up">
                  <div className="bg-white rounded-lg p-5 shadow">
                    <h3 className="text-accent mb-2 text-lg font-semibold">
                      {t("faq.5_q")}
                    </h3>
                    <p className="text-text-muted">{t("faq.5_a")}</p>
                  </div>
                </ScrollReveal>
              </div>
            </div>

            <div className="w-full mt-16">
              <section className="bg-surface-soft mx-auto mb-10 flex w-full max-w-5xl flex-col items-center gap-8 rounded-xl p-6 md:flex-row md:items-stretch md:gap-12 md:p-12">
                <div className="flex flex-1 flex-col text-center md:items-start md:text-left">
                  <h2 className="text-text-strong mb-4 text-2xl font-semibold leading-tight md:text-5xl">
                    {t("cta.title")} <span className="text-accent">D2MBox</span>
                  </h2>
                </div>

                <div className="flex flex-1 flex-col items-center justify-center text-center md:items-start md:text-left">
                  <p className="text-text-muted mb-6 max-w-xl text-sm md:text-base">
                    {t("cta.desc")}
                  </p>

                  <a
                    href="#plan-section"
                    className="bg-accent hover:bg-accent-600 text-surface-50 mt-2 flex items-center gap-2 rounded-md px-6 py-2 font-semibold shadow transition md:mt-0"
                  >
                    {t("cta.btn")}
                    <span className="ml-1">→</span>
                  </a>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
