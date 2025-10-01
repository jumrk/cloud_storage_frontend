"use client";
import React from "react";
import InputCustom from "@/components/ui/InputCustom";
import Button_custom from "@/components/ui/ButtonCustom";
import useLoginForm from "@/hooks/auth/useLoginForm";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Link from "next/link";
import Loader from "@/components/ui/Loader";
import { useTranslations } from "next-intl";
import Image from "next/image";

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
                <p className="text-blue-500 cursor-pointer">
                  {t("auth.login.forgot_password")}
                </p>
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
        </div>

        <ScrollReveal direction="left">
          <div className="hidden lg:block">
            <Image
              src="/images/login_image.png"
              alt="Login illustration"
              width={500}
              height={400}
              placeholder="blur"
              blurDataURL="data:image/png;base64,..."
              priority
            />
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default Login_component;
