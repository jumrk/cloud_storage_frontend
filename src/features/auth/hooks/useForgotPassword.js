import { useTranslations } from "next-intl";
import { useState } from "react";
import authService from "@/features/auth/services/authService";
import { useRouter } from "next/navigation";
function useForgotPassword() {
  const router = useRouter();
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
    router,
    setEmail,
    setNewPassword,
    setConfirmPassword,
    handleSendEmail,
    handleVerifyOtp,
    handleChangePassword,
    setOtp,
    t,
  };
}
export default useForgotPassword;
