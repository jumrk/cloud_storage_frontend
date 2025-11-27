"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTimeline } from "../../../context/TimelineContext";
import { Scissors, Video as VideoIcon } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const DRAG_PAD_SEC = 60;
const DRAG_SLOP_PX = 4;

function quantizeToFrame(sec, fps) {
  const step = fps > 0 ? 1 / fps : 0.001;
  return Math.max(0, Math.round(sec / step) * step);
}
function formatTime(t) {
  const s = Math.max(0, t || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const hh = h > 0 ? `${h}:` : "";
  const mm = (h > 0 ? String(m).padStart(2, "0") : String(m)) || "0";
  const ss = String(sec).padStart(2, "0");
  return `${hh}${mm}:${ss}`;
}
function useImagePreload(src) {
  const [loaded, setLoaded] = useState(!src);
  useEffect(() => {
    if (!src) return setLoaded(true);
    let canceled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => !canceled && setLoaded(true);
    img.onerror = () => !canceled && setLoaded(false);
    img.src = src;
    return () => {
      canceled = true;
    };
  }, [src]);
  return loaded;
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

export default function VideoClip({
  id,
  lane = "video",
  label = "",
  startSec = 0,
  durationSec = 1,
  minDurationSec,
  color,
  assetId,
  filmstrip,
  frameUrlAt,
  rowIndex = 0,
  rowHeight = 48,
  selected = false,
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

  const armRef = useRef(null);
  const movedPxRef = useRef(0);
  const suppressClickRef = useRef(false);

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
  const yPx = Math.max(0, Math.floor(rowIndex) * rowHeight);

  const onBodyPointerDown = (e) => {
    if (e.button !== 0) return;
    setPointerId(e.pointerId);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    originRef.current.x = e.clientX;
    originRef.current.start = localStart;
    originRef.current.dur = localDur;
    armRef.current = "drag";
    movedPxRef.current = 0;
    suppressClickRef.current = false;
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
    armRef.current = "left";
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
    armRef.current = "right";
  };

  const onPointerMove = (e) => {
    if (pointerId !== e.pointerId) return;
    const dxPx = e.clientX - originRef.current.x;
    movedPxRef.current = Math.max(movedPxRef.current, Math.abs(dxPx));

    if (!dragging && !resizing) {
      if (armRef.current === "drag" && Math.abs(dxPx) >= DRAG_SLOP_PX)
        setDragging(true);
      else return;
    }

    if (dragging || resizing) edgeScroll(e.clientX);
    else stopEdgeScroll();

    const dxSec = dxPx / Math.max(1e-6, pxPerSec);

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
    const didMove = movedPxRef.current >= DRAG_SLOP_PX || !!resizing;
    if (didMove && (dragging || resizing)) {
      onCommit?.({
        startSec: nextRef.current.start ?? localStart,
        durationSec: nextRef.current.dur ?? localDur,
        mode: resizing ? `resize-${resizing}` : "drag",
        didMove: true,
      });
    }
    if (movedPxRef.current >= DRAG_SLOP_PX) suppressClickRef.current = true;

    setDragging(false);
    setResizing(null);
    setPointerId(null);
    armRef.current = null;
    movedPxRef.current = 0;
    e.currentTarget?.releasePointerCapture?.(e.pointerId);
  };

  const onSelectClick = (e) => {
    e.stopPropagation();
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onSelect?.(id);
  };

  const targetThumbPx = 48;
  const tileHParam = Math.max(32, rowHeight);
  const useSprite = filmstrip && filmstrip.sheetKey && pxPerSec < 60;

  const sheetLoaded = useImagePreload(useSprite ? filmstrip?.sheetUrl : null);
  const [anyThumbLoaded, setAnyThumbLoaded] = useState(false);
  useEffect(() => setAnyThumbLoaded(false), [assetId, pxPerSec, localDur]);

  const spriteTiles = useMemo(() => {
    if (!useSprite) return [];
    const cols = Math.max(1, filmstrip.cols || 1);
    const rows = Math.max(1, filmstrip.rows || 1);
    const stepSec = Math.max(0.01, filmstrip.stepSec || 1);
    const count = Math.max(1, Math.ceil(widthPx / targetThumbPx));
    const arr = [];
    for (let i = 0; i < count; i++) {
      const elapsedSec = (i * targetThumbPx) / Math.max(1e-6, pxPerSec);
      let idx = Math.floor(elapsedSec / stepSec);
      const maxIdx = cols * rows - 1;
      if (idx > maxIdx) idx = maxIdx;
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      const bgSizeX = cols * 100;
      const bgSizeY = rows * 100;
      const posX = cols > 1 ? (c / (cols - 1)) * 100 : 0;
      const posY = rows > 1 ? (r / (rows - 1)) * 100 : 0;
      arr.push({
        key: i,
        width: i === count - 1 ? widthPx - targetThumbPx * i : targetThumbPx,
        bg: {
          image: filmstrip.sheetUrl,
          sizeX: bgSizeX,
          sizeY: bgSizeY,
          posX,
          posY,
        },
      });
    }
    return arr;
  }, [useSprite, filmstrip, widthPx, pxPerSec]);

  const thumbSamples = useMemo(() => {
    if (useSprite || !frameUrlAt) return [];
    const stepSec = Math.max(
      2 / Math.max(1, fps),
      targetThumbPx / Math.max(1e-6, pxPerSec)
    );
    const count = Math.max(1, Math.ceil(localDur / stepSec));
    const items = [];
    for (let i = 0; i < count; i++) {
      const t = i * stepSec + stepSec / 2;
      const w = Math.min(targetThumbPx, Math.round(toPx(stepSec)));
      items.push({
        key: i,
        x: Math.round(toPx(i * stepSec)),
        w:
          i === count - 1
            ? Math.max(8, widthPx - Math.round(toPx(i * stepSec)))
            : Math.max(8, w),
        url: frameUrlAt(t, tileHParam),
      });
    }
    return items;
  }, [
    useSprite,
    frameUrlAt,
    localDur,
    fps,
    pxPerSec,
    toPx,
    widthPx,
    tileHParam,
  ]);

  const frameStep = Math.max(10, Math.round(toPx(0.5)));
  const stripOverlay = `repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) ${
    frameStep - 1
  }px, rgba(255,255,255,0.09) ${
    frameStep - 1
  }px, rgba(255,255,255,0.09) ${frameStep}px)`;

  const visualsReady = useSprite ? sheetLoaded : anyThumbLoaded;
  const durationText = formatTime(localDur);

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
      aria-label={label || "video"}
      aria-busy={!visualsReady}
      data-dragging={dragging || !!resizing}
    >
      <div className="relative h-full rounded-[8px]" style={{ ["--r"]: "8px" }}>
        {(selected || dragging || resizing) && (
          <div className="pointer-events-none absolute -inset-px rounded-[8px] ring-2 ring-accent/80" />
        )}

        <div
          className="group h-full w-full bg-neutral-800 ring-1 ring-black/40 shadow-sm"
          style={{
            backgroundColor: color,
            cursor: dragging ? "grabbing" : "grab",
            transition: "box-shadow 120ms ease, filter 120ms ease",
            boxShadow:
              dragging || resizing
                ? "0 10px 22px rgba(0,0,0,.35)"
                : "0 6px 12px rgba(0,0,0,.18)",
            filter: dragging ? "brightness(1.02) saturate(1.02)" : "none",
            borderRadius: "var(--r)",
            overflow: "hidden",
            clipPath: "inset(0 round var(--r))",
            touchAction: "none",
            userSelect: "none",
          }}
          onPointerDown={onBodyPointerDown}
          onClick={onSelectClick}
        >
          {!visualsReady && (
            <div
              className="absolute inset-0"
              style={{
                borderRadius: "inherit",
                overflow: "hidden",
                clipPath: "inset(0 round var(--r))",
              }}
            >
              <Skeleton
                className="!h-full !w-full"
                baseColor="hsl(220 8% 20%)"
                highlightColor="hsl(220 8% 28%)"
                borderRadius={8}
                enableAnimation
              />
            </div>
          )}

          {useSprite && (
            <div
              className="absolute inset-0 flex transition-opacity duration-150"
              style={{
                opacity: visualsReady ? 1 : 0.001,
                borderRadius: "inherit",
                overflow: "hidden",
                clipPath: "inset(0 round var(--r))",
              }}
            >
              {spriteTiles.map((t) => (
                <div
                  key={t.key}
                  style={{
                    width: t.width,
                    height: "100%",
                    backgroundImage: `url(${t.bg.image})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: `${t.bg.sizeX}% ${t.bg.sizeY}%`,
                    backgroundPosition: `${t.bg.posX}% ${t.bg.posY}%`,
                  }}
                />
              ))}
            </div>
          )}

          {!useSprite && thumbSamples.length > 0 && (
            <div
              className="absolute inset-0 transition-opacity duration-150"
              style={{
                opacity: anyThumbLoaded ? 1 : 0.001,
                borderRadius: "inherit",
                overflow: "hidden",
                clipPath: "inset(0 round var(--r))",
              }}
            >
              {thumbSamples.map((s) => (
                <img
                  key={s.key}
                  crossOrigin="anonymous"
                  src={s.url}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  onLoad={() => !anyThumbLoaded && setAnyThumbLoaded(true)}
                  style={{
                    position: "absolute",
                    left: s.x,
                    top: 0,
                    width: s.w,
                    height: "100%",
                    objectFit: "cover",
                    userSelect: "none",
                    pointerEvents: "none",
                    display: "block",
                  }}
                />
              ))}
            </div>
          )}

          <div
            className="absolute inset-0"
            style={{
              backgroundImage: stripOverlay,
              mixBlendMode: "overlay",
              pointerEvents: "none",
              borderRadius: "inherit",
              overflow: "hidden",
              clipPath: "inset(0 round var(--r))",
            }}
          />

          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute left-2 top-1 flex items-center gap-1 text-[11px] text-white/95">
              <VideoIcon className="h-3.5 w-3.5 opacity-85" />
              <span className="truncate max-w-[180px]">{label}</span>
            </div>
            <div className="absolute right-2 bottom-1 text-[11px] text-white/90 bg-black/35 px-1.5 py-0.5 rounded">
              {durationText}
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

          <div className="pointer-events-none absolute right-1 bottom-1 flex items-center gap-1 text-[11px] text-white/70">
            <Scissors className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
