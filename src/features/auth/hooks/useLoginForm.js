import authService from "@/features/auth/services/authService";
import validateForm from "@/shared/utils/validateForm";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
function useLoginForm() {
  const t = useTranslations();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [sessionToken, setSessionToken] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { loginService, sendLoginOTP, verifyLoginOTP } = authService();
  const router = useRouter();

  const handelChange = (e) => {
    const { name, value } = e.target;
    setErrors({});
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrors((prev) => ({ ...prev, otp: undefined }));
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    const validationError = validateForm({
      email: formData.email,
      password: formData.password,
    });

    setErrors(validationError);

    if (!validationError.email && !validationError.password) {
      try {
        setLoading(true);
        const res = await sendLoginOTP(formData);
        setOtpSent(true);
        setOtp(Array(6).fill(""));
        setSessionToken(res.data.sessionToken || "");
        setErrors({});
        toast.success(res.data.message || t("auth.login.otp_sent_success"));
        
        // Start countdown (60 seconds)
        setCountdown(60);
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (error) {
        console.log(error);
        const errorMessage = error?.response?.data?.error || t("auth.login.general_error");
        if (typeof errorMessage === "string") {
          toast.error(errorMessage);
        } else if (typeof errorMessage === "object") {
          setErrors(errorMessage);
          toast.error(t("auth.login.check_info_error"));
        } else {
          toast.error(t("auth.login.general_error"));
        }
        setLoading(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (!otpString || otpString.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: t("auth.login.otp_required_error") }));
      return;
    }

    try {
      setLoading(true);
      const res = await verifyLoginOTP({
        sessionToken,
        otp: otpString,
      });
      setErrors({});

      const token = res.data.token;
      if (token) {
        localStorage.setItem("token", token);
      }
      const { role } = res.data.user;
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push(`/`);
      }
      toast.success(res.data.message || t("auth.login.login_success"));
    } catch (error) {
      console.log(error);
      const errorMessage = error?.response?.data?.error || t("auth.login.general_error");
      if (typeof errorMessage === "string") {
        toast.error(errorMessage);
        // Check if error message contains "Mã" (Vietnamese) or "code" (English)
        if (errorMessage.includes("Mã") || errorMessage.toLowerCase().includes("code")) {
          setErrors((prev) => ({ ...prev, otp: errorMessage }));
        }
      } else {
        toast.error(t("auth.login.general_error"));
      }
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setOtpSent(false);
    setOtp(Array(6).fill(""));
    setSessionToken("");
    setErrors({});
    setCountdown(0);
  };

  const handelSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm({
      email: formData.email,
      password: formData.password,
    });

    setErrors(validationError);

    if (!validationError.email && !validationError.password) {
      try {
        setLoading(true);
        const res = await loginService(formData);
        setErrors({});

        const token = res.data.token;
        if (token) {
          localStorage.setItem("token", token);
        }
        const { role } = res.data.user;
        if (role === "admin") {
          router.push("/admin");
        } else {
          router.push(`/`);
        }
        toast.success(res.data.message || t("auth.login.login_success"));
      } catch (error) {
        console.log(error);
        const errorMessage = error?.response?.data?.error || t("auth.login.general_error");
        if (typeof errorMessage === "string") {
          toast.error(errorMessage);
        } else if (typeof errorMessage === "object") {
          setErrors(errorMessage);
          toast.error(t("auth.login.check_info_error"));
        } else {
          toast.error(t("auth.login.general_error"));
        }
        setLoading(false);
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    formData,
    errors,
    loading,
    t,
    handelSubmit,
    handelChange,
  };
}

export default useLoginForm;
