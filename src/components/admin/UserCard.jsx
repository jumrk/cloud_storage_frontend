import { useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import Loader from "@/components/ui/Loader";
import { formatSize } from "@/utils/driveUtils";

const UserIcon = () => (
  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-3xl shadow">
    <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" fill="#3b82f6" />
      <path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4v1H4v-1z" fill="#60a5fa" />
    </svg>
  </div>
);

const ActionIcon = ({ title, onClick, children, className }) => (
  <button
    title={title}
    onClick={onClick}
    className={`ml-2 p-2 rounded-full hover:bg-blue-100 transition-colors ${className}`}
    tabIndex={-1}
  >
    {children}
  </button>
);

function ConfirmModal({ open, onConfirm, onCancel, user }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/10 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-xs animate-fade-in flex flex-col items-center">
        <div className="text-xl font-bold text-red-600 mb-2">
          Xác nhận xóa user?
        </div>
        <div className="text-gray-700 text-center mb-4">
          Bạn có chắc muốn xóa user{" "}
          <span className="font-semibold">{user.fullName || user.email}</span>?
        </div>
        <div className="flex gap-3 mt-2">
          <button
            className="px-4 py-2 rounded bg-red-500 text-white font-semibold hover:bg-red-600 transition"
            onClick={onConfirm}
          >
            Xóa
          </button>
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
            onClick={onCancel}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>,
    typeof window !== "undefined" ? document.body : null
  );
}

export default function UserCard({
  user,
  open,
  setOpen,
  onUserChange,
  onUserDelete,
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [currentRole, setCurrentRole] = useState(user.role);
  // Mobile: tap mở rộng, Desktop: hover mở rộng
  const handleMouseEnter = () => window.innerWidth >= 768 && setOpen(user._id);
  const handleMouseLeave = () => window.innerWidth >= 768 && setOpen(null);
  const handleClick = () =>
    window.innerWidth < 768 && setOpen(open ? null : user._id);

  const handlePromote = async (e) => {
    e.stopPropagation();
    if (loadingRole) return;
    setLoadingRole(true);
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      const res = await axios.patch(`/api/admin/users/role/${user._id}`, {
        role: newRole,
      });
      setCurrentRole(res.data.role);
      if (onUserChange) onUserChange(user._id, res.data.role);
      toast.success(
        newRole === "admin"
          ? `Đã phân quyền admin cho: ${user.fullName || user.email}`
          : `Đã hạ quyền user cho: ${user.fullName || user.email}`
      );
    } catch (err) {
      toast.error(err?.response?.data?.error || "Lỗi phân quyền");
    } finally {
      setLoadingRole(false);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setLoadingDelete(true);
    try {
      await axios.delete(`/api/admin/users/delete/${user._id}`);
      toast.success("Xóa user thành công!");
      if (onUserDelete) onUserDelete(user._id);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Lỗi xóa user");
    } finally {
      setShowConfirm(false);
      setLoadingDelete(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    toast("Đã hủy xóa user.");
  };

  return (
    <div
      className={`relative bg-white rounded-xl shadow transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-4 w-[300px] transform-gpu will-change-transform overflow-hidden ${
        open ? "z-20 scale-105 ring-2 ring-blue-200 h-[420px]" : "h-[180px]"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      tabIndex={0}
      style={{
        transitionProperty:
          "height, box-shadow, transform, border, opacity, padding",
        transitionDuration: "300ms",
      }}
    >
      <UserIcon />
      <div className="mt-3 text-lg font-semibold text-gray-800 text-center truncate w-full flex justify-center">
        {user.fullName || "Chưa đặt tên"}
      </div>
      <div className="text-sm text-gray-500 text-center truncate w-full flex justify-center">
        {user.email}
      </div>
      {/* Info mở rộng */}
      <div
        className={`transition-all duration-300 overflow-hidden flex flex-col items-center w-full ${
          open ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
        }`}
      >
        <div className="text-lg font-bold text-blue-700 mb-2 text-center w-full flex justify-center">
          {user.fullName || "Chưa đặt tên"}
        </div>
        <div className="text-sm text-gray-700 mb-1 w-full flex justify-center">
          <span className="font-medium">Email:</span>&nbsp;{user.email}
        </div>
        <div className="text-sm text-gray-700 mb-1 w-full flex justify-center">
          <span className="font-medium">Số điện thoại:</span>&nbsp;
          {user.phone || "—"}
        </div>
        <div className="text-sm text-gray-700 mb-1 w-full flex justify-center">
          <span className="font-medium">Ngày sinh:</span>&nbsp;
          {user.dateOfBirth
            ? new Date(user.dateOfBirth).toLocaleDateString()
            : "—"}
        </div>
        <div className="text-sm text-gray-700 mb-1 w-full flex justify-center">
          <span className="font-medium">Vai trò:</span>&nbsp;{user.role}
        </div>
        <div className="text-sm text-gray-700 mb-1 w-full flex justify-center">
          <span className="font-medium">Tổng file:</span>&nbsp;
          {user.totalFiles ?? 0}
        </div>
        <div className="text-sm text-gray-700 mb-1 w-full flex justify-center">
          <span className="font-medium">Dung lượng đã dùng:</span>&nbsp;
          {formatSize(user.usedStorage)}
        </div>
        <div className="text-sm text-gray-700 mb-2 w-full flex justify-center">
          <span className="font-medium">Ngày tạo:</span>&nbsp;
          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
        </div>
        <div className="flex gap-2 justify-center w-full mt-2">
          <ActionIcon
            title={
              currentRole === "admin" ? "Hạ quyền user" : "Phân quyền admin"
            }
            onClick={handlePromote}
            className={loadingRole ? "opacity-60 pointer-events-none" : ""}
          >
            <FaStar
              size={22}
              color={currentRole === "admin" ? "#facc15" : "#d1d5db"}
              style={{
                filter:
                  currentRole === "admin"
                    ? "drop-shadow(0 0 4px #facc15)"
                    : "none",
              }}
            />
          </ActionIcon>
          <ActionIcon
            title="Xóa user"
            onClick={handleDelete}
            className={loadingDelete ? "opacity-60 pointer-events-none" : ""}
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path
                d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                fill="#ef4444"
              />
            </svg>
          </ActionIcon>
        </div>
      </div>
      {/* Không còn Loader nhỏ overlay */}
      <ConfirmModal
        open={showConfirm}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        user={user}
      />
    </div>
  );
}
