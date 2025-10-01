import axiosClient from "@/lib/axiosClient";

function authService() {
  const loginService = (formData) =>
    axiosClient.post("/api/auth/login", formData);
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
  return { loginService, sendCode, verifyCode, resetPassword };
}

export default authService;
