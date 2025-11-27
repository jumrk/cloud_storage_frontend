"use client";
import Image from "next/image";
import ScrollReveal from "@/shared/ui/ScrollReveal";
import React from "react";
import useLoginForm from "@/features/auth/hooks/useLoginForm";
import Link from "next/link";
import Input from "@/shared/ui/Input";
import Button from "@/shared/ui/button";
import OTPInput from "@/shared/ui/OTPInput";

export default function Login() {
  const {
    errors,
    handelSubmit,
    formData,
    otp,
    loading,
    handelChange,
    handleOtpChange,
    otpSent,
    countdown,
    handleBackToLogin,
    t,
  } = useLoginForm();
  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="w-[80%] grid grid-cols-1 lg:grid-cols-2 gap-2 h-1/2 lg:w-[60%]">
        <form
          className="flex flex-col justify-center md:mb-20"
          onSubmit={handelSubmit}
        >
          <div>
            <ScrollReveal direction="down">
              <h1 className="text-3xl lg:text-4xl font-bold text-primary">
                {otpSent
                  ? t("auth.login.otp_title")
                  : `${t("auth.login.welcome_back")} 👋`}
              </h1>
              <p className="text-sx lg:text-xl text-primary/60">
                {otpSent
                  ? t("auth.login.otp_description", { email: formData.email })
                  : t("auth.login.description")}
              </p>
            </ScrollReveal>

            {!otpSent ? (
              <>
                <ScrollReveal direction="left">
                  <Input
                    handelChange={handelChange}
                    label={t("auth.login.email")}
                    type="email"
                    value={formData.email}
                    name="email"
                    id="Email"
                    placeholder={t("auth.login.email_placeholder")}
                    errors={errors.email}
                    disabled={loading}
                  />
                </ScrollReveal>

                <ScrollReveal direction="right">
                  <Input
                    handelChange={handelChange}
                    label={t("auth.login.password")}
                    id="Password"
                    name="password"
                    value={formData.password}
                    type="password"
                    errors={errors.password}
                    placeholder={t("auth.login.password_placeholder")}
                    disabled={loading}
                  />
                </ScrollReveal>

                <ScrollReveal direction="right">
                  <div className="mt-2 flex justify-end">
                    <Link href="/forgot-password">
                      <p className="text-blue-500 cursor-pointer">
                        {t("auth.login.forgot_password")}
                      </p>
                    </Link>
                  </div>
                </ScrollReveal>

                <div className="w-full flex flex-col sm:flex-row gap-2 mt-5">
                  <ScrollReveal>
                    <Button
                      type="submit"
                      disabled={
                        !formData.email.trim() || !formData.password.trim()
                      }
                      handleClick={handelSubmit}
                      bg="bg-primary"
                      loading={loading}
                      children={t("auth.login.login_button")}
                      fullWidth
                    />
                  </ScrollReveal>

                  <ScrollReveal>
                    <Link href="/register" className="w-full">
                      <Button
                        variant="outline"
                        color="brand"
                        handleClick={() => {}}
                        children={t("auth.login.register_button")}
                        fullWidth
                      />
                    </Link>
                  </ScrollReveal>
                </div>
              </>
            ) : (
              <>
                <ScrollReveal direction="left">
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                      {t("auth.login.otp_label")}
                    </label>
                    <OTPInput
                      length={6}
                      value={otp}
                      onChange={handleOtpChange}
                      disabled={loading}
                      error={!!errors.otp}
                      className="mb-4"
                    />
                    {errors.otp && (
                      <p className="mt-2 text-sm text-red-600 text-center">
                        {errors.otp}
                      </p>
                    )}
                    {countdown > 0 && (
                      <p className="mt-2 text-sm text-gray-500 text-center">
                        {t("auth.login.otp_resend_countdown", { countdown })}
                      </p>
                    )}
                  </div>
                </ScrollReveal>

                <div className="w-full flex flex-col sm:flex-row gap-2 mt-5">
                  <ScrollReveal>
                    <Button
                      type="submit"
                      disabled={otp.join("").length !== 6 || loading}
                      handleClick={handelSubmit}
                      bg="bg-primary"
                      loading={loading}
                      children={t("auth.login.verify_and_login")}
                      fullWidth
                    />
                  </ScrollReveal>

                  <ScrollReveal>
                    <Button
                      type="button"
                      variant="outline"
                      color="brand"
                      handleClick={handleBackToLogin}
                      disabled={loading || countdown > 0}
                      children={t("auth.login.back")}
                      fullWidth
                    />
                  </ScrollReveal>
                </div>
              </>
            )}
          </div>
        </form>
        <ScrollReveal direction="left">
          <div className="hidden lg:block">
            <Image
              src="/images/login_image.png"
              alt="Login illustration"
              width={600}
              height={450}
              quality={85}
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
