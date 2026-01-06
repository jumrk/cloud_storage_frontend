import Button from "@/shared/ui/button";
import Input from "@/shared/ui/Input";
import React from "react";

function ModalAdd({
  t,
  handleFormSubmit,
  form,
  handleFormChange,
  loading,
  checkingEmail,
  emailExists,
  checkingSlast,
  slastExists,
  handleCloseModal,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center px-3 justify-center bg-black/30">
      <div className="bg-white rounded-3xl p-6 shadow-2xl relative border border-border">
        <h2 className="text-xl font-bold mb-4 text-center text-text-strong">
          {t("user_management.add_new")}
        </h2>
        <form onSubmit={handleFormSubmit} className="flex flex-col">
          <Input
            type="email"
            name="email"
            placeholder={t("user_management.email_placeholder")}
            value={form.email}
            handelChange={handleFormChange}
            required
            autoComplete="off"
            disabled={loading}
          />
          {checkingEmail && (
            <div className="text-xs text-brand">
              {t("user_management.checking_email")}
            </div>
          )}
          {emailExists && !checkingEmail && (
            <div className="text-xs text-danger-500">
              {t("user_management.email_exists")}
            </div>
          )}
          <Input
            type="text"
            name="fullName"
            placeholder={t("user_management.fullname_placeholder")}
            value={form.fullName}
            handelChange={handleFormChange}
            required
            autoComplete="off"
            disabled={loading}
          />
          <Input
            type="password"
            name="password"
            placeholder={t("user_management.password_placeholder")}
            value={form.password}
            handelChange={handleFormChange}
            required
            autoComplete="off"
            disabled={loading}
          />
          <div>
            <Input
              type="text"
              name="slast"
              placeholder={t("user_management.slast_placeholder")}
              value={form.slast}
              handelChange={handleFormChange}
              required
              autoComplete="off"
              disabled={loading}
            />
            <div className="text-xs text-text-muted mt-1">
              {t("user_management.slast_description")}{" "}
              {t("user_management.member_example")}{" "}
              <b>{t("user_management.slast_path")}</b>
              ). {t("user_management.slast_unique")}
            </div>
            {checkingSlast && (
              <div className="text-xs text-brand">
                {t("user_management.checking_slast")}
              </div>
            )}
            {slastExists && !checkingSlast && (
              <div className="text-xs text-danger-500">
                {t("user_management.slast_exists")}
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button
              children={t("user_management.cancel")}
              handleClick={handleCloseModal}
              disabled={loading}
              size="lg"
              color="brand"
              variant="outline"
            />
            <Button
              type="submit"
              children={t("user_management.create")}
              disabled={
                loading ||
                emailExists ||
                slastExists ||
                checkingEmail ||
                checkingSlast
              }
              loading={loading}
              size="lg"
              color="brand"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalAdd;
