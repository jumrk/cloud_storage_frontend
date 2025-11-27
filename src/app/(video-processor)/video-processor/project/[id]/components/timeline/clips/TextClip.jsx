"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTimeline } from "../../../context/TimelineContext";
import { Scissors } from "lucide-react";

const DRAG_PAD_SEC = 60;
const ROW_GAP = 8;

function quantizeToFrame(sec, fps) {
  const step = fps > 0 ? 1 / fps : 0.001;
  return Math.max(0, Math.round(sec / step) * step);
}

function useEdgeAutoScroll() {
  const hostRef = useRef(null);
  const rafRef = useRef(0);
  useEffect(() => {
    hostRef.current = document.querySelector("[data-scroll-host]");
  }, []);
  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  };
  const tick = (vx) => {
    const host = hostRef.current;
    if (!host || !vx) return;
    const step = () => {
      host.scrollLeft += vx;
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };
  const run = (clientX) => {
    const host = hostRef.current;
    if (!host) return stop();
    const r = host.getBoundingClientRect();
    const edge = 48;
    let vx = 0;
    if (clientX < r.left + edge)
      vx = -((r.left + edge - clientX) / edge) * 22 - 8;
    else if (clientX > r.right - edge)
      vx = ((clientX - (r.right - edge)) / edge) * 22 + 8;
    if (Math.abs(vx) < 1) return stop();
    tick(vx);
  };
  return { run, stop };
}

export default function TextClip({
  id,
  lane = "text",
  kind = "text",
  label = "",
  startSec = 0,
  durationSec = 1,
  minDurationSec,
  color,
  rowIndex = 0,
  rowHeight = 36,
  selected = false,
  isLoading = false,
  loadingProgress = 0,
  onSelect,
  onChange,
  onCommit,
  className = "",
}) {
  const { fps, duration, toPx, pxPerSec } = useTimeline();

  const minDur = useMemo(
    () =>
      minDurationSec && minDurationSec > 0
        ? minDurationSec
        : fps > 0
        ? 1 / fps
        : 0.033,
    [minDurationSec, fps]
  );

  const [localStart, setLocalStart] = useState(startSec);
  const [localDur, setLocalDur] = useState(Math.max(minDur, durationSec));
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(null);
  const [pointerId, setPointerId] = useState(null);

  const originRef = useRef({ x: 0, start: 0, dur: 0 });
  const rafRef = useRef(0);
  const nextRef = useRef({ start: localStart, dur: localDur, mode: "idle" });
  const { run: edgeScroll, stop: stopEdgeScroll } = useEdgeAutoScroll();

  const scheduleApply = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      const n = nextRef.current;
      if (n.mode === "drag") {
        setLocalStart(n.start);
        onChange?.({ startSec: n.start, durationSec: n.dur });
      } else if (n.mode === "resize-left") {
        setLocalStart(n.start);
        setLocalDur(n.dur);
        onChange?.({ startSec: n.start, durationSec: n.dur });
      } else if (n.mode === "resize-right") {
        setLocalDur(n.dur);
        onChange?.({ startSec: originRef.current.start, durationSec: n.dur });
      }
      rafRef.current = 0;
    });
  };

  useEffect(() => {
    if (!dragging && !resizing) {
      setLocalStart(startSec);
      setLocalDur(Math.max(minDur, durationSec));
    }
  }, [startSec, durationSec, minDur, dragging, resizing]);

  const leftPx = Math.round(toPx(localStart));
  const widthPx = Math.max(6, Math.round(toPx(localDur)));
  const yPx = Math.max(0, Math.floor(rowIndex) * (rowHeight + ROW_GAP));

  const onBodyPointerDown = (e) => {
    if (e.button !== 0) return;
    setPointerId(e.pointerId);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    originRef.current.x = e.clientX;
    originRef.current.start = localStart;
    originRef.current.dur = localDur;
    setDragging(true);
  };
  const onLeftHandleDown = (e) => {
    if (e.button !== 0) return;
    setPointerId(e.pointerId);
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    originRef.current.x = e.clientX;
    originRef.current.start = localStart;
    originRef.current.dur = localDur;
    setResizing("left");
  };
  const onRightHandleDown = (e) => {
    if (e.button !== 0) return;
    setPointerId(e.pointerId);
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    originRef.current.x = e.clientX;
    originRef.current.start = localStart;
    originRef.current.dur = localDur;
    setResizing("right");
  };

  const onPointerMove = (e) => {
    if (pointerId !== e.pointerId) return;
    const dxPx = e.clientX - originRef.current.x;
    const dxSec = dxPx / Math.max(1e-6, pxPerSec);
    edgeScroll(e.clientX);

    if (dragging) {
      const rawStart = originRef.current.start + dxSec;
      const snapStart = quantizeToFrame(rawStart, fps);
      const maxStart = Math.max(
        0,
        duration + DRAG_PAD_SEC - originRef.current.dur
      );
      const clampedStart = Math.max(0, Math.min(snapStart, maxStart));
      nextRef.current = {
        start: clampedStart,
        dur: originRef.current.dur,
        mode: "drag",
      };
      scheduleApply();
    } else if (resizing === "right") {
      const rawDur = originRef.current.dur + dxSec;
      const snapDur = quantizeToFrame(rawDur, fps);
      const maxDur = Math.max(
        minDur,
        duration + DRAG_PAD_SEC - originRef.current.start
      );
      const clampedDur = Math.max(minDur, Math.min(snapDur, maxDur));
      nextRef.current = {
        start: originRef.current.start,
        dur: clampedDur,
        mode: "resize-right",
      };
      scheduleApply();
    } else if (resizing === "left") {
      const rawStart = originRef.current.start + dxSec;
      const snapStart = quantizeToFrame(rawStart, fps);
      const maxStart = originRef.current.start + originRef.current.dur - minDur;
      const clampedStart = Math.max(0, Math.min(snapStart, maxStart));
      const newDur =
        originRef.current.dur + (originRef.current.start - clampedStart);
      nextRef.current = {
        start: clampedStart,
        dur: Math.max(minDur, newDur),
        mode: "resize-left",
      };
      scheduleApply();
    }
  };

  const endInteraction = (e) => {
    if (pointerId !== null && e.pointerId !== pointerId) return;
    stopEdgeScroll();
    if (dragging || resizing) {
      onCommit?.({
        startSec: nextRef.current.start ?? localStart,
        durationSec: nextRef.current.dur ?? localDur,
      });
    }
    setDragging(false);
    setResizing(null);
    setPointerId(null);
    e.currentTarget?.releasePointerCapture?.(e.pointerId);
  };

  const frameStep = Math.max(10, Math.round(toPx(0.5)));
  const stripOverlay = `repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) ${
    frameStep - 1
  }px, rgba(255,255,255,0.09) ${
    frameStep - 1
  }px, rgba(255,255,255,0.09) ${frameStep}px)`;

  const onSelectClick = (e) => {
    e.stopPropagation();
    onSelect?.(e);
  };

  const display = useMemo(() => {
    const raw = String(label ?? "");
    const noTags = raw.replace(/<[^>]+>/g, "");
    const first =
      noTags
        .replace(/\r/g, "")
        .split("\n")
        .find((ln) => ln && ln.trim().length > 0) || "";
    return first.trim();
  }, [label]);

  return (
    <div
      className={`absolute  ${className}`}
      style={{
        transform: `translate3d(${leftPx}px, ${yPx}px, 0)`,
        width: widthPx,
        height: rowHeight,
        minWidth: 6,
        willChange: "transform,width",
        zIndex: dragging || resizing ? 50 : 1,
      }}
      data-clip-id={id}
      data-lane={lane}
      onPointerMove={onPointerMove}
      onPointerUp={endInteraction}
      onPointerCancel={endInteraction}
      role="group"
      aria-roledescription="clip"
      aria-label={display || (kind === "subtitle" ? "subtitle" : "text")}
      data-dragging={dragging || !!resizing}
    >
      <div
        className="relative h-full shadow-sm ring-1 ring-black/40 bg-brand-400"
        style={{
          backgroundColor: color,
          overflow: "hidden",
          cursor: dragging ? "grabbing" : "grab",
          transition: "box-shadow 120ms ease, filter 120ms ease",
          boxShadow:
            dragging || resizing
              ? "0 10px 22px rgba(0,0,0,.35)"
              : "0 6px 12px rgba(0,0,0,.18)",
          filter: dragging ? "brightness(1.02) saturate(1.02)" : "none",
          borderRadius: 8,
        }}
        onPointerDown={onBodyPointerDown}
        onClick={onSelectClick}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: stripOverlay,
            mixBlendMode: "overlay",
            zIndex: 0,
          }}
        />
        <div
          className="absolute inset-y-0 left-2 right-2 flex items-center text-white/95 text-xs"
          style={{ userSelect: "none", pointerEvents: "none", zIndex: 1 }}
        >
          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
            {display}
          </div>
        </div>

        <div
          className="absolute left-0 top-0 h-full w-2 cursor-col-resize rounded-l-lg hover:bg-white/10"
          onPointerDown={onLeftHandleDown}
        />
        <div
          className="absolute right-0 top-0 h-full w-2 cursor-col-resize rounded-r-lg hover:bg-white/10"
          onPointerDown={onRightHandleDown}
        />

        {(selected || dragging || resizing) && (
          <div className="pointer-events-none absolute inset-0 rounded-[8px] ring-inset ring-2 ring-accent/80" />
        )}

        <div className="pointer-events-none absolute right-1 bottom-1 flex items-center gap-1 text-[11px] text-white/70">
          <Scissors className="h-3.5 w-3.5" />
        </div>
      </div>
      
      {/* Loading animation below the clip */}
      {isLoading && (
        <div
          className="absolute top-full left-0 right-0 h-1 bg-gray-200 overflow-hidden rounded-sm"
          style={{
            marginTop: 2,
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 transition-all duration-300 ease-out"
            style={{
              width: `${Math.max(0, Math.min(100, loadingProgress))}%`,
              backgroundSize: "200% 100%",
              animation: loadingProgress > 0 && loadingProgress < 100 ? "shimmer 1.5s ease-in-out infinite" : "none",
            }}
          />
        </div>
      )}
    </div>
  );
}
