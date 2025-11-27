"use client";
import Image from "next/image";
import Link from "next/link";
import useForgotPassword from "../hooks/useForgotPassword";
import ScrollReveal from "@/shared/ui/ScrollReveal";
import Input from "@/shared/ui/Input";
import Button from "@/shared/ui/button";
import OTPInput from "@/shared/ui/OTPInput";
import { FiArrowLeft } from "react-icons/fi";

export default function ForgotPassword() {
  const {
    step,
    email,
    otp,
    newPassword,
    confirmPassword,
    loading,
    otpError,
    emailError,
    passwordError,
    successMsg,
    router,
    setEmail,
    setNewPassword,
    setConfirmPassword,
    handleSendEmail,
    handleVerifyOtp,
    handleChangePassword,
    setOtp,
    t,
  } = useForgotPassword();

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="w-[80%] lg:w-[60%] grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col justify-center">
          <ScrollReveal direction="down">
            {/* Back button */}
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Quay lại"
              className="mb-3 inline-flex items-center gap-2 text-brand-700 hover:text-brand-800"
            >
              <FiArrowLeft className="h-5 w-5" />
              <span className="text-sm">Quay lại</span>
            </button>

            <h1 className="text-3xl lg:text-4xl font-bold text-[var(--color-text-strong)]">
              {t("auth.forgot_password.title")} 🔒
            </h1>
            <p className="text-sx lg:text-xl text-[color:var(--color-text-muted)]">
              {step === 1 && t("auth.forgot_password.step1_description")}
              {step === 2 && t("auth.forgot_password.step2_description")}
              {step === 3 && t("auth.forgot_password.step3_description")}
              {step === 4 && t("auth.forgot_password.step4_description")}
            </p>
            {successMsg && (
              <div className="text-[color:var(--color-success-600)] text-center mt-2">
                {successMsg}
              </div>
            )}
          </ScrollReveal>

          {step === 1 && (
            <ScrollReveal direction="left">
              <form onSubmit={handleSendEmail} className="mt-6">
                <Input
                  label={t("auth.forgot_password.email")}
                  type="email"
                  value={email}
                  name="email"
                  id="Email"
                  placeholder={t("auth.forgot_password.email_placeholder")}
                  errors={emailError}
                  handelChange={(e) => setEmail(e.target.value)}
                />
                <div className="w-full flex justify-center mt-5">
                  <Button
                    type="submit"
                    onClick={handleSendEmail}
                    disabled={!email.trim()}
                    loading={loading}
                  >
                    {t("auth.forgot_password.send_code")}
                  </Button>
                </div>
              </form>
            </ScrollReveal>
          )}

          {step === 2 && (
            <ScrollReveal direction="left">
              <form onSubmit={handleVerifyOtp} className="mt-6">
                <OTPInput
                  length={5}
                  value={otp}
                  disabled={loading}
                  error={Boolean(otpError)}
                  onChange={(idx, val) => {
                    const next = [...otp];
                    next[idx] = val;
                    setOtp(next);
                  }}
                />
                {otpError && (
                  <div className="text-[color:var(--color-danger-600)] text-sm text-center mt-2">
                    {otpError}
                  </div>
                )}
                <div className="w-full flex justify-center mt-5">
                  <Button
                    type="submit"
                    onClick={handleVerifyOtp}
                    loading={loading}
                  >
                    {t("auth.forgot_password.verify_code")}
                  </Button>
                </div>
              </form>
            </ScrollReveal>
          )}

          {step === 3 && (
            <ScrollReveal direction="left">
              <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
                <Input
                  label={t("auth.forgot_password.new_password")}
                  type="password"
                  value={newPassword}
                  name="newPassword"
                  id="NewPassword"
                  placeholder={t(
                    "auth.forgot_password.new_password_placeholder"
                  )}
                  errors={passwordError}
                  handelChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  label={t("auth.forgot_password.confirm_password")}
                  type="password"
                  value={confirmPassword}
                  name="confirmPassword"
                  id="ConfirmPassword"
                  placeholder={t(
                    "auth.forgot_password.confirm_password_placeholder"
                  )}
                  errors={passwordError}
                  handelChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="w-full flex justify-center mt-2">
                  <Button
                    type="submit"
                    onClick={handleChangePassword}
                    loading={loading}
                  >
                    {t("auth.forgot_password.reset_password")}
                  </Button>
                </div>
              </form>
            </ScrollReveal>
          )}

          {step === 4 && (
            <ScrollReveal direction="down">
              <div className="mt-8 text-center text-[color:var(--color-success-600)] font-semibold text-lg">
                {t("auth.forgot_password.success_message")}
                <br />
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 mt-4"
                >
                  <Button variant="outline" color="brand">
                    {t("auth.login.login_button")}
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          )}
        </div>

        <ScrollReveal direction="left">
          <div className="hidden lg:block self-center">
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
