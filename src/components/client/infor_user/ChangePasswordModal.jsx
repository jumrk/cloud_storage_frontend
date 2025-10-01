import useChangePassword from "@/hooks/leader/inforUser/useChangePassword";
import React from "react";

export default function ChangePasswordModal({ open, onClose }) {
  const { form, t, errors, loading, handleChange, handleSubmit } =
    useChangePassword();
  if (!open) return null;

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
          {t("change_password.title")}
        </h2>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <input
            type="password"
            name="oldPassword"
            className={`bg-slate-50 border rounded px-4 py-2 text-base focus:outline-none ${
              errors.oldPassword ? "border-red-500" : "border-slate-200"
            }`}
            placeholder={t("change_password.old_password_placeholder")}
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
            placeholder={t("change_password.new_password_placeholder")}
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
            placeholder={t("change_password.confirm_password_placeholder")}
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
              {t("change_password.cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-indigo-600 text-white shadow hover:bg-indigo-700 transition-all text-base font-medium"
              disabled={loading}
            >
              {loading
                ? t("change_password.changing")
                : t("change_password.confirm_change")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
