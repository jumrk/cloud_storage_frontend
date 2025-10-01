"use client";
import React from "react";
import { FiTrash2 } from "react-icons/fi";

const COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-fuchsia-500",
];
const pickColor = (s = "") =>
  COLORS[(s.charCodeAt(0) + (s.charCodeAt(s.length - 1) || 0)) % COLORS.length];
const firstLetter = (s = "") => (s.trim()[0] || "?").toUpperCase();

export default function CardBoard({
  title = "Tên bảng",
  createdBy = "Unknown",
  onClick,
  onDelete,
}) {
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
                 rounded-2xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50 p-3 text-left
                 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 active:translate-y-0 transition"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.();
        }}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition
                   inline-flex h-8 w-8 items-center justify-center rounded-full
                   bg-white/90 text-red-500 border border-red-100 shadow-sm"
        aria-label="Xóa bảng"
        title="Xóa bảng"
      >
        <FiTrash2 className="h-4 w-4" />
      </button>

      <p
        className="text-[15px] font-semibold text-neutral-900 truncate pr-10"
        title={title}
      >
        {title}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-white text-sm font-semibold ring-2 ring-white ${pickColor(
            createdBy
          )}`}
          title={createdBy}
        >
          {firstLetter(createdBy)}
        </span>
        <span className="text-[12px] text-neutral-600 truncate">
          {createdBy}
        </span>
      </div>
    </div>
  );
}
