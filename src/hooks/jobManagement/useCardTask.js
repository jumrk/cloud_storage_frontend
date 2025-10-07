import { useMemo, useState } from "react";

function formatDate(d) {
  try {
    if (d == null || d === "") return "";

    let dt;
    if (d instanceof Date) {
      dt = d;
    } else if (typeof d === "number") {
      dt = new Date(d);
    } else if (typeof d === "string") {
      const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      dt = m
        ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
        : new Date(d);
    } else {
      return "";
    }

    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

const COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-fuchsia-500",
];

function pickColor(input) {
  const s = typeof input === "string" ? input : String(input ?? "");
  if (!s.length) return COLORS[0];
  const a = s.codePointAt(0) || 0;
  const b = s.codePointAt(s.length - 1) || 0;
  return COLORS[(a + b) % COLORS.length];
}

function firstLetter(name) {
  const s = typeof name === "string" ? name.trim() : String(name ?? "").trim();
  return s ? s.charAt(0).toUpperCase() : "?";
}

export function useCardTask(
  idOrTitle,
  desc,
  progress,
  dueDate,
  members = [],
  labels = [],
  showDetails = false
) {
  const [openDetail, setOpenDetail] = useState(false);

  const hasDesc = !!desc;
  const hasProgress = Number.isFinite(Number(progress));
  const hasDue = !!dueDate;
  const hasMembers = Array.isArray(members) && members.length > 0;
  const hasLabels = Array.isArray(labels) && labels.length > 0;

  const shouldShowDetails =
    showDetails || hasDesc || hasProgress || hasDue || hasMembers || hasLabels;

  const pct = useMemo(
    () => (hasProgress ? Math.min(100, Math.max(0, Number(progress))) : 0),
    [hasProgress, progress]
  );

  const dateStr = useMemo(
    () => (hasDue ? formatDate(dueDate) : ""),
    [hasDue, dueDate]
  );

  const barColor = hasProgress
    ? pct < 30
      ? "#FF7979"
      : pct < 80
      ? "#FFA048"
      : "#22C55E"
    : "#94A3B8";

  const handleOpenDetail = () => setOpenDetail(true);
  const handleCloseDetail = () => setOpenDetail(false);

  return {
    shouldShowDetails,
    hasDesc,
    hasProgress,
    hasDue,
    hasMembers,
    hasLabels,
    pct,
    dateStr,
    openDetail,
    barColor,
    firstLetter,
    pickColor,
    handleOpenDetail,
    handleCloseDetail,
  };
}

export default useCardTask;
