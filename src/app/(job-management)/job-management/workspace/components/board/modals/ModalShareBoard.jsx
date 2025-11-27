"use client";
import ModalShareBoardSkeleton from "@/shared/skeletons/ModalShareBoardSkeleton";
import Button from "@/shared/ui/button";
import Input from "@/shared/ui/Input";
import React, { useState, useRef, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { useTranslations } from "next-intl";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";

const firstLetter = (s = "") => (s.trim()[0] || "?").toUpperCase();
const colorOf = (s = "") =>
  [
    "bg-brand-500",
    "bg-accent-500",
    "bg-success-500",
    "bg-info-500",
    "bg-warning-500",
    "bg-danger-500",
  ][(s.charCodeAt(0) + (s.charCodeAt(s.length - 1) || 0)) % 6];

export default function ModalShareBoard({
  open,
  onClose,
  members = [],
  onAdd,
  onRemove,
  loading,
}) {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  if (!open) return null;

  const handleAdd = () => {
    if (!email.trim()) return;
    onAdd?.(email.trim());
    setEmail("");
  };

  if (loading) return <ModalShareBoardSkeleton />;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center px-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-border">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-strong">
                Chia sẻ bảng
              </h3>
              <button
                onClick={onClose}
                className="rounded-md p-2 text-text-muted hover:bg-surface-50"
                aria-label={t("job_management.modal.close")}
              >
                <FiX />
              </button>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-text-strong">
                {t("job_management.modal.add_member_by_email")}
              </label>
              <form onSubmit={handleAdd} className="flex gap-2 items-center">
                <Input
                  ref={inputRef}
                  value={email}
                  handelChange={(e) => setEmail(e.target.value)}
                  placeholder="nhap-email@congty.com"
                  className="w-full"
                />
                <Button
                  className={"mt-3"}
                  size="lg"
                  disabled={loading}
                  type="submit"
                  handleClick={handleAdd}
                  loading={loading}
                  children={t("job_management.modal.add")}
                />
              </form>
              <p className="mt-1 text-xs text-text-muted">
                {t("job_management.modal.add_member_note")}
              </p>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-text-strong">
                Thành viên hiện có
              </p>
              {members.length === 0 ? (
                <p className="mt-2 text-sm text-text-muted">
                  Chưa có thành viên.
                </p>
              ) : (
                <ul className="mt-2 max-h-[130px] overflow-auto rounded-xl border border-border divide-y divide-border">
                  {members.map((m, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-semibold overflow-hidden ${
                            m.avatar ? "" : colorOf(m.name)
                          }`}
                        >
                          {m.avatar ? (
                            <img
                              src={getAvatarUrl(m.avatar)}
                              alt={m.name || "avatar"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            firstLetter(m.name)
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-text-strong">
                            {m.name}
                          </p>
                          <p className="text-xs text-text-muted">{m.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemove?.(m.id)}
                        className="rounded-lg px-2 py-1 text-sm text-danger-600 hover:bg-danger-50"
                      >
                        Gỡ
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2 text-sm text-text-strong hover:bg-surface-50"
              >
                {t("job_management.modal.close")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
