"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoClose } from "react-icons/io5";

export default function MembersPopover({
  open,
  onClose,
  members = [],
  selectedIds = [],
  onChange,
  className = "",
}) {
  const panelRef = useRef(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => (m.fullName || "").toLowerCase().includes(q));
  }, [members, query]);

  const isChecked = (id) => selectedIds.includes(id);
  const toggle = (id) => {
    const next = isChecked(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onChange?.(next);
  };

  if (!open) return null;
  return (
    <div
      ref={panelRef}
      className={`absolute z-50 top-full mt-2 w-80 rounded-xl border border-neutral-300 bg-white shadow-xl ${className}`}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Thành viên"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200">
        <span className="font-medium text-neutral-800">Thành viên</span>
        <button
          className="p-1 rounded-md hover:bg-neutral-100"
          onClick={onClose}
        >
          <IoClose size={16} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm các thành viên"
          className="w-full h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-500"
        />

        <div className="text-xs text-neutral-500">Thành viên của bảng</div>

        <div className="max-h-64 overflow-auto divide-y divide-neutral-100">
          {filtered.length === 0 && (
            <div className="text-sm text-neutral-500 py-2">Không tìm thấy</div>
          )}
          {filtered.map((m) => (
            <label
              key={m.id}
              className="flex items-center gap-3 py-2 cursor-pointer"
              title={m.fullName}
            >
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={isChecked(m.id)}
                onChange={() => toggle(m.id)}
              />
              <div className="h-8 w-8 rounded-full bg-teal-600 text-white grid place-items-center font-semibold overflow-hidden">
                {m.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (m.fullName || "U").slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-neutral-800 truncate">
                  {m.fullName}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
