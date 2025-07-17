import React, { useState } from "react";
import toast from "react-hot-toast";
import axiosClient from "@/lib/axiosClient";

export default function ChangePasswordModal({ open, onClose }) {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (!open) return null;

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
        oldPassword: "Vui lòng nhập mật khẩu hiện tại",
      }));
      return;
    }
    if (!form.newPassword) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "Vui lòng nhập mật khẩu mới",
      }));
      return;
    }
    if (form.newPassword.length < 6) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "Mật khẩu mới phải từ 6 ký tự",
      }));
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Mật khẩu nhập lại không khớp",
      }));
      return;
    }
    setLoading(true);
    try {
      await axiosClient.patch("/api/user/edit/password", {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      // Xóa toàn bộ localStorage và chuyển hướng về login
      localStorage.clear();
      window.location.href = "/Login";
      return;
    } catch (err) {
      if (err.response?.data?.error) {
        setErrors({ general: err.response.data.error });
        toast.error(err.response.data.error);
      } else {
        setErrors({ general: "Có lỗi xảy ra" });
        toast.error("Có lỗi xảy ra");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative animate-fadeIn">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl"
          onClick={onClose}
          disabled={loading}
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 text-center text-slate-800">
          Đổi mật khẩu
        </h2>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <input
            type="password"
            name="oldPassword"
            className={`bg-slate-50 border rounded px-4 py-2 text-base focus:outline-none ${
              errors.oldPassword ? "border-red-500" : "border-slate-200"
            }`}
            placeholder="Mật khẩu hiện tại"
            value={form.oldPassword}
            onChange={handleChange}
            autoComplete="current-password"
            disabled={loading}
          />
          {errors.oldPassword && (
            <div className="text-red-500 text-sm mb-1">
              {errors.oldPassword}
            </div>
          )}
          <input
            type="password"
            name="newPassword"
            className={`bg-slate-50 border rounded px-4 py-2 text-base focus:outline-none ${
              errors.newPassword ? "border-red-500" : "border-slate-200"
            }`}
            placeholder="Mật khẩu mới"
            value={form.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
            disabled={loading}
          />
          {errors.newPassword && (
            <div className="text-red-500 text-sm mb-1">
              {errors.newPassword}
            </div>
          )}
          <input
            type="password"
            name="confirmPassword"
            className={`bg-slate-50 border rounded px-4 py-2 text-base focus:outline-none ${
              errors.confirmPassword ? "border-red-500" : "border-slate-200"
            }`}
            placeholder="Nhập lại mật khẩu mới"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            disabled={loading}
          />
          {errors.confirmPassword && (
            <div className="text-red-500 text-sm mb-1">
              {errors.confirmPassword}
            </div>
          )}
          {errors.general && (
            <div className="text-red-500 text-sm mb-1">{errors.general}</div>
          )}
          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400 transition-all text-base font-medium"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-indigo-600 text-white shadow hover:bg-indigo-700 transition-all text-base font-medium"
              disabled={loading}
            >
              {loading ? "Đang đổi..." : "Xác nhận đổi mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
