"use client";
import React from "react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import {
  ShieldCheckIcon,
  CloudArrowUpIcon,
  UsersIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  LockClosedIcon,
  FolderOpenIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";
import Lottie from "lottie-react";
import partnerLottie from "@/assets/animation/partner.json";
import sumenhLottie from "@/assets/animation/sumenh.json";
import targetLottie from "@/assets/animation/Target.json";
import { useTranslations } from "next-intl";

export default function AboutPage() {
  const t = useTranslations();

  return (
    <div className="w-full min-h-screen bg-[#f7f8fa] pb-16">
      {/* Hero section */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-8 flex flex-col md:flex-row items-center gap-8">
        <ScrollReveal className="flex-1">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {t("about.hero.title")}{" "}
            <span className="text-[#189ff2]">D2MBox</span>
          </h1>
          <p className="text-gray-700 text-lg mb-8 max-w-xl">
            {t("about.hero.subtitle")}
          </p>
          <a
            href="/plans"
            className="inline-block bg-[#189ff2] text-white font-semibold px-8 py-3 rounded-lg shadow hover:bg-[#0d8ad1] transition"
          >
            {t("about.hero.cta")}
          </a>
        </ScrollReveal>
        <ScrollReveal className="flex-1 flex justify-center">
          <div className="w-full max-w-xl flex items-center justify-center">
            <Lottie animationData={sumenhLottie} loop={true} />
          </div>
        </ScrollReveal>
      </section>

      {/* Giá trị & Sứ mệnh */}
      <section className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScrollReveal>
            <ValueCard
              icon={
                <ShieldCheckIcon className="w-10 h-10 text-[#189ff2] mb-2" />
              }
              title={t("about.values.security.title")}
              desc={t("about.values.security.desc")}
            />
          </ScrollReveal>
          <ScrollReveal>
            <ValueCard
              icon={
                <CloudArrowUpIcon className="w-10 h-10 text-[#189ff2] mb-2" />
              }
              title={t("about.values.storage.title")}
              desc={t("about.values.storage.desc")}
            />
          </ScrollReveal>
          <ScrollReveal>
            <ValueCard
              icon={<UsersIcon className="w-10 h-10 text-[#189ff2] mb-2" />}
              title={t("about.values.team.title")}
              desc={t("about.values.team.desc")}
            />
          </ScrollReveal>
          <ScrollReveal>
            <ValueCard
              icon={<BoltIcon className="w-10 h-10 text-[#189ff2] mb-2" />}
              title={t("about.values.speed.title")}
              desc={t("about.values.speed.desc")}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* Hình ảnh/feature nổi bật */}
      <section className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 items-center">
        <ScrollReveal className="flex-1 flex justify-center">
          <div className="w-full h-56 md:h-72 bg-gradient-to-br from-[#e0f2fe] to-[#f7f8fa] rounded-2xl flex items-center justify-center shadow">
            <Lottie
              animationData={partnerLottie}
              loop={true}
              className="w-48 h-48 md:w-64 md:h-64"
            />
          </div>
        </ScrollReveal>
        <ScrollReveal className="flex-1">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {t("about.partner.title")}
          </h2>
          <ul className="space-y-3 text-gray-700 text-base">
            <li className="flex items-center gap-2">
              <FolderOpenIcon className="w-6 h-6 text-[#189ff2]" />
              {t("about.partner.feature_1")}
            </li>
            <li className="flex items-center gap-2">
              <LockClosedIcon className="w-6 h-6 text-[#189ff2]" />
              {t("about.partner.feature_2")}
            </li>
            <li className="flex items-center gap-2">
              <DevicePhoneMobileIcon className="w-6 h-6 text-[#189ff2]" />
              {t("about.partner.feature_3")}
            </li>
            <li className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-[#189ff2]" />
              {t("about.partner.feature_4")}
            </li>
            <li className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-[#189ff2]" />
              {t("about.partner.feature_5")}
            </li>
          </ul>
        </ScrollReveal>
      </section>

      {/* Số liệu/statistics */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScrollReveal>
            <StatCard
              value={t("about.stats.uptime.value")}
              label={t("about.stats.uptime.label")}
            />
          </ScrollReveal>
          <ScrollReveal>
            <StatCard
              value={t("about.stats.storage.value")}
              label={t("about.stats.storage.label")}
            />
          </ScrollReveal>
          <ScrollReveal>
            <StatCard
              value={t("about.stats.users.value")}
              label={t("about.stats.users.label")}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* Mục tiêu/cam kết */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <ScrollReveal>
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                {t("about.goals.title")}
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700 text-base mt-4">
                <li>✔️ {t("about.goals.item_1")}</li>
                <li>✔️ {t("about.goals.item_2")}</li>
                <li>✔️ {t("about.goals.item_3")}</li>
                <li>✔️ {t("about.goals.item_4")}</li>
                <li>✔️ {t("about.goals.item_5")}</li>
              </ul>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="w-48 h-48 bg-gradient-to-br from-[#e0f2fe] to-[#f7f8fa] rounded-2xl flex items-center justify-center shadow">
                <Lottie animationData={targetLottie} loop={true} />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Vision/định hướng */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <ScrollReveal>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            {t("about.vision.title")}
          </h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScrollReveal>
            <VisionCard
              title={t("about.vision.integration.title")}
              desc={t("about.vision.integration.desc")}
            />
          </ScrollReveal>
          <ScrollReveal>
            <VisionCard
              title={t("about.vision.ai.title")}
              desc={t("about.vision.ai.desc")}
            />
          </ScrollReveal>
          <ScrollReveal>
            <VisionCard
              title={t("about.vision.platform.title")}
              desc={t("about.vision.platform.desc")}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA cuối trang */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <ScrollReveal>
          <div className="bg-[#189ff2] rounded-2xl shadow-lg px-8 py-10 flex flex-col items-center w-full text-center">
            <h2 className="text-white font-bold text-2xl md:text-3xl mb-3">
              {t("about.cta.title")}
            </h2>
            <p className="text-white/90 mb-6 text-base md:text-lg">
              {t("about.cta.subtitle")}
            </p>
            <a
              href="/Login"
              className="bg-white text-[#189ff2] font-bold px-8 py-3 rounded-lg text-lg shadow hover:bg-gray-100 transition"
            >
              {t("about.cta.button")}
            </a>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}

function ValueCard({ icon, title, desc }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center h-full">
      {icon}
      <div className="font-semibold mt-2 mb-1 text-center">{title}</div>
      <div className="text-gray-600 text-sm text-center">{desc}</div>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center h-full">
      <div className="text-3xl md:text-4xl font-extrabold text-[#189ff2] mb-2">
        {value}
      </div>
      <div className="text-gray-700 text-base text-center font-semibold">
        {label}
      </div>
    </div>
  );
}

function VisionCard({ title, desc }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center h-full">
      <div className="font-bold text-lg mb-2 text-[#189ff2] text-center">
        {title}
      </div>
      <div className="text-gray-600 text-sm text-center">{desc}</div>
    </div>
  );
}
