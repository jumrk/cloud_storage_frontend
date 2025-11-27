"use client";
import React, { useState, useRef } from "react";
import { useTranslations } from "next-intl";

function Accordion({ q, a, open, onClick, contentId }) {
  const contentRef = useRef(null);
  return (
    <div className="border-b last:border-b-0 border-border">
      <button
        className={`w-full text-left py-4 px-2 flex justify-between items-center focus:outline-none transition-colors rounded-lg ${
          open ? "bg-surface-50" : "hover:bg-surface-50"
        }`}
        onClick={onClick}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <span className="font-medium text-text-strong text-base md:text-lg">
          {q}
        </span>
        <span
          className={`ml-2 text-brand transition-transform duration-300 ${
            open ? "rotate-90" : "rotate-0"
          }`}
          aria-hidden="true"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
            <path
              d="M7 8l3 3 3-3"
              stroke="currentColor"
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
        className="overflow-hidden rounded-b-lg bg-surface-50"
        aria-hidden={!open}
      >
        <div className="px-4 pb-4 pt-1 text-base text-text-muted">{a}</div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const t = useTranslations();
  const [openIdx, setOpenIdx] = useState(null);
  const faqs = t.raw("pages.faq.faqs");

  return (
    <div className="w-full min-h-screen bg-surface-50 pb-16">
      <section className="mx-auto max-w-2xl px-4 pt-12 pb-8">
        <h1 className="mb-6 text-center text-3xl font-bold text-brand md:text-4xl">
          {t("pages.faq.title")}
        </h1>
        <div className="divide-y rounded-2xl border border-border bg-white shadow">
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
