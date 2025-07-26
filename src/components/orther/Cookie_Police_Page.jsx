"use client";
import { useRef } from "react";
import { useTranslations } from "next-intl";

export default function CookiePolicy() {
  const t = useTranslations();
  const refs = useRef({});

  // Lấy danh sách sections và content từ i18n
  const sections = t.raw("pages.cookie.sections");
  const content = t.raw("pages.cookie.content");

  const scrollToSection = (id) => {
    refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full min-h-screen bg-white pb-16">
      <div className="max-w-5xl mx-auto px-4 pt-10 flex flex-col md:flex-row gap-10">
        {/* Nội dung chính */}
        <main className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
            {t("pages.cookie.title")}
          </h1>
          <div className="text-gray-500 text-sm mb-6">
            {t("pages.cookie.last_updated")}
          </div>
          <div className="space-y-10 text-gray-800 text-base leading-relaxed">
            <section ref={(el) => (refs.current["intro"] = el)} id="intro">
              <h2 className="text-xl font-semibold mb-2">
                {sections[0].label}
              </h2>
              <p>{content.intro.p1}</p>
            </section>
            <section ref={(el) => (refs.current["what"] = el)} id="what">
              <h2 className="text-xl font-semibold mb-2">
                {sections[1].label}
              </h2>
              <p>{content.what.p1}</p>
            </section>
            <section ref={(el) => (refs.current["types"] = el)} id="types">
              <h2 className="text-xl font-semibold mb-2">
                {sections[2].label}
              </h2>
              <ul className="list-disc pl-6">
                {content.types.list.map((item, index) => (
                  <li key={index}>
                    <b>{item.title}</b> {item.desc}
                  </li>
                ))}
              </ul>
            </section>
            <section ref={(el) => (refs.current["purpose"] = el)} id="purpose">
              <h2 className="text-xl font-semibold mb-2">
                {sections[3].label}
              </h2>
              <ul className="list-disc pl-6">
                {content.purpose.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
            <section ref={(el) => (refs.current["manage"] = el)} id="manage">
              <h2 className="text-xl font-semibold mb-2">
                {sections[4].label}
              </h2>
              <p>{content.manage.p1}</p>
              <ul className="list-disc pl-6 mt-2">
                {content.manage.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
            <section ref={(el) => (refs.current["rights"] = el)} id="rights">
              <h2 className="text-xl font-semibold mb-2">
                {sections[5].label}
              </h2>
              <ul className="list-disc pl-6">
                {content.rights.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
            <section ref={(el) => (refs.current["changes"] = el)} id="changes">
              <h2 className="text-xl font-semibold mb-2">
                {sections[6].label}
              </h2>
              <p>{content.changes.p1}</p>
            </section>
            <section ref={(el) => (refs.current["contact"] = el)} id="contact">
              <h2 className="text-xl font-semibold mb-2">
                {sections[7].label}
              </h2>
              <ul className="list-disc pl-6 mt-2">
                {content.contact.list.map((item, index) => (
                  <li key={index}>
                    {item.includes("Email:") ? (
                      <>
                        Email:{" "}
                        <a
                          href="mailto:contact-d2m@dammeviet.vn"
                          className="text-[#189ff2] underline"
                        >
                          contact-d2m@dammeviet.vn
                        </a>
                      </>
                    ) : item.includes("Hotline:") ? (
                      <>
                        Hotline:{" "}
                        <a
                          href="tel:+84911930807"
                          className="text-[#189ff2] underline"
                        >
                          +84 911 930 807
                        </a>
                      </>
                    ) : (
                      item
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-2">{content.contact.response}</p>
            </section>
          </div>
        </main>
        {/* Mục lục bên phải */}
        <aside className="hidden md:block w-64 flex-shrink-0 pt-2">
          <div className="sticky top-24 bg-white rounded-xl border border-gray-100 shadow p-4">
            <div className="font-bold text-gray-700 mb-2 text-base">
              {t("pages.table_of_contents")}
            </div>
            <ul className="space-y-2 text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    className="text-left text-[#189ff2] hover:underline focus:outline-none"
                    onClick={() => scrollToSection(s.id)}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
