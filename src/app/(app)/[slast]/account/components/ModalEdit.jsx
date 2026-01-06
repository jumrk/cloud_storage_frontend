import Button from "@/shared/ui/button";
import Input from "@/shared/ui/Input";
import React from "react";

function ModalEdit({
  t,
  handleEditFormSubmit,
  editForm,
  handleEditFormChange,
  editError,
  handleCloseEditModal,
  loading,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center px-3 justify-center bg-black/30">
      <div className="bg-white rounded-xl p-6 w-full max-w-xl shadow-2xl relative border border-border">
        <h2 className="text-lg font-bold mb-4 text-text-strong">
          {t("user_management.edit_title")}
        </h2>
        <form onSubmit={handleEditFormSubmit} className="flex flex-col">
          <Input
            type="email"
            name="email"
            placeholder={t("user_management.email_placeholder")}
            value={editForm.email}
            handelChange={handleEditFormChange}
            required
          />
          <Input
            type="text"
            name="fullName"
            placeholder={t("user_management.fullname_placeholder")}
            value={editForm.fullName}
            handelChange={handleEditFormChange}
            required
          />
          <Input
            type="password"
            name="password"
            placeholder={t("user_management.new_password_placeholder")}
            value={editForm.password}
            handelChange={handleEditFormChange}
          />
          {editError && (
            <div className="text-danger-500 text-sm">{editError}</div>
          )}
          <div className="flex gap-2 justify-end mt-2">
            <Button
              type="button"
              handleClick={handleCloseEditModal}
              disabled={loading}
              variant="outline"
              color="brand"
              size="lg"
              children={t("user_management.cancel")}
            />
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              color="brand"
              children={t("user_management.save")}
              size="lg"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalEdit;
