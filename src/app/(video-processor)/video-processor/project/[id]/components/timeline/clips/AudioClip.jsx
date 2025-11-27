"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTimeline } from "../../../context/TimelineContext";
import { Scissors, Music2 as MusicIcon } from "lucide-react";

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

export default function AudioClip({
  id,
  lane = "audio",
  label = "",
  startSec = 0,
  durationSec = 1,
  minDurationSec,
  color,
  rowIndex = 0,
  rowHeight = 48,
  selected = false,
  onSelect,
  onChange,
  onCommit,
  className = "",
  waveform = null, // { peaks: number[], stepSec: number }
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

  const onSelectClick = (e) => {
    e.stopPropagation();
    onSelect?.(id);
  };

  const canvasRef = useRef(null);

  useEffect(() => {
    const wf = waveform;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.floor(widthPx));
    const h = Math.max(1, Math.floor(rowHeight));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (!wf || !Array.isArray(wf.peaks) || wf.peaks.length === 0) return;

    const peaks = wf.peaks;
    const stepSec =
      wf.stepSec && wf.stepSec > 0 ? wf.stepSec : localDur / peaks.length;
    const totalSecOfAsset = peaks.length * stepSec;

    let min = Infinity;
    let max = -Infinity;
    for (
      let i = 0;
      i < peaks.length;
      i += Math.max(1, Math.floor(peaks.length / 2000))
    ) {
      const v = peaks[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = Math.max(1e-6, max - min);

    const mid = h / 2;
    const barW = 2;
    const gap = 1;
    const totalBars = Math.max(1, Math.floor(w / (barW + gap)));

    ctx.fillStyle = "rgba(255,255,255,0.9)";

    const srcInSec = 0;
    const clipDur = localDur;

    for (let i = 0; i < totalBars; i++) {
      const tInClip = ((i + 0.5) / totalBars) * clipDur + srcInSec;
      const tClamped = Math.max(
        0,
        Math.min(totalSecOfAsset - stepSec, tInClip)
      );
      const idx = Math.min(peaks.length - 1, Math.floor(tClamped / stepSec));
      const raw = peaks[idx];
      const amp =
        range > 1e-6 ? (raw - min) / range : Math.min(1, Math.abs(raw));
      const hBar = 2 + amp * (h - 8);
      const x = Math.floor(i * (barW + gap));
      ctx.fillRect(x, Math.round(mid - hBar / 2), barW, Math.round(hBar));
    }
  }, [waveform, widthPx, rowHeight, localDur]);

  const frameStep = Math.max(10, Math.round(toPx(0.5)));
  const stripOverlay = `repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) ${
    frameStep - 1
  }px, rgba(255,255,255,0.09) ${
    frameStep - 1
  }px, rgba(255,255,255,0.09) ${frameStep}px)`;

  const fallbackBars = useMemo(() => {
    const barW = 4;
    const gap = 3;
    const count = Math.ceil((widthPx - 8) / (barW + gap));
    const arr = [];
    for (let i = 0; i < count; i++) {
      const h =
        8 + Math.round((Math.sin(i * 0.9) * 0.5 + 0.5) * (rowHeight - 16));
      arr.push({ key: i, x: 4 + i * (barW + gap), h });
    }
    return arr;
  }, [widthPx, rowHeight]);

  return (
    <div
      className={`absolute ${className}`}
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
      aria-label={label || "audio"}
      data-dragging={dragging || !!resizing}
    >
      <div
        className="relative h-full shadow-sm ring-1 ring-black/40 bg-brand-700"
        style={{
          backgroundColor: color,
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
          style={{ backgroundImage: stripOverlay, mixBlendMode: "overlay" }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none rounded-[8px]"
        />
        {!waveform?.peaks && (
          <div className="absolute inset-0">
            {fallbackBars.map((b) => (
              <div
                key={b.key}
                style={{
                  position: "absolute",
                  left: b.x,
                  bottom: 4,
                  width: 4,
                  height: b.h,
                  borderRadius: 2,
                  opacity: 0.8,
                  background:
                    "linear-gradient(to top, rgba(255,255,255,.28), rgba(255,255,255,.06))",
                }}
              />
            ))}
          </div>
        )}
        <div className="flex items-center gap-1 text-[11px] text-white/90">
          <MusicIcon className="h-3.5 w-3.5 opacity-85" />
          <span className="truncate max-w-[180px]">{label}</span>
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
          <div className="pointer-events-none absolute -inset-px rounded-[8px] ring-2 ring-accent/80" />
        )}
        <div className="pointer-events-none absolute right-1 bottom-1 flex items-center gap-1 text-[11px] text-white/70">
          <Scissors className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}
