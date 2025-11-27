"use client";
import { useRef } from "react";
import { useTranslations } from "next-intl";

export default function CookiePolicySection() {
  const t = useTranslations();
  const refs = useRef({});

  const sections = t.raw("pages.cookie.sections");
  const content = t.raw("pages.cookie.content");

  const scrollToSection = (id) => {
    refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full min-h-screen bg-surface-50 pb-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pt-10 md:flex-row">
        <main className="min-w-0 flex-1">
          <h1 className="mb-2 text-3xl font-bold text-text-strong md:text-4xl">
            {t("pages.cookie.title")}
          </h1>
          <div className="mb-6 text-sm text-text-muted">
            {t("pages.cookie.last_updated")}
          </div>

          <div className="space-y-10 text-base leading-relaxed text-text-muted">
            <section ref={(el) => (refs.current["intro"] = el)} id="intro">
              <h2 className="mb-2 text-xl font-semibold text-text-strong">
                {sections[0].label}
              </h2>
              <p>{content.intro.p1}</p>
            </section>

            <section ref={(el) => (refs.current["what"] = el)} id="what">
              <h2 className="mb-2 text-xl font-semibold text-text-strong">
                {sections[1].label}
              </h2>
              <p>{content.what.p1}</p>
            </section>

            <section ref={(el) => (refs.current["types"] = el)} id="types">
              <h2 className="mb-2 text-xl font-semibold text-text-strong">
                {sections[2].label}
              </h2>
              <ul className="list-disc pl-6">
                {content.types.list.map((item, index) => (
                  <li key={index}>
                    <b className="text-text-strong">{item.title}</b> {item.desc}
                  </li>
                ))}
              </ul>
            </section>

            <section ref={(el) => (refs.current["purpose"] = el)} id="purpose">
              <h2 className="mb-2 text-xl font-semibold text-text-strong">
                {sections[3].label}
              </h2>
              <ul className="list-disc pl-6">
                {content.purpose.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section ref={(el) => (refs.current["manage"] = el)} id="manage">
              <h2 className="mb-2 text-xl font-semibold text-text-strong">
                {sections[4].label}
              </h2>
              <p>{content.manage.p1}</p>
              <ul className="mt-2 list-disc pl-6">
                {content.manage.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section ref={(el) => (refs.current["rights"] = el)} id="rights">
              <h2 className="mb-2 text-xl font-semibold text-text-strong">
                {sections[5].label}
              </h2>
              <ul className="list-disc pl-6">
                {content.rights.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section ref={(el) => (refs.current["changes"] = el)} id="changes">
              <h2 className="mb-2 text-xl font-semibold text-text-strong">
                {sections[6].label}
              </h2>
              <p>{content.changes.p1}</p>
            </section>

            <section ref={(el) => (refs.current["contact"] = el)} id="contact">
              <h2 className="mb-2 text-xl font-semibold text-text-strong">
                {sections[7].label}
              </h2>
              <ul className="mt-2 list-disc pl-6">
                {content.contact.list.map((item, index) => (
                  <li key={index}>
                    {item.includes("Email:") ? (
                      <>
                        Email:{" "}
                        <a
                          href="mailto:contact-d2m@dammeviet.vn"
                          className="text-brand underline hover:text-brand-600"
                        >
                          contact-d2m@dammeviet.vn
                        </a>
                      </>
                    ) : item.includes("Hotline:") ? (
                      <>
                        Hotline:{" "}
                        <a
                          href="tel:+84911930807"
                          className="text-brand underline hover:text-brand-600"
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

        <aside className="hidden w-64 flex-shrink-0 pt-2 md:block">
          <div className="sticky top-24 rounded-xl border border-border bg-white p-4 shadow">
            <div className="mb-2 text-base font-bold text-text-strong">
              {t("pages.table_of_contents")}
            </div>
            <ul className="space-y-2 text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    className="text-left text-brand hover:underline focus:outline-none"
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
