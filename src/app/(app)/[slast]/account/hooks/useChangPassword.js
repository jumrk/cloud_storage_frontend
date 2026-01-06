import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { useState } from "react";
import changePasswordService from "../services/changePasswordService";
const useChangePassword = () => {
  const { editPassword } = changePasswordService();
  const t = useTranslations();
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!form.oldPassword) {
      setErrors((prev) => ({
        ...prev,
        oldPassword: t("change_password.old_password_required"),
      }));
      return;
    }
    if (!form.newPassword) {
      setErrors((prev) => ({
        ...prev,
        newPassword: t("change_password.new_password_required"),
      }));
      return;
    }
    if (form.newPassword.length < 6) {
      setErrors((prev) => ({
        ...prev,
        newPassword: t("change_password.password_min_length"),
      }));
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: t("change_password.password_mismatch"),
      }));
      return;
    }
    setLoading(true);
    try {
      await editPassword(form);
      toast.success(t("change_password.change_success"));
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      localStorage.clear();
      window.location.href = "/login";
      return;
    } catch (err) {
      if (err.response?.data?.error) {
        setErrors({ general: err.response.data.error });
        toast.error(err.response.data.error);
      } else {
        setErrors({ general: t("change_password.general_error") });
        toast.error(t("change_password.general_error"));
      }
    } finally {
      setLoading(false);
    }
  };
  return {
    form,
    setForm,
    t,
    errors,
    setErrors,
    loading,
    setLoading,
    handleChange,
    handleSubmit,
  };
};

export default useChangePassword;
