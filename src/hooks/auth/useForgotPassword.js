import axiosClient from "@/lib/axiosClient";
import authService from "@/lib/services/authService";
import { useTranslations } from "next-intl";
import React, { useState, useRef } from "react";
function useForgotPassword() {
  const [step, setStep] = useState(1);
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
  const { sendCode, verifyCode, resetPassword } = authService();
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
      const res = await verifyCode(email, code);
      if (!res.data.success) {
        setOtpError(res.data.error || t("auth.forgot_password.invalid_otp"));
      } else {
        setStep(3);
        setSuccessMsg(t("auth.forgot_password.otp_verified_success"));
      }
    } catch (err) {
      setOtpError(
        err?.response?.data?.error || t("auth.forgot_password.general_error")
      );
    } finally {
      setLoading(false);
    }
  };

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
      const res = await sendCode(email);
      if (!res.data.success) {
        setEmailError(
          res.data.error || t("auth.forgot_password.send_code_failed")
        );
      } else {
        setStep(2);
        setSuccessMsg(t("auth.forgot_password.code_sent_success"));
      }
    } catch (err) {
      setEmailError(
        err?.response?.data?.error || t("auth.forgot_password.general_error")
      );
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
      const res = await resetPassword(email, newPassword, confirmPassword);
      if (!res.data.success) {
        setPasswordError(
          res.data.error || t("auth.forgot_password.reset_failed")
        );
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

  return {
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
  };
}
export default useForgotPassword;
