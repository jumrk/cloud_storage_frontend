"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import authService from "@/features/auth/services/authService";
import validateForm from "@/shared/utils/validateForm";

export default function useAdminLoginForm() {
  const router = useRouter();
  const { loginService } = authService();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm({
      email: formData.email,
      password: formData.password,
    });
    setErrors(validationErrors);
    if (validationErrors.email || validationErrors.password) return;

    try {
      setLoading(true);
      const res = await loginService(formData);
      const { token, user } = res.data || {};
      if (!user || user.role !== "admin") {
        toast.error("Tài khoản không có quyền truy cập admin.");
        return;
      }
      if (token) {
        localStorage.setItem("token", token);
      }
      toast.success("Đăng nhập admin thành công!");
      router.replace("/admin");
    } catch (error) {
      const serverError = error?.response?.data?.error;
      if (typeof serverError === "object" && serverError !== null) {
        setErrors(serverError);
      } else {
        toast.error(serverError || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    errors,
    loading,
    handleSubmit,
    handleChange,
  };
}


