import { useTranslations } from "next-intl";
import { useState } from "react";
import toast from "react-hot-toast";
import inforUserService from "../services/inforUserService";

const useInforComponent = () => {
  const { getInforUser, editInforUser, uploadAvatar } = inforUserService();
  const t = useTranslations();
  const [editMode, setEditMode] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [formattedDateOfBirth, setFormattedDateOfBirth] = useState("");

  async function fetchUser() {
    setLoading(true);
    try {
      const res = await getInforUser();
      const data = res.data;
      setUser(data);
      setForm({
        fullName: data.fullName || "",
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
        phone: data.phone || "",
      });
    } catch {
      setUser(null);
    }
    setLoading(false);
  }

  const handleEdit = () => setEditMode(true);

  const handleCancel = () => {
    if (!user) return;
    setForm({
      fullName: user.fullName || "",
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
      phone: user.phone || "",
    });
    setEditMode(false);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await editInforUser(form);
      const data = res.data;
      if (data.success) {
        setUser((prev) => ({ ...prev, ...form }));
        setEditMode(false);
        toast.success(t("user_info.update_success"));
      } else {
        toast.error(data.error || t("user_info.update_failed"));
      }
    } catch {
      toast.error(t("user_info.connection_error"));
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    setAvatarUploading(true);
    try {
      const res = await uploadAvatar(formData);
      const data = res.data;
      if (data?.success) {
        setUser((prev) => ({
          ...prev,
          avatar: data.avatar,
        }));
        toast.success(t("user_info.update_success"));
      } else {
        toast.error(data?.error || t("user_info.update_failed"));
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || t("user_info.connection_error"));
    } finally {
      setAvatarUploading(false);
    }
  };

  return {
    t,
    editMode,
    user,
    form,
    loading,
    showChangePassword,
    formattedDateOfBirth,
    setEditMode,
    setUser,
    setForm,
    setLoading,
    avatarUploading,
    setShowChangePassword,
    setFormattedDateOfBirth,
    fetchUser,
    handleEdit,
    handleChange,
    handleSave,
    handleCancel,
    handleAvatarUpload,
  };
};

export default useInforComponent;

