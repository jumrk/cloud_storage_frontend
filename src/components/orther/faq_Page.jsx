"use client";
import React, { useState, useRef } from "react";
import { useTranslations } from "next-intl";

function Accordion({ q, a, open, onClick, contentId }) {
  const contentRef = useRef(null);
  return (
    <div className="border-b last:border-b-0">
      <button
        className={`w-full text-left py-4 px-2 flex justify-between items-center focus:outline-none transition-colors hover:bg-[#f3f6fa] rounded-lg ${
          open ? "bg-[#f3f6fa]" : "bg-transparent"
        }`}
        onClick={onClick}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <span className="font-medium text-gray-800 text-base md:text-lg">
          {q}
        </span>
        <span
          className={`ml-2 transition-transform duration-300 ${
            open ? "rotate-90" : "rotate-0"
          }`}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
            <path
              d="M7 8l3 3 3-3"
              stroke="#189ff2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <div
        id={contentId}
        ref={contentRef}
        style={{
          maxHeight: open ? contentRef.current?.scrollHeight : 0,
          opacity: open ? 1 : 0,
          transition: "max-height 0.4s cubic-bezier(.4,0,.2,1), opacity 0.3s",
        }}
        className="overflow-hidden bg-[#f8fafc] rounded-b-lg"
        aria-hidden={!open}
      >
        <div className="px-4 pb-4 pt-1 text-gray-600 text-base">{a}</div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const t = useTranslations();
  const [openIdx, setOpenIdx] = useState(null);

  // Lấy danh sách FAQ từ i18n
  const faqs = t.raw("pages.faq.faqs");

  return (
    <div className="w-full min-h-screen bg-[#f7f8fa] pb-16">
      <section className="max-w-2xl mx-auto px-4 pt-12 pb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#189ff2] mb-6 text-center">
          {t("pages.faq.title")}
        </h1>
        <div className="rounded-2xl shadow bg-white divide-y border border-gray-100">
          {faqs.map((item, idx) => (
            <Accordion
              key={item.q}
              q={item.q}
              a={item.a}
              open={openIdx === idx}
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              contentId={`faq-content-${idx}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
