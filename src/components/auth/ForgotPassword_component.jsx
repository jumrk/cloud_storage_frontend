"use client";
import React, { useState, useRef } from "react";
import InputCustom from "../ui/input_custom";
import Button_custom from "../ui/Button_custom";
import ScrollReveal from "../ui/ScrollReveal";
import Loader from "../ui/Loader";
import axiosClient from "@/lib/axiosClient";
import { useTranslations } from "next-intl";

function OTPInput({ value, onChange, length = 5 }) {
  const inputs = Array(length).fill(0);
  const refs = useRef([]);

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length > 1) return;
    onChange(idx, val);
    if (val && idx < length - 1) {
      refs.current[idx + 1].focus();
    }
  };
  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      refs.current[idx - 1].focus();
    }
  };
  return (
    <div className="flex gap-2 justify-center my-4">
      {inputs.map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (refs.current[idx] = el)}
          type="text"
          maxLength={1}
          value={value[idx] || ""}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          className="w-12 h-12 text-center text-2xl border rounded-lg focus:outline-primary"
        />
      ))}
    </div>
  );
}

function ForgotPassword_component() {
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập mã, 3: nhập mật khẩu mới
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const t = useTranslations();

  // Gửi email lấy mã
  const handleSendEmail = async () => {
    setLoading(true);
    setEmailError("");
    setSuccessMsg("");
    if (!email) {
      setEmailError(t("auth.forgot_password.email_required"));
      setLoading(false);
      return;
    }
    try {
      const res = await axiosClient.post("/api/forgot-password/send-code", {
        email,
      });
      if (!res.data.success) {
        setEmailError(res.data.error || t("auth.forgot_password.send_code_failed"));
      } else {
        setStep(2);
        setSuccessMsg(t("auth.forgot_password.code_sent_success"));
      }
    } catch (err) {
      setEmailError(err?.response?.data?.error || t("auth.forgot_password.general_error"));
    } finally {
      setLoading(false);
    }
  };

  // Xác thực mã OTP
  const handleVerifyOtp = async () => {
    setLoading(true);
    setOtpError("");
    setSuccessMsg("");
    if (otp.some((d) => !d)) {
      setOtpError(t("auth.forgot_password.otp_required"));
      setLoading(false);
      return;
    }
    try {
      const code = otp.join("");
      const res = await axiosClient.post("/api/forgot-password/verify-code", {
        email,
        code,
      });
      if (!res.data.success) {
        setOtpError(res.data.error || t("auth.forgot_password.invalid_otp"));
      } else {
        setStep(3);
        setSuccessMsg(t("auth.forgot_password.otp_verified_success"));
      }
    } catch (err) {
      setOtpError(err?.response?.data?.error || t("auth.forgot_password.general_error"));
    } finally {
      setLoading(false);
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async () => {
    setLoading(true);
    setPasswordError("");
    setSuccessMsg("");
    if (!newPassword || !confirmPassword) {
      setPasswordError(t("auth.forgot_password.password_required"));
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("auth.forgot_password.password_mismatch"));
      setLoading(false);
      return;
    }
    try {
      const res = await axiosClient.post(
        "/api/forgot-password/reset-password",
        {
          email,
          password: newPassword,
          confirmPassword,
        }
      );
      if (!res.data.success) {
        setPasswordError(res.data.error || t("auth.forgot_password.reset_failed"));
      } else {
        setStep(4);
        setSuccessMsg(t("auth.forgot_password.reset_success"));
      }
    } catch (err) {
      setPasswordError(
        err?.response?.data?.error || t("auth.forgot_password.general_error")
      );
    } finally {
      setLoading(false);
    }
  };

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
                  placeholder={t("auth.forgot_password.new_password_placeholder")}
                  errors={passwordError}
                  handelChange={(e) => setNewPassword(e.target.value)}
                />
                <InputCustom
                  label={t("auth.forgot_password.confirm_password")}
                  type="password"
                  value={confirmPassword}
                  name="confirmPassword"
                  id="ConfirmPassword"
                  placeholder={t("auth.forgot_password.confirm_password_placeholder")}
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
            <img src="/images/login_image.png" alt="" />
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default ForgotPassword_component;
