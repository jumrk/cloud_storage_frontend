"use client";
import React, { useEffect, useRef } from "react";
import { IoClose, IoCheckmark } from "react-icons/io5";

export default function LabelPopover({
  open,
  onClose,
  palette = [], // string[] hex
  selected = [], // string[] hex
  onChange, // (nextColors: string[]) => void
  className = "",
}) {
  const panelRef = useRef(null);

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

  if (!open) return null;

  const isOn = (hex) => selected.includes(hex);
  const toggle = (hex) => {
    const next = isOn(hex)
      ? selected.filter((c) => c !== hex)
      : [...selected, hex];
    onChange?.(next);
  };

  const clearAll = () => onChange?.([]);

  return (
    <div
      ref={panelRef}
      className={`absolute z-50 top-full mt-2 w-72 rounded-xl border border-neutral-300 bg-white shadow-xl ${className}`}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Chọn màu"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200">
        <span className="font-medium text-neutral-800">Chọn màu</span>
        <button
          className="p-1 rounded-md hover:bg-neutral-100"
          onClick={onClose}
          aria-label="Đóng"
        >
          <IoClose size={16} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-6 gap-2">
          {palette.map((hex) => (
            <button
              key={hex}
              title={hex}
              className={`relative h-8 w-8 rounded-md border ${
                isOn(hex) ? "ring-2 ring-offset-2 ring-neutral-400" : ""
              }`}
              style={{ backgroundColor: hex }}
              onClick={() => toggle(hex)}
            >
              {isOn(hex) && (
                <span className="absolute inset-0 grid place-items-center text-white">
                  <IoCheckmark />
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
          <div className="text-xs text-neutral-500">
            Đang chọn: {selected.length}
          </div>
          {selected.length > 0 && (
            <button
              className="text-sm px-2 py-1 rounded-md hover:bg-neutral-100"
              onClick={clearAll}
            >
              Bỏ chọn hết
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
