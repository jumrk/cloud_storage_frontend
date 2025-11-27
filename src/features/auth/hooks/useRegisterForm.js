import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import authService from "../services/authService";
export default function useRegisterForm() {
  const t = useTranslations();
  const router = useRouter();
  const { register } = authService();
  const [values, setValues] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const canSubmit =
    values.email.trim() &&
    values.phone.trim() &&
    values.password.trim() &&
    values.confirmPassword.trim();

  const handleRegister = async () => {
    setFormLoading(true);
    setErrors({});
    try {
      const res = await register(values);
      if (res?.data?.success) {
        toast.success("Đăng ký thành công");
        router.push("/login");
      } else {
        setErrors(res?.data?.error || { general: t("common.error") });
      }
    } catch (e) {
      const data = e?.response?.data;
      setErrors(
        data?.error ? data.error : { general: t("common.server_error") }
      );
    } finally {
      setFormLoading(false);
    }
  };

  return {
    t,
    formLoading,
    canSubmit,
    errors,
    values,
    handleRegister,
    onChange,
  };
}
