"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoClose } from "react-icons/io5";
import { useTranslations } from "next-intl";
const pad2 = (n) => n.toString().padStart(2, "0");
const sameYMD = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const toLocalParts = (iso) => {
  if (!iso) return { date: null, hh: "09", mm: "00" };
  const d = new Date(iso);
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return { date: d, hh, mm };
};
const toISOFromLocal = (dateObj, hh, mm) => {
  if (!dateObj) return null;
  const local = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
    parseInt(hh || "0", 10),
    parseInt(mm || "0", 10),
    0,
    0
  );
  return new Date(
    local.getTime() - local.getTimezoneOffset() * 60000
  ).toISOString();
};
function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const daysInMonth = last.getDate();
  const dowMon0 = (d) => (d + 6) % 7;
  const leadBlank = dowMon0(first.getDay());
  const cells = [];
  for (let i = 0; i < leadBlank; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}
export default function DuePopover({
  open,
  onClose,
  value,
  onChange,
  className = "",
  label,
}) {
  const panelRef = useRef(null);
  const t = useTranslations();
  const displayLabel = label || t("job_management.card.due_date");
  const {
    date: initDate,
    hh: initH,
    mm: initM,
  } = useMemo(() => toLocalParts(value), [value]);
  const [enabled, setEnabled] = useState(Boolean(value));
  const [pickedDate, setPickedDate] = useState(initDate);
  const [hour, setHour] = useState(initH);
  const [minute, setMinute] = useState(initM);
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState((initDate || today).getFullYear());
  const [viewMonth, setViewMonth] = useState((initDate || today).getMonth());
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
  useEffect(() => {
    const { date, hh, mm } = toLocalParts(value);
    setEnabled(Boolean(value));
    setPickedDate(date);
    setHour(hh);
    setMinute(mm);
    const base = date || new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
  }, [value]);
  const weeks = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );
  const applyAndClose = () => {
    const iso = enabled ? toISOFromLocal(pickedDate, hour, minute) : null;
    onChange?.(iso);
    onClose?.();
  };
  const clearDue = () => {
    setEnabled(false);
    setPickedDate(null);
    onChange?.(null);
    onClose?.();
  };
  const gotoPrevMonth = () => {
    const m = viewMonth - 1;
    if (m < 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(m);
    }
  };
  const gotoNextMonth = () => {
    const m = viewMonth + 1;
    if (m > 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(m);
    }
  };
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];
  const dowShort = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  if (!open) return null;
  const hourOpts = Array.from({ length: 24 }, (_, i) => pad2(i));
  const minuteOpts = Array.from({ length: 12 }, (_, i) => pad2(i * 5));
  return (
    <div
      ref={panelRef}
      className={`absolute z-50 top-full mt-2 w-[22rem] rounded-2xl border border-gray-200 bg-white shadow-2xl ${className}`}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={displayLabel}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 select-none">
            <input
              type="checkbox"
              className="accent-brand-600"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-900">
              {displayLabel}
            </span>
          </label>
        </div>
        <button
          className="p-1 rounded-md hover:bg-white text-gray-600"
          onClick={onClose}
          aria-label={t("job_management.board.close")}
        >
          <IoClose size={16} />
        </button>
      </div>
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <button
            className="h-8 px-2 rounded-lg border border-gray-200 hover:bg-white text-sm"
            onClick={gotoPrevMonth}
            disabled={!enabled}
          >
            ←
          </button>
          <div className="text-sm font-semibold text-gray-900">
            {monthNames[viewMonth]} {viewYear}
          </div>
          <button
            className="h-8 px-2 rounded-lg border border-gray-200 hover:bg-white text-sm"
            onClick={gotoNextMonth}
            disabled={!enabled}
          >
            →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs text-gray-600 select-none">
          {dowShort.map((d) => (
            <div key={d} className="h-7 grid place-items-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((d, idx) => {
            if (!d) return <div key={`b-${idx}`} className="h-9" />;
            const isToday = sameYMD(d, today);
            const isPicked = pickedDate && sameYMD(d, pickedDate);
            const inThisMonth = d.getMonth() === viewMonth;
            return (
              <button
                key={d.toISOString()}
                disabled={!enabled}
                onClick={() => setPickedDate(d)}
                className={[
                  "h-9 w-full rounded-lg text-sm transition",
                  "border",
                  isPicked
                    ? "bg-brand-600 text-white border-brand-600"
                    : isToday
                    ? "border-brand-300"
                    : "border-gray-200",
                  inThisMonth ? "opacity-100" : "opacity-40",
                  enabled ? "hover:bg-white" : "opacity-50 cursor-not-allowed",
                ].join("")}
                title={d.toLocaleDateString()}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-600 w-16">
            {t("job_management.board.time")}
          </div>
          <select
            disabled={!enabled}
            value={hour}
            onChange={(e) => setHour(e.target.value)}
            className="h-9 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-400 disabled:opacity-50"
          >
            {hourOpts.map((h) => (
              <option key={h} value={h}>
                {h} giờ
              </option>
            ))}
          </select>
          <select
            disabled={!enabled}
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            className="h-9 w-28 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-400 disabled:opacity-50"
          >
            {minuteOpts.map((m) => (
              <option key={m} value={m}>
                {m} phút
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={!enabled}
            onClick={() => {
              const d = new Date();
              setViewYear(d.getFullYear());
              setViewMonth(d.getMonth());
              setPickedDate(
                new Date(d.getFullYear(), d.getMonth(), d.getDate())
              );
            }}
            className="h-8 px-3 rounded-lg border border-gray-200 text-sm hover:bg-white disabled:opacity-50"
          >
            Hôm nay
          </button>
          <button
            disabled={!enabled}
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              setViewYear(d.getFullYear());
              setViewMonth(d.getMonth());
              setPickedDate(
                new Date(d.getFullYear(), d.getMonth(), d.getDate())
              );
            }}
            className="h-8 px-3 rounded-lg border border-gray-200 text-sm hover:bg-white disabled:opacity-50"
          >
            Ngày mai
          </button>
          <button
            disabled={!enabled}
            onClick={() => {
              const d = new Date();
              const day = d.getDay();
              const delta = (1 - day + 7) % 7 || 7;
              d.setDate(d.getDate() + delta);
              setViewYear(d.getFullYear());
              setViewMonth(d.getMonth());
              setPickedDate(
                new Date(d.getFullYear(), d.getMonth(), d.getDate())
              );
            }}
            className="h-8 px-3 rounded-lg border border-gray-200 text-sm hover:bg-white disabled:opacity-50"
          >
            Thứ 2 tới
          </button>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={applyAndClose}
            className="flex-1 h-9 rounded-lg bg-brand-600 text-white text-sm disabled:opacity-50 hover:bg-brand-500"
            disabled={enabled && !pickedDate}
          >
            {t("job_management.modal.save")}
          </button>
          <button
            onClick={clearDue}
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm hover:bg-white"
          >
            Gỡ bỏ
          </button>
        </div>
      </div>
    </div>
  );
}
