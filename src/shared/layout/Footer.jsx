import React from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

function Footer() {
  const t = useTranslations();
  return (
    <footer className="bg-[#181b20] text-gray-300 px-2 pt-10 pb-6 md:px-0">
      <div className="mx-auto max-w-screen-xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-12">
          <div className="mb-6 flex flex-col items-center gap-4 md:mb-0 md:w-1/3 md:items-start">
            <div className="mb-2 flex items-center gap-2">
              <Image
                src="/images/Logo_white.png"
                alt="D2MBox"
                width={160}
                height={40}
                placeholder="blur"
                blurDataURL="data:image/png;base64,..."
                priority
              />
            </div>
            <div className="text-gray text-sm">{t("footer.description")}</div>
            <div className="text-gray text-xs">{t("footer.copyright")}</div>

            <div className="text-gray-300 mb-2 text-sm font-semibold">
              {t("footer.follow_us")}
            </div>
            <div className="flex gap-3">
              <a
                href="#"
                aria-label="facebook"
                className="bg-primary/70 hover:bg-accent text-gray-300 hover:text-gray-300 flex h-9 w-9 items-center justify-center rounded-lg transition"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.14 8.44 9.94v-7.03H7.9v-2.91h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.62.77-1.62 1.56v1.87h2.76l-.44 2.91h-2.32V22c4.78-.8 8.44-4.94 8.44-9.94z" />
                </svg>
              </a>

              <a
                href="#"
                aria-label="instagram"
                className="bg-primary/70 hover:bg-accent text-gray-300 hover:text-gray-300 flex h-9 w-9 items-center justify-center rounded-lg transition"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2.2c3.26 0 3.65.01 4.93.07 1.27.06 2.13.27 2.88.58.78.31 1.44.74 2.06 1.36.62.62 1.05 1.28 1.36 2.06.31.75.52 1.61.58 2.88.06 1.28.07 1.67.07 4.93s-.01 3.65-.07 4.93c-.06 1.27-.27 2.13-.58 2.88-.31.78-.74 1.44-1.36 2.06a5.2 5.2 0 0 1-2.06 1.36c-.75.31-1.61.52-2.88.58-1.28.06-1.67.07-4.93.07s-3.65-.01-4.93-.07c-1.27-.06-2.13-.27-2.88-.58A5.2 5.2 0 0 1 2.21 21.9 5.2 5.2 0 0 1 .85 19.84c-.31-.75-.52-1.61-.58-2.88C.21 15.68.2 15.29.2 12.03s.01-3.65.07-4.93c.06-1.27.27-2.13.58-2.88.31-.78.74-1.44 1.36-2.06A5.2 5.2 0 0 1 4.27.85c.75-.31 1.61-.52 2.88-.58C8.43.21 8.82.2 12 .2Zm0 2.1c-3.18 0-3.55.01-4.8.07-1.16.05-1.79.24-2.21.4-.56.22-.96.48-1.38.9-.42.42-.68.82-.9 1.38-.16.42-.35 1.05-.4 2.21-.06 1.25-.07 1.62-.07 4.8s.01 3.55.07 4.8c.05 1.16.24 1.79.4 2.21.22.56.48.96.9 1.38.42.42.82.68 1.38.9.42.16 1.05.35 2.21.4 1.25.06 1.62.07 4.8.07s3.55-.01 4.8-.07c1.16-.05 1.79-.24 2.21-.4.56-.22.96-.48 1.38-.9.42-.42.68-.82.9-1.38.16-.42.35-1.05.4-2.21.06-1.25.07-1.62.07-4.8s-.01-3.55-.07-4.8c-.05-1.16-.24-1.79-.4-2.21-.22-.56-.48-.96-.9-1.38a3.4 3.4 0 0 0-1.38-.9c-.42-.16-1.05-.35-2.21-.4-1.25-.06-1.62-.07-4.8-.07Zm0 3.9a6.9 6.9 0 1 1 0 13.8 6.9 6.9 0 0 1 0-13.8Zm0 2.1a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Zm6.5-3.35a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
                </svg>
              </a>

              <a
                href="#"
                aria-label="x"
                className="bg-primary/70 hover:bg-accent text-gray-300 hover:text-gray-300 flex h-9 w-9 items-center justify-center rounded-lg transition"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M3 3h3l6 7 6-7h3l-7.5 9L21 21h-3l-6-7.2L6 21H3l7.5-9L3 3z" />
                </svg>
              </a>

              <a
                href="#"
                aria-label="linkedin"
                className="bg-primary/70 hover:bg-accent text-gray-300 hover:text-gray-300 flex h-9 w-9 items-center justify-center rounded-lg transition"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v15H0zM9 8h4.8v2.05h.07C14.67 8.9 16.3 8 18.5 8 23 8 24 10.96 24 15.2V23H19v-6.6c0-1.58-.03-3.62-2.2-3.62-2.2 0-2.54 1.72-2.54 3.5V23H9z" />
                </svg>
              </a>

              <a
                href="#"
                aria-label="youtube"
                className="bg-primary/70 hover:bg-accent text-gray-300 hover:text-gray-300 flex h-9 w-9 items-center justify-center rounded-lg transition"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 16 24 12 24 12s0-4-.5-5.8zM9.5 15.6V8.4L16 12l-6.5 3.6z" />
                </svg>
              </a>

              <a
                href="#"
                aria-label="tiktok"
                className="bg-primary/70 hover:bg-accent text-gray-300 hover:text-gray-300 flex h-9 w-9 items-center justify-center rounded-lg transition"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12.75 2v7.2a5.7 5.7 0 1 1-5.7 5.7h2.5a3.2 3.2 0 1 0 3.2-3.2V2h2.6A5.5 5.5 0 0 0 22 7.5v2A7.5 7.5 0 0 1 14.25 2h-1.5z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-8 md:flex-row md:items-start md:gap-12">
            <div>
              <div className="text-gray-300 mb-3 text-sm font-semibold">
                D2MBox
              </div>
              <ul className="text-sm space-y-1">
                <li>
                  <a href="/about" className="hover:text-accent transition">
                    {t("footer.about")}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-gray-300 mb-3 text-sm font-semibold">
                {t("footer.support_title")}
              </div>
              <ul className="text-sm space-y-1">
                <li>
                  <a href="/contact" className="hover:text-accent transition">
                    {t("footer.support")}
                  </a>
                </li>
                <li>
                  <a href="/faq" className="hover:text-accent transition">
                    {t("footer.faq")}
                  </a>
                </li>
              </ul>

              <div className="mt-10">
                <div className="text-gray-300 mb-3 text-sm font-semibold">
                  {t("footer.policy_title")}
                </div>
                <ul className="text-sm space-y-1">
                  <li>
                    <a
                      href="/privacy_policy"
                      className="hover:text-accent transition"
                    >
                      {t("footer.privacy")}
                    </a>
                  </li>
                  <li>
                    <a
                      href="/terms_of_use"
                      className="hover:text-accent transition"
                    >
                      {t("footer.terms")}
                    </a>
                  </li>
                  <li>
                    <a
                      href="/cookie_policy"
                      className="hover:text-accent transition"
                    >
                      {t("footer.cookie")}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
