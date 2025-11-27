import axiosClient from "@/shared/lib/axiosClient";

function authService() {
  const loginService = (formData) =>
    axiosClient.post("/api/auth/login", formData);
  const sendLoginOTP = (formData) =>
    axiosClient.post("/api/auth/login/send-otp", formData);
  const verifyLoginOTP = (formData) =>
    axiosClient.post("/api/auth/login/verify-otp", formData);
  const sendCode = (email) =>
    axiosClient.post("/api/forgot-password/send-code", {
      email,
    });
  const verifyCode = (email, code) =>
    axiosClient.post("/api/forgot-password/verify-code", {
      email,
      code,
    });
  const resetPassword = (email, newPassword, confirmPassword) =>
    axiosClient.post("/api/forgot-password/reset-password", {
      email,
      password: newPassword,
      confirmPassword,
    });

  const register = (values) => axiosClient.post("/api/auth/register", values);
  return {
    loginService,
    sendLoginOTP,
    verifyLoginOTP,
    sendCode,
    verifyCode,
    resetPassword,
    register,
  };
}

export default authService;
