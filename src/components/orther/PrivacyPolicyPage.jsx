"use client";
import { useRef } from "react";
import { useTranslations } from "next-intl";

export default function PrivacyPolicy() {
  const t = useTranslations();
  const refs = useRef({});

  // Lấy danh sách sections và content từ i18n
  const sections = t.raw("pages.privacy.sections");
  const content = t.raw("pages.privacy.content");

  const scrollToSection = (id) => {
    refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full min-h-screen bg-white pb-16">
      <div className="max-w-5xl mx-auto px-4 pt-10 flex flex-col md:flex-row gap-10">
        {/* Nội dung chính */}
        <main className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
            {t("pages.privacy.title")}
          </h1>
          <div className="text-gray-500 text-sm mb-6">
            {t("pages.privacy.last_updated")}
          </div>
          <div className="space-y-10 text-gray-800 text-base leading-relaxed">
            <section
              ref={(el) => (refs.current["introduction"] = el)}
              id="introduction"
            >
              <h2 className="text-xl font-semibold mb-2">
                {sections[0].label}
              </h2>
              <p>{content.introduction.p1}</p>
              <p>{content.introduction.p2}</p>
            </section>

            <section ref={(el) => (refs.current["collect"] = el)} id="collect">
              <h2 className="text-xl font-semibold mb-2">
                {sections[1].label}
              </h2>
              <p>{content.collect.p1}</p>
              <ul className="list-disc pl-6">
                {content.collect.list.map((item, index) => (
                  <li key={index}>
                    <a
                      href={`#${item
                        .toLowerCase()
                        .replace(/\s+/g, "")
                        .replace(/[()]/g, "")}`}
                      className="text-[#189ff2] hover:underline"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section
              ref={(el) => (refs.current["personal"] = el)}
              id="personal"
            >
              <h3 className="text-lg font-semibold mb-1">
                {sections[2].label}
              </h3>
              <p>{content.personal.p1}</p>
              <ul className="list-disc pl-6 mt-2">
                {content.personal.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="mt-2">
                <b>{t("pages.privacy.labels.real_example")}:</b>{" "}
                {content.personal.example}
              </p>
            </section>

            <section
              ref={(el) => (refs.current["nonpersonal"] = el)}
              id="nonpersonal"
            >
              <h3 className="text-lg font-semibold mb-1">
                {sections[3].label}
              </h3>
              <p>{content.nonpersonal.p1}</p>
              <ul className="list-disc pl-6 mt-2">
                {content.nonpersonal.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="mt-2">
                <b>{t("pages.privacy.labels.note")}:</b>{" "}
                {content.nonpersonal.note}
              </p>
            </section>

            <section ref={(el) => (refs.current["cookies"] = el)} id="cookies">
              <h3 className="text-lg font-semibold mb-1">
                {sections[4].label}
              </h3>
              <p>{content.cookies.p1}</p>
              <ul className="list-disc pl-6 mt-2">
                {content.cookies.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="mt-2">{content.cookies.p2}</p>
            </section>

            <section
              ref={(el) => (refs.current["googleapi"] = el)}
              id="googleapi"
            >
              <h3 className="text-lg font-semibold mb-1">
                {sections[5].label}
              </h3>
              <p>{content.googleapi.p1}</p>
              <ul className="list-disc pl-6 mt-2">
                {content.googleapi.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="mt-2">
                <b>{content.googleapi.commitment}</b>
              </p>
              <ul className="list-disc pl-6 mt-2">
                {content.googleapi.commitment_list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="mt-2">
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#189ff2] underline"
                >
                  {content.googleapi.policy_link}
                </a>
              </p>
            </section>

            <section ref={(el) => (refs.current["use"] = el)} id="use">
              <h2 className="text-xl font-semibold mb-2">
                {sections[6].label}
              </h2>
              <ul className="list-disc pl-6">
                {content.use.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="mt-2">
                <b>{t("pages.privacy.labels.example")}:</b>{" "}
                {content.use.example}
              </p>
            </section>

            <section ref={(el) => (refs.current["share"] = el)} id="share">
              <h2 className="text-xl font-semibold mb-2">
                {sections[7].label}
              </h2>
              <ul className="list-disc pl-6">
                {content.share.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="mt-2">
                <b>{t("pages.privacy.labels.example")}:</b>{" "}
                {content.share.example}
              </p>
            </section>

            <section ref={(el) => (refs.current["rights"] = el)} id="rights">
              <h2 className="text-xl font-semibold mb-2">
                {sections[8].label}
              </h2>
              <ul className="list-disc pl-6">
                {content.rights.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="mt-2">
                <b>{t("pages.privacy.labels.note")}:</b> {content.rights.note}
              </p>
            </section>

            <section
              ref={(el) => (refs.current["security"] = el)}
              id="security"
            >
              <h2 className="text-xl font-semibold mb-2">
                {sections[9].label}
              </h2>
              <ul className="list-disc pl-6">
                {content.security.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="mt-2">
                <b>{t("pages.privacy.labels.data_breach")}:</b>{" "}
                {content.security.breach}
              </p>
            </section>

            <section ref={(el) => (refs.current["storage"] = el)} id="storage">
              <h2 className="text-xl font-semibold mb-2">
                {sections[10].label}
              </h2>
              <ul className="list-disc pl-6">
                {content.storage.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="mt-2">
                <b>{t("pages.privacy.labels.example")}:</b>{" "}
                {content.storage.example}
              </p>
            </section>

            <section ref={(el) => (refs.current["changes"] = el)} id="changes">
              <h2 className="text-xl font-semibold mb-2">
                {sections[11].label}
              </h2>
              <p>{content.changes.p1}</p>
            </section>

            <section ref={(el) => (refs.current["contact"] = el)} id="contact">
              <h2 className="text-xl font-semibold mb-2">
                {sections[12].label}
              </h2>
              <p>{content.contact.p1}</p>
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
