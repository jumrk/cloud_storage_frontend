"use client";
import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export default function AddItemRow({ onClose, onAdd }) {
  const [text, setText] = useState("");
  const inputRef = useRef(null);
  const t = useTranslations();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const reset = () => setText("");

  const submit = async () => {
    const trimmedText = text.trim();
    if (!trimmedText) return;
    await onAdd?.({ text: trimmedText, assignee: null, dueAt: null });
    reset();
  };

  const handleClose = () => {
    onClose?.();
    reset();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="w-full rounded-xl bg-white px-3 py-2"
    >
      <div className="grid gap-2 items-center grid-cols-[auto,1fr,auto]">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("job_management.checklist.add_item")}
          className="min-w-0 w-full h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="h-9 px-3 rounded-lg border border-border bg-white text-sm hover:bg-surface-50"
          >
            {t("job_management.modal.cancel")}
          </button>
          <button
            type="submit"
            disabled={!text.trim()}
            className="h-9 px-4 rounded-lg text-sm text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50"
          >
            {t("job_management.modal.add")}
          </button>
        </div>
      </div>
    </form>
  );
}
