"use client";
import React from "react";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import ScrollReveal from "@/shared/ui/ScrollReveal";
import useContactForm from "@/features/marketing/hooks/useContactForm";
import Button from "@/shared/ui/button";
export default function ContactSection() {
  const { t, form, loading, alert, handleSubmit, handleChange } =
    useContactForm();
  return (
    <div className="w-full min-h-screen bg-white pb-16">
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-8">
        <ScrollReveal>
          <h1 className="mb-4 text-center text-4xl font-bold text-brand md:text-5xl">
            {t("pages.contact.title")}
          </h1>
          <p className="mb-8 text-center text-lg text-gray-600">
            {t("pages.contact.subtitle")}
          </p>
        </ScrollReveal>
        <ScrollReveal>
          <div className="flex flex-col gap-8 md:flex-row">
            {/* Thông tin liên hệ */}
            <div className="mb-8 flex flex-1 flex-col justify-center rounded-2xl bg-white p-8 shadow-lg md:mb-0">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-brand">
                <GlobeAltIcon className="h-7 w-7 text-brand" />
                {t("pages.contact.contact_info")}
              </h2>
              <ul className="space-y-5 text-base text-gray-600">
                <li className="flex items-start gap-3">
                  <MapPinIcon className="mt-1 h-6 w-6 text-brand" />
                  <div>
                    <span className="font-semibold">
                      {t("pages.contact.address")}:
                    </span>
                    {""} 205 Bình Đức 5, Phường Bình Đức, An Giang
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <EnvelopeIcon className="mt-1 h-6 w-6 text-brand" />
                  <div>
                    <span className="font-semibold">
                      {t("pages.contact.email")}:
                    </span>
                    {""} contact-d2m@dammeviet.vn
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <PhoneIcon className="mt-1 h-6 w-6 text-brand" />
                  <div>
                    <span className="font-semibold">
                      {t("pages.contact.phone")}:
                    </span>
                    {""} +84 911 930 807
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <GlobeAltIcon className="mt-1 h-6 w-6 text-brand" />
                  <div>
                    <span className="font-semibold">
                      {t("pages.contact.fanpage")}:
                    </span>
                    {""}
                    <a
                      href="https://facebook.com/dichthuatdammeviet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand underline hover:text-brand-600"
                    >
                      facebook.com/dichthuatdammeviet
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <ChatBubbleLeftRightIcon className="mt-1 h-6 w-6 text-brand" />
                  <div>
                    <span className="font-semibold">
                      {t("pages.contact.whatsapp")}:
                    </span>
                    {""} +84 911 930 807
                  </div>
                </li>
              </ul>
            </div>
            {/* Form liên hệ */}
            <div className="flex-1 rounded-2xl bg-white p-8 shadow-lg">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-brand">
                <EnvelopeIcon className="h-7 w-7 text-brand" />
                {t("pages.contact.send_request")}
              </h2>
              {alert && (
                <div
                  className={`mb-4 rounded border px-4 py-3 text-base font-medium ${
                    alert.type === "success"
                      ? "border-success-200 bg-success-50 text-success-700"
                      : "border-danger-200 bg-danger-50 text-danger-700"
                  }`}
                >
                  {alert.msg}
                </div>
              )}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-1 block font-medium">
                    {t("pages.contact.full_name")}
                  </label>
                  <input
                    name="name"
                    type="text"
                    className="w-full rounded border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand"
                    placeholder={t("pages.contact.full_name_placeholder")}
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium">
                    {t("pages.contact.email")}
                  </label>
                  <input
                    name="email"
                    type="email"
                    className="w-full rounded border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand"
                    placeholder={t("pages.contact.email_placeholder")}
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium">
                    {t("pages.contact.support_content")}
                  </label>
                  <textarea
                    name="message"
                    rows={5}
                    className="w-full rounded border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand"
                    placeholder={t("pages.contact.support_content_placeholder")}
                    value={form.message}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Button
                  handleClick={handleSubmit}
                  loading={loading}
                  children={t("pages.contact.send_request_btn")}
                  disabled={loading}
                />
              </form>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
