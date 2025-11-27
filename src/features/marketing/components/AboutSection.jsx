"use client";
import React from "react";
import {
  ShieldCheckIcon,
  CloudArrowUpIcon,
  UsersIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  LockClosedIcon,
  FolderOpenIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";
import Lottie from "lottie-react";
import partnerLottie from "@/assets/animation/partner.json";
import sumenhLottie from "@/assets/animation/sumenh.json";
import targetLottie from "@/assets/animation/Target.json";
import { useTranslations } from "next-intl";
import ScrollReveal from "@/shared/ui/ScrollReveal";

export default function AboutSection() {
  const t = useTranslations();

  return (
    <div className="w-full min-h-screen bg-surface-50 pb-16">
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 pt-12 pb-8 md:flex-row">
        <ScrollReveal className="flex-1">
          <h1 className="mb-6 text-4xl font-bold leading-tight text-text-strong md:text-6xl">
            {t("about.hero.title")}
            <span className="text-brand">D2MBox</span>
          </h1>
          <p className="mb-8 max-w-xl text-lg text-text-muted">
            {t("about.hero.subtitle")}
          </p>
          <a
            href="/login"
            className="inline-block rounded-lg bg-brand px-8 py-3 font-semibold text-surface-50 shadow transition hover:bg-brand-600"
          >
            {t("about.hero.cta")}
          </a>
        </ScrollReveal>

        <ScrollReveal className="flex flex-1 justify-center">
          <div className="flex w-full max-w-xl items-center justify-center">
            <Lottie animationData={sumenhLottie} loop />
          </div>
        </ScrollReveal>
      </section>

      {/* Giá trị & Sứ mệnh */}
      <section className="mx-auto flex max-w-6xl items-center gap-8 px-4 py-8 md:flex-row">
        <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-2">
          <ScrollReveal>
            <ValueCard
              icon={<ShieldCheckIcon className="mb-2 h-10 w-10 text-brand" />}
              title={t("about.values.security.title")}
              desc={t("about.values.security.desc")}
            />
          </ScrollReveal>
          <ScrollReveal>
            <ValueCard
              icon={<CloudArrowUpIcon className="mb-2 h-10 w-10 text-brand" />}
              title={t("about.values.storage.title")}
              desc={t("about.values.storage.desc")}
            />
          </ScrollReveal>
          <ScrollReveal>
            <ValueCard
              icon={<UsersIcon className="mb-2 h-10 w-10 text-brand" />}
              title={t("about.values.team.title")}
              desc={t("about.values.team.desc")}
            />
          </ScrollReveal>
          <ScrollReveal>
            <ValueCard
              icon={<BoltIcon className="mb-2 h-10 w-10 text-brand" />}
              title={t("about.values.speed.title")}
              desc={t("about.values.speed.desc")}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* Hình ảnh/feature nổi bật */}
      <section className="mx-auto flex max-w-6xl items-center gap-8 px-4 py-8 md:flex-row">
        <ScrollReveal className="flex flex-1 justify-center">
          <div className="flex h-56 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-surface-50 shadow md:h-72">
            <Lottie
              animationData={partnerLottie}
              loop
              className="h-48 w-48 md:h-64 md:w-64"
            />
          </div>
        </ScrollReveal>

        <ScrollReveal className="flex-1">
          <h2 className="mb-4 text-2xl font-bold text-text-strong md:text-3xl">
            {t("about.partner.title")}
          </h2>
          <ul className="space-y-3 text-base text-text-muted">
            <li className="flex items-center gap-2">
              <FolderOpenIcon className="h-6 w-6 text-brand" />
              {t("about.partner.feature_1")}
            </li>
            <li className="flex items-center gap-2">
              <LockClosedIcon className="h-6 w-6 text-brand" />
              {t("about.partner.feature_2")}
            </li>
            <li className="flex items-center gap-2">
              <DevicePhoneMobileIcon className="h-6 w-6 text-brand" />
              {t("about.partner.feature_3")}
            </li>
            <li className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-brand" />
              {t("about.partner.feature_4")}
            </li>
            <li className="flex items-center gap-2">
              <SparklesIcon className="h-6 w-6 text-brand" />
              {t("about.partner.feature_5")}
            </li>
          </ul>
        </ScrollReveal>
      </section>

      {/* Số liệu/statistics */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
      <section className="mx-auto max-w-5xl px-4 py-8">
        <ScrollReveal>
          <div className="flex w-full flex-col items-center gap-8 rounded-2xl bg-white p-8 shadow-lg md:flex-row">
            <div className="flex-1">
              <h3 className="mb-2 text-xl font-bold text-text-strong md:text-2xl">
                {t("about.goals.title")}
              </h3>
              <ul className="mt-4 grid grid-cols-1 gap-3 text-base text-text-muted md:grid-cols-2">
                <li>✔️ {t("about.goals.item_1")}</li>
                <li>✔️ {t("about.goals.item_2")}</li>
                <li>✔️ {t("about.goals.item_3")}</li>
                <li>✔️ {t("about.goals.item_4")}</li>
                <li>✔️ {t("about.goals.item_5")}</li>
              </ul>
            </div>
            <div className="flex flex-1 justify-center">
              <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-surface-50 shadow">
                <Lottie animationData={targetLottie} loop />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Vision/định hướng */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <ScrollReveal>
          <h2 className="mb-8 text-center text-2xl font-bold text-text-strong md:text-3xl">
            {t("about.vision.title")}
          </h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
      <section className="mx-auto max-w-4xl px-4 py-8">
        <ScrollReveal>
          <div className="w-full rounded-2xl bg-brand px-8 py-10 text-center shadow-lg">
            <h2 className="mb-3 text-2xl font-bold text-surface-50 md:text-3xl">
              {t("about.cta.title")}
            </h2>
            <p className="mb-6 text-base text-surface-50/90 md:text-lg">
              {t("about.cta.subtitle")}
            </p>
            <a
              href="/login"
              className="rounded-lg bg-white px-8 py-3 text-lg font-bold text-brand shadow transition hover:bg-surface-50"
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
    <div className="flex h-full flex-col items-center rounded-xl bg-white p-6 shadow">
      {icon}
      <div className="mt-2 mb-1 text-center font-semibold text-text-strong">
        {title}
      </div>
      <div className="text-center text-sm text-text-muted">{desc}</div>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="flex h-full flex-col items-center rounded-xl bg-white p-8 shadow">
      <div className="mb-2 text-3xl font-extrabold text-brand md:text-4xl">
        {value}
      </div>
      <div className="text-center text-base font-semibold text-text-muted">
        {label}
      </div>
    </div>
  );
}

function VisionCard({ title, desc }) {
  return (
    <div className="flex h-full flex-col items-center rounded-xl bg-white p-6 shadow">
      <div className="mb-2 text-center text-lg font-bold text-brand">
        {title}
      </div>
      <div className="text-center text-sm text-text-muted">{desc}</div>
    </div>
  );
}
