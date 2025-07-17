"use client";

import axiosClient from "@/lib/axiosClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const { default: validateForm } = require("@/utils/validateForm");
const { useState } = require("react");

function useRegisterForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const handelChange = (e) => {
    const { name, value } = e.target;
    setErrors({});
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handelSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm({
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });
    setErrors(validationError);

    if (Object.keys(validationError).length === 0) {
      try {
        setLoading(true);
        const res = await axiosClient.post("/api/register", formData);
        setFormData({
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
        });
        setErrors({});
        toast.success(res.data.message);
        setTimeout(() => {
          router.push("/Login");
        }, 1000);
      } catch (error) {
        toast.error(error.response?.data?.error);
        console.error("Login failed", error.response?.data?.error);
      } finally {
        setLoading(false);
      }
    }
  };
  return { formData, errors, handelSubmit, loading, handelChange };
}

export default useRegisterForm;
