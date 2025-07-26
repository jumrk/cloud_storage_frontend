"use client";
import React from "react";
import InputCustom from "../ui/input_custom";
import Button_custom from "../ui/Button_custom";
import useLoginForm from "@/hook/useLoginForm";
import ScrollReveal from "../ui/ScrollReveal";
import Link from "next/link";
import Loader from "../ui/Loader";
import { useTranslations } from "next-intl";

function Login_component() {
  const { errors, handelSubmit, formData, loading, handelChange } =
    useLoginForm();
  const t = useTranslations();

  if (loading) return <Loader />;
  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="w-[80%] grid grid-cols-1 lg:grid-cols-2 gap-2 h-1/2 lg:w-[60%]">
        <div className="flex flex-col justify-center md:mb-20">
          <ScrollReveal direction="down">
            <h1 className="text-3xl lg:text-4xl font-bold text-primary">
              {t("auth.login.welcome_back")}👋
            </h1>
            <p className="text-sx lg:text-xl text-primary/60">
              {t("auth.login.description")}
            </p>
          </ScrollReveal>

          <ScrollReveal direction="left">
            <InputCustom
              handelChange={handelChange}
              label={t("auth.login.email")}
              type="email"
              value={formData.email}
              name="email"
              id="Email"
              placeholder={t("auth.login.email_placeholder")}
              errors={errors.email}
            />
          </ScrollReveal>

          <ScrollReveal direction="right">
            <InputCustom
              handelChange={handelChange}
              label={t("auth.login.password")}
              id="Password"
              name="password"
              value={formData.password}
              type={"password"}
              errors={errors.password}
              placeholder={t("auth.login.password_placeholder")}
            />
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="mt-2 flex justify-end">
              <Link href={"/ForgotPassword"}>
                <p className="text-blue-500 cursor-pointer">{t("auth.login.forgot_password")}</p>
              </Link>
            </div>
          </ScrollReveal>

          <div className="w-full flex justify-center mt-5">
            <ScrollReveal>
              <Button_custom
                onclick={handelSubmit}
                bg="bg-primary"
                text={t("auth.login.login_button")}
              />
            </ScrollReveal>
          </div>

          {/* Nút đăng nhập Google */}
          <div className="w-full flex justify-center mt-3">
            <a
              href="https://api.d2mbox.com/api/auth/oauth"
              className="block w-full"
            >
              <button
                type="button"
                className="flex items-center justify-center w-full max-w-xs mx-auto border border-[#747775] rounded-[20px] bg-white h-10 px-3 transition hover:shadow focus:outline-none disabled:bg-gray-100 disabled:border-gray-200"
              >
                <span className="flex items-center justify-center mr-3">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-5 h-5"
                    style={{ display: "block" }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    ></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </span>
                <span className="font-medium text-[14px] text-[#1f1f1f]">
                  {t("auth.login.sign_in_with_google")}
                </span>
              </button>
            </a>
          </div>
        </div>

        <ScrollReveal direction="left">
          <div className="hidden lg:block">
            <img src="images/login_image.png" alt="" />
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default Login_component;
