"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaLock, FaPlay } from "react-icons/fa";
import Lottie from "lottie-react";
import metaverseAnimation from "@/assets/animation/metaverse.json";
import userAnimation from "@/assets/animation/user.json";
import folderAnimation from "@/assets/animation/folder.json";
import storageAnimation from "@/assets/animation/storage.json";
import { useTranslations } from "next-intl";
import ScrollReveal from "@/shared/ui/ScrollReveal";
import TypingAnimation from "@/features/marketing/components/TypingAnimation";
import DescriptionSlider from "@/features/marketing/components/DescriptionSlider";
import Button from "@/shared/ui/button";
function Hero() {
  const t = useTranslations();
  const router = useRouter();
  const handleGetStarted = async () => {
    // ✅ Check if user is authenticated via API (cookie sent automatically)
    try {
      const res = await axiosClient.get("/api/user");
      router.push(res.data ? "/home" : "/login");
    } catch {
      router.push("/login");
    }
  };
  const handleScrollToPlan = () => {
    if (typeof window !== "undefined") {
      document
        .getElementById("plan-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };
  const fastTexts = [t("hero.fast1"), t("hero.fast2")];
  return (
    <div className="md:px-14 flex w-full min-h-[60vh] flex-col items-center justify-between gap-8 md:flex-row">
      <div className="flex max-w-2xl flex-1 flex-col gap-6">
        <ScrollReveal direction="down">
          <h1 className="text-gray-900 md:text-5xl flex flex-col gap-2 text-3xl font-bold leading-tight">
            <div>
              <span className="bg-accent mr-2 inline-flex items-center rounded-full px-2 py-1">
                <FaLock className="text-surface-50 mr-1" />{" "}
              </span>{" "}
              <span className="relative">
                <span
                  className="absolute inset-0 -z-10 w-full rounded-md"
                  style={{
                    height: "66%",
                    top: "34%",
                    background:
                      "color-mix(in srgb, var(--color-accent) 20%, transparent)",
                  }}
                />{" "}
                <span className="text-accent">{t("hero.solution")}</span>{" "}
              </span>{" "}
            </div>{" "}
            <div className="flex gap-2">
              <span className="ml-2">{t("hero.storage")}</span>{" "}
              <span className="relative">
                <span
                  className="absolute inset-0 -z-10 w-full rounded-md"
                  style={{
                    height: "66%",
                    top: "34%",
                    background:
                      "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                  }}
                />{" "}
                <span className="text-accent">{t("hero.safe")}</span>{" "}
              </span>{" "}
            </div>{" "}
            <div className="flex gap-2">
              <span className="ml-2">{t("hero.and")}</span>{" "}
              <span className="relative">
                <span
                  className="absolute inset-0 -z-10 w-full rounded-md"
                  style={{
                    height: "66%",
                    top: "34%",
                    background:
                      "color-mix(in srgb, var(--color-accent) 20%, transparent)",
                  }}
                />{" "}
                <TypingAnimation texts={fastTexts} speed={60} delay={3000} />{" "}
              </span>{" "}
            </div>{" "}
          </h1>{" "}
        </ScrollReveal>{" "}
        <ScrollReveal direction="left">
          <div className="mt-4 flex gap-4">
            <Button
              handleClick={handleGetStarted}
              children={t("hero.get_started")}
              size="xl"
            />{" "}
            <Button
              handleClick={handleScrollToPlan}
              children={t("hero.view_pricing")}
              size="xl"
              variant="outline"
              color="brand"
              leftIcon={<FaPlay className="text-xs" />}
            />{" "}
          </div>{" "}
        </ScrollReveal>{" "}
        <ScrollReveal direction="up">
          <div className="mt-10 flex gap-12">
            <div className="flex flex-col items-center">
              <Lottie
                animationData={userAnimation}
                loop
                className="mb-1 h-12 w-12"
              />{" "}
              <span className="text-gray-900 text-xl font-bold">20K+</span>{" "}
              <span className="text-gray-600 text-sm">{t("hero.users")}</span>{" "}
            </div>{" "}
            <div className="flex flex-col items-center">
              <Lottie
                animationData={folderAnimation}
                loop
                className="mb-1 h-12 w-12"
              />{" "}
              <span className="text-gray-900 text-xl font-bold">1M+</span>{" "}
              <span className="text-gray-600 text-sm">{t("hero.files")}</span>{" "}
            </div>{" "}
            <div className="flex flex-col items-center">
              <Lottie
                animationData={storageAnimation}
                loop
                className="mb-1 h-12 w-12"
              />{" "}
              <span className="text-gray-900 text-xl font-bold">1 PB</span>{" "}
              <span className="text-gray-600 text-sm">
                {t("hero.capacity")}{" "}
              </span>{" "}
            </div>{" "}
          </div>{" "}
        </ScrollReveal>{" "}
      </div>{" "}
      <ScrollReveal direction="right">
        <div className="flex max-w-xl flex-1 flex-col items-center gap-8">
          <Lottie
            animationData={metaverseAnimation}
            loop
            className="w-full max-w-xl drop-shadow-2xl"
          />{" "}
          <DescriptionSlider t={t} />{" "}
        </div>{" "}
      </ScrollReveal>{" "}
    </div>
  );
}
export default Hero;
