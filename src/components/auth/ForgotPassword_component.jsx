"use client";
import React, { useState, useRef } from "react";
import InputCustom from "../ui/input_custom";
import Button_custom from "../ui/Button_custom";
import ScrollReveal from "../ui/ScrollReveal";
import Loader from "../ui/Loader";
import axiosClient from "@/lib/axiosClient";

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

  // Gửi email lấy mã
  const handleSendEmail = async () => {
    setLoading(true);
    setEmailError("");
    setSuccessMsg("");
    if (!email) {
      setEmailError("Vui lòng nhập email");
      setLoading(false);
      return;
    }
    try {
      const res = await axiosClient.post("/api/forgot-password/send-code", {
        email,
      });
      if (!res.data.success) {
        setEmailError(res.data.error || "Gửi mã thất bại");
      } else {
        setStep(2);
        setSuccessMsg("Đã gửi mã xác thực đến email của bạn!");
      }
    } catch (err) {
      setEmailError(err?.response?.data?.error || "Có lỗi xảy ra, thử lại sau");
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
      setOtpError("Vui lòng nhập đủ mã xác thực");
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
        setOtpError(res.data.error || "Mã xác thực không đúng");
      } else {
        setStep(3);
        setSuccessMsg("Mã xác thực đúng, hãy nhập mật khẩu mới!");
      }
    } catch (err) {
      setOtpError(err?.response?.data?.error || "Có lỗi xảy ra, thử lại sau");
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
      setPasswordError("Vui lòng nhập đủ thông tin");
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu không khớp");
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
        setPasswordError(res.data.error || "Đổi mật khẩu thất bại");
      } else {
        setStep(4);
        setSuccessMsg("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      }
    } catch (err) {
      setPasswordError(
        err?.response?.data?.error || "Có lỗi xảy ra, thử lại sau"
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
              Quên mật khẩu 🔒
            </h1>
            <p className="text-sx lg:text-xl text-primary/60">
              {step === 1 && "Nhập email để nhận mã xác thực."}
              {step === 2 && "Nhập mã xác thực đã gửi đến email của bạn."}
              {step === 3 && "Nhập mật khẩu mới cho tài khoản của bạn."}
              {step === 4 && "Đổi mật khẩu thành công! Vui lòng đăng nhập lại."}
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
                  label="Email"
                  type="email"
                  value={email}
                  name="email"
                  id="Email"
                  placeholder="Example@gmail.com"
                  errors={emailError}
                  handelChange={(e) => setEmail(e.target.value)}
                />
                <div className="w-full flex justify-center mt-5">
                  <Button_custom
                    onclick={handleSendEmail}
                    bg="bg-primary"
                    text="Gửi mã xác thực"
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
                    text="Xác thực mã"
                  />
                </div>
              </div>
            </ScrollReveal>
          )}

          {step === 3 && (
            <ScrollReveal direction="left">
              <div className="mt-6">
                <InputCustom
                  label="Mật khẩu mới"
                  type="password"
                  value={newPassword}
                  name="newPassword"
                  id="NewPassword"
                  placeholder="Nhập mật khẩu mới"
                  errors={passwordError}
                  handelChange={(e) => setNewPassword(e.target.value)}
                />
                <InputCustom
                  label="Xác nhận mật khẩu"
                  type="password"
                  value={confirmPassword}
                  name="confirmPassword"
                  id="ConfirmPassword"
                  placeholder="Nhập lại mật khẩu"
                  errors={passwordError}
                  handelChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="w-full flex justify-center mt-5">
                  <Button_custom
                    onclick={handleChangePassword}
                    bg="bg-primary"
                    text="Đổi mật khẩu"
                  />
                </div>
              </div>
            </ScrollReveal>
          )}

          {step === 4 && (
            <ScrollReveal direction="down">
              <div className="mt-8 text-center text-green-600 font-semibold text-lg">
                Đổi mật khẩu thành công!
                <br />
                <a href="/Login" className="text-blue-600 underline">
                  Quay lại đăng nhập
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
