import { useTranslations } from "next-intl";
import { useState } from "react";
import toast from "react-hot-toast";
import axiosClient from "@/lib/axiosClient";

const useInforComponent = () => {
  const t = useTranslations();
  const [editMode, setEditMode] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [daysLeft, setDaysLeft] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [targetPlan, setTargetPlan] = useState(null);
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const [formattedPlanEndDate, setFormattedPlanEndDate] = useState("");
  const [formattedDateOfBirth, setFormattedDateOfBirth] = useState("");

  const currentPlan = user && user.plan ? { ...user.plan } : null;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  async function fetchUser() {
    setLoading(true);
    try {
      const res = await axiosClient.get("/api/user");
      const data = res.data;
      setUser(data);
      setForm({
        fullName: data.fullName || "",
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
        phone: data.phone || "",
      });
      const resOrders = await axiosClient.get("/api/orders", {
        params: { status: "pending" },
      });
      const dataOrders = resOrders.data;
      if (dataOrders.data && Array.isArray(dataOrders.data)) {
        setHasPendingOrder(dataOrders.data.some((o) => o.email === data.email));
      } else {
        setHasPendingOrder(false);
      }
      if (data.role === "leader") {
        const resMembers = await axiosClient.get("/api/user/members");
        const dataMembers = resMembers.data;
      }
    } catch (e) {
      setUser(null);
    }
    setLoading(false);
  }
  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setForm({
      fullName: user.fullName,
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
      phone: user.phone,
    });
    setEditMode(false);
  };
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSave = async () => {
    setEditLoading(true);
    try {
      const res = await axiosClient.patch("/api/user/edit", form);
      const data = res.data;
      if (data.success) {
        setUser((prev) => ({ ...prev, ...form }));
        setEditMode(false);
        toast.success(t("user_info.update_success"));
      } else {
        toast.error(data.error || t("user_info.update_failed"));
      }
    } catch (e) {
      toast.error(t("user_info.connection_error"));
    }
    setEditLoading(false);
  };

  const handlePlanAction = (plan, actionType) => {
    setTargetPlan(plan);
    setModalAction(actionType);
    setModalOpen(true);
  };

  const handleConfirmPlanChange = ({ amount, type, targetPlan }) => {
    setModalOpen(false);
    // TODO: Gửi request tạo đơn hàng mới với thông tin này
    alert(
      `Đã xác nhận ${type} gói: ${
        targetPlan.name
      }, số tiền: ${amount.toLocaleString("vi-VN")}₫`
    );
  };
  return {
    t,
    editMode,
    setEditMode,
    user,
    setUser,
    form,
    setForm,
    loading,
    setLoading,
    showChangePassword,
    setShowChangePassword,
    editLoading,
    setEditLoading,
    daysLeft,
    setDaysLeft,
    modalOpen,
    setModalOpen,
    modalAction,
    setModalAction,
    targetPlan,
    setTargetPlan,
    hasPendingOrder,
    setHasPendingOrder,
    formattedPlanEndDate,
    setFormattedPlanEndDate,
    formattedDateOfBirth,
    setFormattedDateOfBirth,
    fetchUser,
    handleEdit,
    handleChange,
    handleSave,
    handleCancel,
    handlePlanAction,
    handleConfirmPlanChange,
    currentPlan,
    isExpired,
  };
};
export default useInforComponent;
