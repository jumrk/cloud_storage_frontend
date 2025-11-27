"use client";
import React from "react";
import { FiTrash2, FiStar } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { useTranslations } from "next-intl";
import Image from "next/image";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";

const COLORS = [
  "bg-brand-500",
  "bg-accent-500",
  "bg-success-500",
  "bg-warning-500",
  "bg-info-500",
  "bg-danger-500",
];
const pickColor = (s = "") =>
  COLORS[(s.charCodeAt(0) + (s.charCodeAt(s.length - 1) || 0)) % COLORS.length];
const firstLetter = (s = "") => (s.trim()[0] || "?").toUpperCase();

export default function CardBoard({
  title = "Tên bảng",
  createdBy = "Unknown",
  createdByAvatar = "",
  onClick,
  onDelete,
  pinned = false,
  onTogglePin,
  showPin = false,
  showDelete = true,
}) {
  const t = useTranslations();
  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === " ") onClick?.(e);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKey}
      className="group relative select-none cursor-pointer min-w-[220px] w-[220px] h-[96px]
                 rounded-2xl border border-border bg-gradient-to-b from-white to-surface-50 p-3 text-left
                 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-brand-200 active:translate-y-0
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 transition"
    >
      {showPin && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin?.();
          }}
          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white/90 text-amber-500 shadow-sm hover:bg-amber-50 transition"
          aria-label={pinned ? t("job_management.board.unpin_board") : t("job_management.board.pin_board")}
          title={pinned ? t("job_management.board.unpin_board") : t("job_management.board.pin_board")}
        >
          {pinned ? <FaStar className="h-4 w-4" /> : <FiStar className="h-4 w-4" />}
        </button>
      )}

      {showDelete && onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition
                   inline-flex h-8 w-8 items-center justify-center rounded-full
                   bg-white/90 text-danger-600 border border-danger-100 shadow-sm"
          aria-label={t("job_management.board.delete_board")}
          title={t("job_management.board.delete_board")}
        >
          <FiTrash2 className="h-4 w-4" />
        </button>
      )}

      <p
        className="text-[15px] font-semibold text-text-strong truncate pr-10"
        title={title}
      >
        {title}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ring-2 ring-white overflow-hidden ${
            createdByAvatar ? "" : pickColor(createdBy)
          }`}
          title={createdBy}
        >
          {createdByAvatar ? (
            <Image
              src={getAvatarUrl(createdByAvatar)}
              alt={createdBy}
              width={28}
              height={28}
              className="h-full w-full object-cover"
            />
          ) : (
            firstLetter(createdBy)
          )}
        </span>
        <span className="text-[12px] text-text-muted truncate">
          {createdBy}
        </span>
      </div>
    </div>
  );
}
