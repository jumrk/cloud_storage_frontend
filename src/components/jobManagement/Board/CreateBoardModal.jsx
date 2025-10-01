"use client";
import React, { useEffect } from "react";

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
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tạo bảng mới</h3>
              <button
                onClick={onClose}
                className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>
            <label className="mt-4 block text-sm font-medium text-neutral-800">
              Tiêu đề bảng (Tiêu đề là bắt buộc)
            </label>
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Dự án Website, Marketing Q4…"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
            />
            {err && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {err}
              </div>
            )}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-2xl cursor-pointer border border-black/30 px-4 py-2 text-sm hover:bg-neutral-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-2xl cursor-pointer bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-500 disabled:opacity-60"
              >
                {loading ? "Đang tạo..." : "Tạo bảng"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
