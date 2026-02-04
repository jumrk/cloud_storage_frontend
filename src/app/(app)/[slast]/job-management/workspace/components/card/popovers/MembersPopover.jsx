"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { IoClose } from "react-icons/io5";
import { useTranslations } from "next-intl";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";
export default function MembersPopover({
  open,
  onClose,
  members = [],
  selectedIds = [],
  onChange,
  className = "",
  anchorEl,
}) {
  const panelRef = useRef(null);
  const [query, setQuery] = useState("");
  const t = useTranslations();
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
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorEl) return;
    const updatePosition = () => {
      const rect = anchorEl.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      // Position below the anchor
      let top = rect.bottom + scrollY + 8;
      let left = rect.left + scrollX;
      
      // Basic bounds check (optional, but good for UX)
      if (left + 320 > window.innerWidth) {
        left = window.innerWidth - 330; 
      }
      
      setCoords({ top, left });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorEl]);

  if (!open) return null;

  const content = (
    <div
      ref={panelRef}
      className={`fixed z-[9999] w-80 rounded-xl border border-gray-200 bg-white shadow-xl ${className}`}
      style={{ top: coords.top, left: coords.left }}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={t("job_management.card.members")}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <span className="font-medium text-gray-900">
          {t("job_management.card.members")}
        </span>
        <button
          className="p-1 rounded-md hover:bg-white text-gray-600"
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
          placeholder={t("job_management.card.search_members")}
          className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-400"
        />
        <div className="text-xs text-gray-600">
          {t("job_management.card.board_members")}
        </div>
        <div className="max-h-64 overflow-auto divide-y divide-border">
          {filtered.length === 0 && (
            <div className="text-sm text-gray-600 py-2">
              {t("job_management.card.not_found")}
            </div>
          )}
          {filtered.map((m) => (
            <label
              key={m.id}
              className="flex items-center gap-3 py-2 cursor-pointer"
              title={m.fullName}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-600"
                checked={isChecked(m.id)}
                onChange={() => toggle(m.id)}
              />
              <div className="h-8 w-8 rounded-full bg-accent-500 text-white grid place-items-center font-semibold overflow-hidden">
                {m.avatar ? (
                  <img
                    src={getAvatarUrl(m.avatar)}
                    alt={m.fullName || "avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (m.fullName || "U").slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-gray-900 truncate">
                  {m.fullName}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
  
  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(content, document.body);
}
