"use client";
import React, { useState, useRef, useEffect } from "react";
import { FiX } from "react-icons/fi";

const firstLetter = (s = "") => (s.trim()[0] || "?").toUpperCase();
const colorOf = (s = "") =>
  [
    "bg-indigo-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-sky-500",
    "bg-fuchsia-500",
  ][(s.charCodeAt(0) + (s.charCodeAt(s.length - 1) || 0)) % 6];

export default function ModalShareBoard({
  open,
  onClose,
  members = [],
  onAdd,
  onRemove,
}) {
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

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center px-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Chia sẻ bảng</h3>
              <button
                onClick={onClose}
                className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100"
                aria-label="Đóng"
              >
                <FiX />
              </button>
            </div>

            {/* Add by email */}
            <div className="mt-4">
              <label className="text-sm font-medium text-neutral-800">
                Thêm thành viên bằng email
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  ref={inputRef}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nhap-email@congty.com"
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                />
                <button
                  onClick={handleAdd}
                  className="whitespace-nowrap rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  Thêm
                </button>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Chỉ email đã có trong hệ thống mới thêm được .
              </p>
            </div>

            {/* Current members */}
            <div className="mt-5">
              <p className="text-sm font-medium text-neutral-800">
                Thành viên hiện có
              </p>
              {members.length === 0 ? (
                <p className="mt-2 text-sm text-neutral-500">
                  Chưa có thành viên.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-neutral-100 max-h-[130px] overflow-auto  rounded-xl border border-neutral-100">
                  {members.map((m, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-semibold ${colorOf(
                            m.name
                          )}`}
                        >
                          {firstLetter(m.name)}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {m.name}
                          </p>
                          <p className="text-xs text-neutral-500">{m.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemove?.(m.id)}
                        className="rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50"
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
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
