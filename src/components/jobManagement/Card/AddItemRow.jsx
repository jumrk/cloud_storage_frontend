"use client";
import React, { useEffect, useRef, useState } from "react";

export default function AddItemRow({ onClose, onAdd }) {
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const reset = () => setText("");

  const submit = async () => {
    const t = text.trim();
    if (!t) return;
    await onAdd?.({ text: t, assignee: null, dueAt: null });
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
          placeholder="Thêm một mục…"
          className="min-w-0 w-full h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="h-9 px-3 rounded-lg border border-neutral-300 bg-white text-sm hover:bg-neutral-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={!text.trim()}
            className="h-9 px-4 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            Thêm
          </button>
        </div>
      </div>
    </form>
  );
}
