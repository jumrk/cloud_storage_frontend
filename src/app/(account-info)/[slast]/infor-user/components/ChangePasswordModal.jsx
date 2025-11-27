import Button from "@/shared/ui/button";
import useChangePassword from "../hooks/useChangePassword";
import React from "react";
import Input from "@/shared/ui/Input";

export default function ChangePasswordModal({ open, onClose }) {
  const { form, t, errors, loading, handleChange, handleSubmit } =
    useChangePassword();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative animate-fadeIn border border-[var(--color-border)]">
        <h2 className="text-xl font-bold mb-4 text-center text-text-strong">
          {t("change_password.title")}
        </h2>

        <form className="flex flex-col " onSubmit={handleSubmit}>
          <Input
            type="password"
            name="oldPassword"
            errors={errors.oldPassword}
            placeholder={t("change_password.old_password_placeholder")}
            value={form.oldPassword}
            handelChange={handleChange}
            disabled={loading}
          />
          <Input
            type="password"
            name="newPassword"
            placeholder={t("change_password.new_password_placeholder")}
            value={form.newPassword}
            handelChange={handleChange}
            disabled={loading}
            errors={errors.newPassword}
          />

          <Input
            type="password"
            name="confirmPassword"
            placeholder={t("change_password.confirm_password_placeholder")}
            value={form.confirmPassword}
            handelChange={handleChange}
            disabled={loading}
            errors={errors.confirmPassword}
          />

          {errors.general && (
            <div className="text-danger text-sm mb-1">{errors.general}</div>
          )}

          <div className="flex gap-2 justify-end mt-2">
            <Button
              type="button"
              handleClick={onClose}
              disabled={loading}
              variant="outline"
              children={t("change_password.cancel")}
            />
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              children={t("change_password.confirm_change")}
            />
          </div>
        </form>
      </div>
    </div>
  );
}

