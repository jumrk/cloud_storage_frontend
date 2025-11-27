"use client";
import Button from "@/shared/ui/button";
import Input from "@/shared/ui/Input";
import React, { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function CreateBoardModal({
  open,
  onClose,
  title,
  setTitle,
  loading,
  err,
  inputRef,
  handleSubmit,
}) {
  const t = useTranslations();
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-border">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-strong">
                {t("job_management.board.create_new_board")}
              </h3>
            </div>
            <label className="mt-4 block text-sm font-medium text-text-strong">
              Tiêu đề bảng (Tiêu đề là bắt buộc)
            </label>
            <form onSubmit={handleSubmit}>
              <Input
                ref={inputRef}
                value={title}
                handelChange={(e) => setTitle(e.target.value)}
                placeholder={t("job_management.modal.board_name_placeholder")}
                errors={err}
              />
              <div className="mt-5 flex items-center justify-end gap-2">
                <Button
                  handleClick={onClose}
                  children={t("job_management.modal.cancel")}
                  color="brand"
                  variant="outline"
                  disabled={loading}
                  type="button"
                />
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  loading={loading}
                  children={t("job_management.board.create_board")}
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
