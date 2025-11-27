"use client";
import React, { useRef } from "react";
import { useTimeline } from "../../../context/TimelineContext";

export default function TrackLane({
  height,
  autoHeight = false,
  minHeight = 32,
  label,
  badge,
  rows = 0,
  rowHeight = 56,
  rowGap = 8,
  children,
  onSeekByClick = true,
  onDragOver,
  onDrop,
  className = "",
}) {
  const { toSec, toPx, setCurrentTime, duration } = useTimeline();
  const laneRef = useRef(null);

  const contentW = Math.max(1, Math.ceil(toPx(duration)));
  const rowsCount = Math.max(0, Number.isFinite(rows) ? rows : 0);
  const contentH = rowsCount > 0 ? Math.ceil(rowsCount * rowHeight) : 0;

  const outerH = autoHeight
    ? Math.max(minHeight, contentH)
    : height ?? Math.max(minHeight, contentH);

  const handleBackgroundClick = (e) => {
    if (!onSeekByClick) return;
    const el = laneRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left + el.scrollLeft;
    setCurrentTime(toSec(x));
  };

  const handleDragOverInternal = (e) => {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = "copy";
    } catch {}
    onDragOver?.(e);
  };

  return (
    <div
      className={`relative w-full mt-2 border-b  border-border/30  ${className}`}
      style={{ height: outerH }}
    >
      <div className="absolute left-2 top-1 z-[1] flex items-center gap-1">
        {badge ? (
          <span className="rounded-full bg-white/90 ring-1 ring-border/50 px-2 py-[2px] text-[10px] text-text-muted">
            {badge}
          </span>
        ) : null}
        {label ? (
          <span className="rounded px-1.5 py-0.5 text-[11px] leading-none text-text-muted bg-white/85 ring-1 ring-border/50">
            {label}
          </span>
        ) : null}
      </div>

      <div
        ref={laneRef}
        data-track-content
        onDoubleClick={handleBackgroundClick}
        onDragOver={handleDragOverInternal}
        onDrop={onDrop}
        className="relative h-full"
        style={{ width: contentW }}
        role="group"
        aria-label={label || "Track lane"}
      >
        <div className="relative" style={{ width: contentW, height: contentH }}>
          {children}
        </div>
      </div>
    </div>
  );
}
