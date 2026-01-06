"use client";
import { useRef } from "react";
import { useTranslations } from "next-intl";
export default function TermsSection() {
  const t = useTranslations();
  const refs = useRef({});
  const sections = t.raw("pages.terms.sections");
  const content = t.raw("pages.terms.content");
  const scrollToSection = (id) => {
    refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="w-full min-h-screen bg-white pb-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pt-10 md:flex-row">
        <main className="min-w-0 flex-1">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
            {t("pages.terms.title")}
          </h1>
          <div className="mb-6 text-sm text-gray-600">
            {t("pages.terms.last_updated")}
          </div>
          <div className="space-y-10 text-base leading-relaxed text-gray-600">
            <section ref={(el) => (refs.current["intro"] = el)} id="intro">
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {sections[0].label}
              </h2>
              <p>{content.intro.p1}</p> <p>{content.intro.p2}</p>
            </section>
            <section
              ref={(el) => (refs.current["register"] = el)}
              id="register"
            >
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {sections[1].label}
              </h2>
              <ul className="list-disc pl-6">
                {content.register.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="mt-2">
                <b>{t("pages.terms.labels.example")}</b>
                {""} {content.register.example}
              </p>
            </section>
            <section
              ref={(el) => (refs.current["googleauth"] = el)}
              id="googleauth"
            >
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {sections[2].label}
              </h2>
              <ul className="list-disc pl-6">
                {content.googleauth.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
            <section ref={(el) => (refs.current["data"] = el)} id="data">
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {sections[3].label}
              </h2>
              <ul className="list-disc pl-6">
                {content.data.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
            <section
              ref={(el) => (refs.current["user_rights"] = el)}
              id="user_rights"
            >
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {sections[4].label}
              </h2>
              <ul className="list-disc pl-6">
                <li>
                  <b>{t("pages.terms.labels.rights")}</b>
                  {""} {content.user_rights.rights}
                </li>
                <li>
                  <b>{t("pages.terms.labels.obligations")}</b>
                  {""} {content.user_rights.obligations}
                </li>
                <li>
                  <b>{t("pages.terms.labels.limitations")}</b>
                  {""} {content.user_rights.limitations}
                </li>
              </ul>
            </section>
            <section
              ref={(el) => (refs.current["provider_rights"] = el)}
              id="provider_rights"
            >
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {sections[5].label}
              </h2>
              <ul className="list-disc pl-6">
                <li>
                  <b>{t("pages.terms.labels.rights")}</b>
                  {""} {content.provider_rights.rights}
                </li>
                <li>
                  <b>{t("pages.terms.labels.responsibilities")}</b>
                  {""} {content.provider_rights.responsibilities}
                </li>
                <li>
                  <b>{t("pages.terms.labels.limitations")}</b>
                  {""} {content.provider_rights.limitations}
                </li>
              </ul>
            </section>
            <section ref={(el) => (refs.current["payment"] = el)} id="payment">
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {sections[6].label}
              </h2>
              <ul className="list-disc pl-6">
                {content.payment.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
            <section ref={(el) => (refs.current["suspend"] = el)} id="suspend">
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {sections[7].label}
              </h2>
              <ul className="list-disc pl-6">
                <li>
                  <b>{t("pages.terms.labels.suspend")}</b>
                  {""} {content.suspend.suspend}
                </li>
                <li>
                  <b>{t("pages.terms.labels.terminate")}</b>
                  {""} {content.suspend.terminate}
                </li>
                <li>{content.suspend.data_deletion}</li>
                <li>{content.suspend.export}</li>
              </ul>
            </section>
            <section
              ref={(el) => (refs.current["liability"] = el)}
              id="liability"
            >
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {sections[8].label}
              </h2>
              <ul className="list-disc pl-6">
                {content.liability.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
            <section ref={(el) => (refs.current["changes"] = el)} id="changes">
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {sections[9].label}
              </h2>
              <ul className="list-disc pl-6">
                {content.changes.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
            <section ref={(el) => (refs.current["contact"] = el)} id="contact">
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {sections[10].label}
              </h2>
              <p>{content.contact.p1}</p>
              <ul className="mt-2 list-disc pl-6">
                {content.contact.list.map((item, index) => (
                  <li key={index}>
                    {item.includes("Email:") ? (
                      <>
                        Email:{""}
                        <a
                          href="mailto:contact-d2m@dammeviet.vn"
                          className="text-brand underline hover:text-brand-600"
                        >
                          contact-d2m@dammeviet.vn
                        </a>
                      </>
                    ) : item.includes("Phone:") ||
                      item.includes("Điện thoại:") ? (
                      <>
                        {item.includes("Phone:")
                          ? "Phone:"
                          : t("pages.terms.labels.phone")}
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
              <p className="mt-4">{content.contact.effective}</p>
            </section>
          </div>
        </main>
        <aside className="w-64 flex-shrink-0">
          <div className="sticky top-4 rounded-xl border border-gray-200 bg-white p-4 shadow">
            <h3 className="mb-4 font-semibold text-gray-900">
              {t("pages.table_of_contents")}
            </h3>
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="block w-full py-1 text-left text-sm text-gray-600 transition-colors hover:text-brand"
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}
