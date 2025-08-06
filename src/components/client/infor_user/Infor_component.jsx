"use client";
import React, { useState, useEffect } from "react";
import { FiEdit2, FiKey } from "react-icons/fi";
import { formatSize } from "@/utils/driveUtils";
import ChangePasswordModal from "./ChangePasswordModal";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import PlanListInUser from "./PlanListInUser";
import PlanChangeSummaryModal from "./PlanChangeSummaryModal";
import axiosClient from "@/lib/axiosClient";
import { useTranslations } from "next-intl";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
}

export default function Infor_component() {
  const t = useTranslations();
  const [editMode, setEditMode] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [subAccounts, setSubAccounts] = useState(0);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [daysLeft, setDaysLeft] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null); // "renew" | "upgrade" | "downgrade"
  const [targetPlan, setTargetPlan] = useState(null);
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const [formattedPlanEndDate, setFormattedPlanEndDate] = useState("");
  const [formattedDateOfBirth, setFormattedDateOfBirth] = useState("");

  useEffect(() => {
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
        // Kiểm tra đơn hàng pending
        const resOrders = await axiosClient.get("/api/orders", {
          params: { status: "pending" },
        });
        const dataOrders = resOrders.data;
        if (dataOrders.data && Array.isArray(dataOrders.data)) {
          setHasPendingOrder(
            dataOrders.data.some((o) => o.email === data.email)
          );
        } else {
          setHasPendingOrder(false);
        }
        // Fetch sub-accounts (members)
        if (data.role === "leader") {
          const resMembers = await axiosClient.get("/api/user/members");
          const dataMembers = resMembers.data;
          setSubAccounts(
            Array.isArray(dataMembers.members) ? dataMembers.members.length : 0
          );
        }
      } catch (e) {
        setUser(null);
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (user && user.planEndDate) {
      const end = new Date(user.planEndDate);
      const now = new Date();
      const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      setDaysLeft(diff);
    }
    // Fix hydration: format ngày hết hạn và ngày sinh trên client
    if (typeof window !== "undefined") {
      setFormattedPlanEndDate(
        user?.planEndDate
          ? new Date(user.planEndDate).toLocaleDateString("vi-VN")
          : ""
      );
      setFormattedDateOfBirth(
        user?.dateOfBirth
          ? new Date(user.dateOfBirth).toLocaleDateString("vi-VN")
          : ""
      );
    }
  }, [user]);

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

  // Xác định gói hiện tại
  const currentPlan = user && user.plan ? { ...user.plan } : null;

  const isExpired = daysLeft !== null && daysLeft <= 0;

  // Xác định loại action khi chọn gói
  const handlePlanAction = (plan, actionType) => {
    setTargetPlan(plan);
    setModalAction(actionType); // modalAction sẽ là type
    setModalOpen(true);
  };

  // Xác nhận chuyển đổi gói
  const handleConfirmPlanChange = ({ amount, type, targetPlan }) => {
    setModalOpen(false);
    // TODO: Gửi request tạo đơn hàng mới với thông tin này
    alert(
      `Đã xác nhận ${type} gói: ${
        targetPlan.name
      }, số tiền: ${amount.toLocaleString("vi-VN")}₫`
    );
  };

  if (loading) {
    return (
      <div className="w-full mx-auto bg-white p-8 mt-8 border border-gray-100">
        {/* Avatar + tên + email */}
        <div className="flex flex-col mb-8 items-center">
          <Skeleton circle width={112} height={112} className="mb-3" />
          <Skeleton width={120} height={28} />
          <Skeleton width={180} height={18} className="mt-2" />
        </div>
        {/* Bảng thông tin chi tiết */}
        <div className="w-full bg-white border border-gray-100">
          <div className="px-6 py-3 border-b border-gray-100 font-semibold text-gray-800 bg-gray-50">
            {t("user_info.detail_info")}
          </div>
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="flex items-center px-6 py-3">
                <div className="w-1/3">
                  <Skeleton width={90} height={16} />
                </div>
                <div className="flex-1">
                  <Skeleton width={160} height={18} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Nút đổi mật khẩu & chỉnh sửa */}
        <div className="flex gap-4 justify-center mt-6">
          <Skeleton width={120} height={40} />
          <Skeleton width={120} height={40} />
        </div>
        {/* Gói dịch vụ */}
        <div className="mt-10">
          <Skeleton width={220} height={32} />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <Skeleton key={idx} height={120} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="p-8 text-center text-red-500">
        {t("user_info.cannot_load_user")}
      </div>
    );
  }

  return (
    <div className="w-full mx-auto bg-white p-2 md:p-8 mt-8 border border-gray-100">
      {/* Cảnh báo sắp hết hạn gói */}
      {daysLeft !== null && daysLeft <= 2 && daysLeft > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
          <div className="font-bold mb-1">
            {t("user_info.plan_expiring_title")}
          </div>
          <div>
            {t("user_info.plan_expiring", {
              plan: user.plan?.name,
              date: formattedPlanEndDate,
              days: daysLeft,
            })}
          </div>
        </div>
      )}
      {/* Cảnh báo sắp hết hạn gói */}
      {hasPendingOrder && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-4 mb-4 rounded shadow">
          <div className="font-bold mb-1 text-lg">
            {t("user_info.pending_order_title")}
          </div>
          <div>{t("user_info.pending_order")}</div>
        </div>
      )}
      {/* Avatar + tên + email */}
      <div className="flex flex-col mb-8">
        <img
          src={"/images/avatar.jpg"}
          alt={user.fullName}
          className="w-28 h-28 rounded-full object-cover border border-gray-200 mb-3"
        />
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">
            {user.fullName}
          </span>
        </div>
        <div className="text-gray-500 text-base mt-1">{user.email}</div>
      </div>
      {/* Bảng thông tin chi tiết */}
      <div className="w-full bg-white border border-gray-100">
        <div className="px-6 py-3 border-b border-gray-100 font-semibold text-gray-800 bg-gray-50">
          {t("user_info.detail_info")}
        </div>
        <div className="divide-y divide-gray-100">
          <div className="flex items-center px-6 py-3">
            <div className="w-1/3 text-gray-500 font-medium">
              {t("user_info.full_name")}
            </div>
            <div className="flex-1">
              {editMode ? (
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className="border border-gray-200 rounded px-3 py-1 w-full text-gray-900"
                />
              ) : (
                <span className="text-gray-900">{user.fullName}</span>
              )}
            </div>
          </div>
          <div className="flex items-center px-6 py-3">
            <div className="w-1/3 text-gray-500 font-medium">
              {t("user_info.date_of_birth")}
            </div>
            <div className="flex-1">
              {editMode ? (
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  className="border border-gray-200 rounded px-3 py-1 w-full text-gray-900"
                />
              ) : (
                <span className="text-gray-900">{formattedDateOfBirth}</span>
              )}
            </div>
          </div>
          <div className="flex items-center px-6 py-3">
            <div className="w-1/3 text-gray-500 font-medium">
              {t("user_info.phone")}
            </div>
            <div className="flex-1">
              {editMode ? (
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="border border-gray-200 rounded px-3 py-1 w-full text-gray-900"
                />
              ) : (
                <span className="text-gray-900">{user.phone}</span>
              )}
            </div>
          </div>
          <div className="flex items-center px-6 py-3">
            <div className="w-1/3 text-gray-500 font-medium">
              {t("user_info.total_files")}
            </div>
            <div className="flex-1 text-gray-900">{user.totalFiles}</div>
          </div>
          <div className="flex items-center px-6 py-3">
            <div className="w-1/3 text-gray-500 font-medium">
              {t("user_info.total_storage")}
            </div>
            <div className="flex-1 text-gray-900">
              {formatSize(user.maxStorage)}
            </div>
          </div>
          <div className="flex items-center px-6 py-3">
            <div className="w-1/3 text-gray-500 font-medium">
              {t("user_info.used_storage")}
            </div>
            <div className="flex-1 text-gray-900">
              {formatSize(user.usedStorage)}
            </div>
          </div>
          <div className="flex items-center px-6 py-3">
            <div className="w-1/3 text-gray-500 font-medium">
              {t("user_info.sub_accounts")}
            </div>
            <div className="flex-1 text-gray-900 font-semibold">
              {user.maxUser || user.plan?.users || 0}
              <span className="ml-2 text-gray-400 text-sm">
                {t("user_info.sub_accounts_note")}
              </span>
            </div>
          </div>
          <div className="flex items-center px-6 py-3">
            <div className="w-1/3 text-gray-500 font-medium">
              {t("user_info.current_plan")}
            </div>
            <div className="flex-1 text-gray-900 font-semibold">
              {user.plan?.name || "-"}
            </div>
          </div>
        </div>
        {/* Nút lưu/hủy khi edit */}
        {editMode && (
          <div className="flex gap-2 justify-end px-6 py-3 bg-gray-50 border-t border-gray-100">
            <button
              className="px-4 py-1 rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300"
              onClick={handleCancel}
              type="button"
              disabled={editLoading}
            >
              {t("user_info.cancel")}
            </button>
            <button
              className="px-4 py-1 rounded bg-primary text-white font-medium hover:bg-primary/90 disabled:bg-gray-300"
              onClick={handleSave}
              type="button"
              disabled={editLoading}
            >
              {editLoading ? t("user_info.saving") : t("user_info.save")}
            </button>
          </div>
        )}
      </div>
      {/* 2 icon đổi mật khẩu & chỉnh sửa */}
      <div className="flex gap-4 justify-center mt-6">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded bg-slate-800 text-white hover:bg-slate-700 transition-all text-base font-medium"
          type="button"
          onClick={() => setShowChangePassword(true)}
        >
          <FiKey className="text-lg" /> {t("change_password.title")}
        </button>
        {!editMode && (
          <button
            className="flex items-center gap-2 px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition-all text-base font-medium"
            type="button"
            onClick={handleEdit}
          >
            <FiEdit2 className="text-lg" /> {t("user_info.edit")}
          </button>
        )}
      </div>
      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
      {/* Danh sách các gói dịch vụ */}
      <PlanListInUser
        currentPlanName={user.plan?.name}
        isExpiring={daysLeft !== null && daysLeft <= 2 && daysLeft > 0}
        isExpired={isExpired}
        currentPlanStorage={user.plan?.storage}
        user={user} // truyền prop user
        onRenew={
          hasPendingOrder
            ? undefined
            : (plan) => handlePlanAction(plan, "renew")
        }
        onChoose={hasPendingOrder ? undefined : handlePlanAction}
      />
      <PlanChangeSummaryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={user}
        currentPlan={currentPlan}
        targetPlan={targetPlan}
        actionType={modalAction} // vẫn truyền actionType cho modal, nhưng callback sẽ trả về type
        onConfirm={handleConfirmPlanChange}
        // Disable modal nếu có pending order
        disabled={hasPendingOrder}
      />
    </div>
  );
}
