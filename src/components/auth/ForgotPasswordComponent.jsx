"use client";
import InputCustom from "@/components/ui/InputCustom";
import Button_custom from "@/components/ui/ButtonCustom";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Loader from "@/components/ui/Loader";
import Image from "next/image";
import useForgotPassword from "@/hooks/auth/useForgotPassword";
function ForgotPassword_component() {
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
    setEmail,
    setNewPassword,
    setConfirmPassword,
    handleSendEmail,
    handleVerifyOtp,
    handleChangePassword,
    OTPInput,
    setOtp,
    t,
  } = useForgotPassword();
  if (loading) return <Loader />;

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="w-[80%] grid grid-cols-1 lg:grid-cols-2 gap-2 h-1/2 lg:w-[60%]">
        <div>
          <ScrollReveal direction="down">
            <h1 className="text-3xl lg:text-4xl font-bold text-primary">
              {t("auth.forgot_password.title")} 🔒
            </h1>
            <p className="text-sx lg:text-xl text-primary/60">
              {step === 1 && t("auth.forgot_password.step1_description")}
              {step === 2 && t("auth.forgot_password.step2_description")}
              {step === 3 && t("auth.forgot_password.step3_description")}
              {step === 4 && t("auth.forgot_password.step4_description")}
            </p>
            {successMsg && (
              <div className="text-green-600 text-center mt-2">
                {successMsg}
              </div>
            )}
          </ScrollReveal>

          {step === 1 && (
            <ScrollReveal direction="left">
              <div className="mt-6">
                <InputCustom
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
                  <Button_custom
                    onclick={handleSendEmail}
                    bg="bg-primary"
                    text={t("auth.forgot_password.send_code")}
                  />
                </div>
              </div>
            </ScrollReveal>
          )}

          {step === 2 && (
            <ScrollReveal direction="left">
              <div className="mt-6">
                <OTPInput
                  value={otp}
                  onChange={(idx, val) => {
                    const newOtp = [...otp];
                    newOtp[idx] = val;
                    setOtp(newOtp);
                  }}
                />
                {otpError && (
                  <div className="text-red-500 text-sm text-center">
                    {otpError}
                  </div>
                )}
                <div className="w-full flex justify-center mt-5">
                  <Button_custom
                    onclick={handleVerifyOtp}
                    bg="bg-primary"
                    text={t("auth.forgot_password.verify_code")}
                  />
                </div>
              </div>
            </ScrollReveal>
          )}

          {step === 3 && (
            <ScrollReveal direction="left">
              <div className="mt-6">
                <InputCustom
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
                <InputCustom
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
                <div className="w-full flex justify-center mt-5">
                  <Button_custom
                    onclick={handleChangePassword}
                    bg="bg-primary"
                    text={t("auth.forgot_password.reset_password")}
                  />
                </div>
              </div>
            </ScrollReveal>
          )}

          {step === 4 && (
            <ScrollReveal direction="down">
              <div className="mt-8 text-center text-green-600 font-semibold text-lg">
                {t("auth.forgot_password.success_message")}
                <br />
                <a
                  href="/Login"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-white rounded-md shadow hover:bg-primary/80 transition font-semibold text-base"
                  style={{ textDecoration: "none" }}
                >
                  {/* Icon Home */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 12l9-9 9 9M4.5 10.5V21h15v-10.5"
                    />
                  </svg>
                </a>
              </div>
            </ScrollReveal>
          )}
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

export default ForgotPassword_component;
