"use client";
import React from "react";
import Share from "@/assets/animation/Share.json";
import wirel from "@/assets/animation/wirel.json";
import Expert from "@/assets/animation/Expert.json";
import UI from "@/assets/animation/UI.json";
import Upload from "@/assets/animation/upload.json";
import { useTranslations } from "next-intl";
import ScrollReveal from "@/shared/ui/ScrollReveal";
import ScrollParallaxLottie from "@/shared/ui/ScrollParallaxLottie";
import FeatureSlider from "@/features/marketing/components/FeatureSlider";

export default function Description() {
  const t = useTranslations();
  const features = [
    {
      title: t("description.feature_1_title"),
      desc: t("description.feature_1_desc"),
      animation: wirel,
    },
    {
      title: t("description.feature_2_title"),
      desc: t("description.feature_2_desc"),
      animation: wirel,
    },
    {
      title: t("description.feature_3_title"),
      desc: t("description.feature_3_desc"),
      animation: wirel,
    },
    {
      title: t("description.feature_4_title"),
      desc: t("description.feature_4_desc"),
      animation: wirel,
    },
  ];
  return (
    <div>
      <ScrollReveal>
        <div className="mt-20 mb-14 flex w-full flex-col items-center">
          <ScrollReveal>
            <h2 className="mb-10 text-center text-2xl font-bold text-accent md:text-3xl">
              {t("description.title")}
            </h2>
          </ScrollReveal>
          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div className="flex justify-center">
              <ScrollReveal>
                <ScrollParallaxLottie animationData={Expert} />
              </ScrollReveal>
            </div>
            <ScrollReveal direction="right">
              <FeatureSlider features={features} />
            </ScrollReveal>
          </div>
        </div>
      </ScrollReveal>

      <div className="mt-8 space-y-8 md:space-y-12">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-8">
          <div className="w-full">
            <ScrollReveal>
              <ScrollParallaxLottie animationData={Share} />
            </ScrollReveal>
          </div>

          <ScrollReveal direction="down">
            <ScrollReveal>
              <div className="flex flex-col justify-center text-center md:text-left">
                <p className="text-accent-800 text-sm font-bold uppercase tracking-wide md:text-lg">
                  {t("description.share")}
                </p>
                <h2 className="text-primary mt-2 text-2xl font-bold md:text-4xl">
                  {t("description.share_title")}
                </h2>
                <p className="text-primary/80 mt-3 max-w-md text-sm md:text-lg md:mx-0 mx-auto">
                  {t("description.share_desc")}
                </p>
              </div>
            </ScrollReveal>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-8">
          <div className="w-full md:order-2">
            <ScrollReveal>
              <ScrollParallaxLottie animationData={Upload} />
            </ScrollReveal>
          </div>

          <ScrollReveal direction="down">
            <ScrollReveal>
              <div className="md:order-1 flex flex-col items-end justify-center text-center md:text-left">
                <div>
                  <p className="text-accent-800 text-sm font-bold uppercase tracking-wide md:text-lg">
                    {t("description.sync")}
                  </p>
                  <h2 className="text-primary mt-2 text-2xl font-bold md:text-4xl">
                    {t("description.sync_title")}
                  </h2>
                  <p className="text-primary/80 mt-3 max-w-md text-sm md:text-lg md:mx-0 mx-auto">
                    {t("description.sync_desc")}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-8">
          <div className="w-full">
            <ScrollReveal>
              <ScrollParallaxLottie animationData={UI} />
            </ScrollReveal>
          </div>

          <ScrollReveal direction="down">
            <ScrollReveal>
              <div className="md:order-1 flex flex-col justify-center text-center md:text-left">
                <p className="text-accent-800 text-sm font-bold uppercase tracking-wide md:text-lg">
                  {t("description.ui")}
                </p>
                <h2 className="text-primary mt-2 text-2xl font-bold md:text-4xl">
                  {t("description.ui_title")}
                </h2>
                <p className="text-primary/80 mt-3 max-w-md text-sm md:text-lg md:mx-0 mx-auto">
                  {t("description.ui_desc")}
                </p>
              </div>
            </ScrollReveal>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
