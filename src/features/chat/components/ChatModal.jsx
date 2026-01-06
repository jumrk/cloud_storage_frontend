"use client";
import React from "react";
import { FiUser, FiX } from "react-icons/fi";
import "react-loading-skeleton/dist/skeleton.css";
import { useTranslations } from "next-intl";
const ICON_SIZE = 22;
export default function ChatModal({ open, onClose, options, onSelect }) {
  const t = useTranslations();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl p-6 min-w-[320px] max-w-xs relative border border-[var(--color-border)]">
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-danger"
          onClick={onClose}
        >
          <FiX size={20} />
        </button>
        <div className="font-bold text-lg mb-4 flex items-center gap-2 text-brand">
          <FiUser size={ICON_SIZE} /> {t("chat.modal.new_conversation")}
        </div>
        <div className="flex flex-col gap-2">
          {options.map((opt) => (
            <button
              key={opt.id}
              className="w-full px-4 py-2 rounded-lg bg-brand-50 text-brand font-semibold hover:opacity-90 flex items-center gap-2 transition"
              onClick={() => {
                onSelect(opt.id);
                onClose();
              }}
            >
              <FiUser size={ICON_SIZE} /> {opt.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
