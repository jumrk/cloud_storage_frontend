import React from "react";
import { useTranslations } from "next-intl";

function Footer() {
  const t = useTranslations();
  return (
    <footer className="bg-[#181b20] text-gray-300 pt-10 pb-6 px-2 md:px-0">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col  md:flex-row md:justify-between md:items-start gap-8 md:gap-12">
          {/* Cột trái: Logo + Info + Social */}
          <div className="md:w-1/3 flex flex-col items-center md:items-start gap-4 mb-6 md:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <img src="/images/Logo_2.png" alt="D2MBox" className="w-40 " />
            </div>
            <div className="text-white font-semibold text-base ">
              {t("footer.tagline")}
            </div>
            <div className="text-gray-400 text-sm ">
              {t("footer.description")}
            </div>
            <div className="text-gray-500 text-xs ">
              {t("footer.copyright")}
            </div>
            <div className="text-white font-semibold text-sm mb-2">
              {t("footer.follow_us")}
            </div>
            <div className="flex gap-3">
              {/* Social icons, giữ đều, bo tròn, nền xám đậm */}
              <a
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#23262b] hover:bg-[#189ff2] text-gray-300 hover:text-white transition"
                aria-label="facebook"
              >
                {/* Simple SVG icons, replace with your own if needed */}
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                >
                  <path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0" />
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#23262b] hover:bg-[#189ff2] text-gray-300 hover:text-white transition"
                aria-label="instagram"
              >
                {/* Simple SVG icons, replace with your own if needed */}
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.618 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.069-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#23262b] hover:bg-[#189ff2] text-gray-300 hover:text-white transition"
                aria-label="x"
              >
                {/* Simple SVG icons, replace with your own if needed */}
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                >
                  <path d="M17.53 2.47a.75.75 0 0 1 1.06 1.06L13.06 9l5.53 5.47a.75.75 0 1 1-1.06 1.06L12 10.06l-5.47 5.47a.75.75 0 1 1-1.06-1.06L10.94 9 5.47 3.53A.75.75 0 1 1 6.53 2.47L12 7.94l5.53-5.47z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#23262b] hover:bg-[#189ff2] text-gray-300 hover:text-white transition"
                aria-label="linkedin"
              >
                {/* Simple SVG icons, replace with your own if needed */}
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                >
                  <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.25c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 11.25h-3v-5.5c0-1.104-.896-2-2-2s-2 .896-2 2v5.5h-3v-10h3v1.354c.627-.927 1.761-1.354 2.5-1.354 1.933 0 3.5 1.567 3.5 3.5v6.5zm-7-10h-3v-10h3v10z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#23262b] hover:bg-[#189ff2] text-gray-300 hover:text-white transition"
                aria-label="youtube"
              >
                {/* Simple SVG icons, replace with your own if needed */}
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                >
                  <path d="M23.498 6.186a2.994 2.994 0 0 0-2.112-2.112C19.545 3.5 12 3.5 12 3.5s-7.545 0-9.386.574a2.994 2.994 0 0 0-2.112 2.112C0 8.027 0 12 0 12s0 3.973.502 5.814a2.994 2.994 0 0 0 2.112 2.112C4.455 20.5 12 20.5 12 20.5s7.545 0 9.386-.574a2.994 2.994 0 0 0 2.112-2.112C24 15.973 24 12 24 12s0-3.973-.502-5.814zM9.545 15.568V8.432l6.545 3.568-6.545 3.568z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#23262b] hover:bg-[#189ff2] text-gray-300 hover:text-white transition"
                aria-label="tiktok"
              >
                {/* Simple SVG icons, replace with your own if needed */}
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                >
                  <path d="M12.75 2v12.25a3.25 3.25 0 1 1-3.25-3.25h1.5a1.75 1.75 0 1 0 1.75 1.75V2h2.5a5.5 5.5 0 0 0 5.5 5.5v2A7.5 7.5 0 0 1 14.25 2h-1.5z" />
                </svg>
              </a>
            </div>
          </div>
          {/* Cột phải: các link page */}
          <div className=" flex flex-col md:flex-row gap-8 md:gap-12 justify-between items-center md:items-start">
            <div>
              <div className="text-white font-semibold text-sm mb-3">
                D2MBox
              </div>
              <ul className="space-y-1 text-sm">
                <li>
                  <a href="/about" className="hover:text-[#189ff2] transition">
                    {t("footer.about")}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-white font-semibold text-sm mb-3">
                {t("footer.support_title")}
              </div>
              <ul className="space-y-1 text-sm">
                <li>
                  <a
                    href="/contact"
                    className="hover:text-[#189ff2] transition"
                  >
                    {t("footer.support")}
                  </a>
                </li>
                <li>
                  <a href="/faq" className="hover:text-[#189ff2] transition">
                    {t("footer.faq")}
                  </a>
                </li>
              </ul>
              <div className="mt-10">
                <div className="text-white font-semibold text-sm mb-3">
                  {t("footer.policy_title")}
                </div>
                <ul className="space-y-1 text-sm">
                  <li>
                    <a
                      href="/privacy_policy"
                      className="hover:text-[#189ff2] transition"
                    >
                      {t("footer.privacy")}
                    </a>
                  </li>
                  <li>
                    <a
                      href="/terms_of_use"
                      className="hover:text-[#189ff2] transition"
                    >
                      {t("footer.terms")}
                    </a>
                  </li>
                  <li>
                    {" "}
                    <a
                      href="/cookie_policy"
                      className="hover:text-[#189ff2] transition"
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
