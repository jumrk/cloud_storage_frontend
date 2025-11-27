"use client";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useTimeline } from "../../../context/TimelineContext";
import { useSelection } from "../../../context";
import TimeRuler from "../ruler/TimeRuler";
import Playhead from "./Playhead";
import { useTranslations } from "next-intl";

export default function TracksViewport({
  children,
  onSplitAtPlayhead,
  onUniversalDrop,
  selectionBox,
  onSelectionBoxChange,
  clips,
  selectedClips,
  onSelectedClipsChange,
  onSelectClip,
}) {
  const t = useTranslations();
  const {
    duration,
    pxPerSec,
    toPx,
    toSec,
    currentTime,
    setViewportWidth,
    setPxPerSec,
    minPxPerSec,
    maxPxPerSec,
    setCurrentTime,
  } = useTimeline();
  const { setSelectedClip } = useSelection();
  
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionStartRef = useRef(null);

  const scrollerRef = useRef(null);
  const resizeObsRef = useRef(null);
  const lastHRef = useRef(0);

  const hoverRef = useRef(null);
  const [hover, setHover] = useState(null);
  const rafMoveRef = useRef(0);
  const scrubbingRef = useRef(false);

  useEffect(() => {
    try {
      const w =
        typeof document !== "undefined" && document.documentElement
          ? document.documentElement.clientWidth || window.innerWidth
          : window?.innerWidth || 1024;
      setViewportWidth(Number(w));
    } catch {}
  }, [setViewportWidth]);

  const pxPerS = Math.max(1e-6, pxPerSec);
  const playheadWorldX = Math.max(0, Math.round(currentTime * pxPerS));

  const { worldWidth, majorPx, minorPx, fits } = useMemo(() => {
    let fallbackW = 1024;
    if (typeof window !== "undefined")
      fallbackW = window.innerWidth || fallbackW;
    if (typeof document !== "undefined" && document.documentElement)
      fallbackW = document.documentElement.clientWidth || fallbackW;
    const elW = scrollerRef.current
      ? scrollerRef.current.clientWidth
      : fallbackW;
    const spanSec = elW > 0 ? elW / pxPerS : 0;
    const contentSec = Math.max(0, duration);
    const fits = contentSec <= spanSec + 1e-6;

    const tailSec = Math.max(Math.min(contentSec * 0.2, 20), 6);
    const worldEndSec = fits ? spanSec : contentSec + tailSec;
    const worldWidth = Math.max(elW, Math.ceil(toPx(worldEndSec)));

    const STEPS = [0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
    const pickStep = (targetPx) => {
      const secWanted = targetPx / pxPerS;
      let best = STEPS[0],
        bestDiff = Math.abs(best - secWanted);
      for (const s of STEPS) {
        const d = Math.abs(s - secWanted);
        if (d < bestDiff) {
          best = s;
          bestDiff = d;
        }
      }
      return best;
    };
    const majorSec = pickStep(90);
    const majorPx = majorSec * pxPerS;
    const minorPx = Math.max(1, Math.round((majorSec / 5) * pxPerS));
    return { worldWidth, majorPx, minorPx, fits };
  }, [duration, pxPerS, toPx]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth || 0;
      setViewportWidth(w);
      const h = el.clientHeight || 0;
      if (lastHRef.current && h !== lastHRef.current) {
        const delta = h - lastHRef.current;
        el.scrollTop = Math.max(0, el.scrollTop - delta / 2);
      }
      lastHRef.current = h;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    resizeObsRef.current = ro;

    const onWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const base = 1.15;
      const k = Math.pow(base, -e.deltaY / 100);
      setPxPerSec((cur) => {
        let next = cur * k;
        const max = Number(maxPxPerSec) || cur * 1000;
        const min = Number(minPxPerSec) || 0.2;
        if (next > max - 1e-6) next = max;
        if (next < min + 1e-6) next = min;
        return Math.abs(next - cur) < 1e-6 ? cur : next;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      ro.disconnect();
      el.removeEventListener("wheel", onWheel);
    };
  }, [setViewportWidth, setPxPerSec, minPxPerSec, maxPxPerSec]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (fits && el.scrollLeft !== 0) el.scrollLeft = 0;
  }, [fits]);

  const scheduleHoverUpdate = useCallback(
    (clientX, clientY) => {
      if (rafMoveRef.current) cancelAnimationFrame(rafMoveRef.current);
      rafMoveRef.current = requestAnimationFrame(() => {
        const host = scrollerRef.current;
        if (!host) return;

        const rect = host.getBoundingClientRect();
        const xScreen = rect.left + playheadWorldX - host.scrollLeft;

        if (Math.abs(clientX - xScreen) > 10) {
          if (hoverRef.current !== null) {
            hoverRef.current = null;
            setHover(null);
          }
          return;
        }

        const els = document.elementsFromPoint(xScreen, clientY);
        const el = els.find((n) => n?.dataset?.clipId);
        const next =
          el && el.dataset
            ? {
                lane: el.dataset.lane || "video",
                id: el.dataset.clipId,
                x: xScreen,
                y:
                  (el.getBoundingClientRect().top +
                    el.getBoundingClientRect().bottom) /
                  2,
              }
            : null;

        const prev = hoverRef.current;
        const changed =
          (prev && next && (prev.id !== next.id || prev.lane !== next.lane)) ||
          (!!prev && !next) ||
          (!prev && !!next);

        if (changed) {
          hoverRef.current = next;
          setHover(next);
        }
      });
    },
    [playheadWorldX]
  );

  const onMouseMove = (e) => scheduleHoverUpdate(e.clientX, e.clientY);
  const onMouseLeave = () => {
    if (hoverRef.current !== null) {
      hoverRef.current = null;
      setHover(null);
    }
  };

  useEffect(() => {
    return () => {
      if (rafMoveRef.current) cancelAnimationFrame(rafMoveRef.current);
      rafMoveRef.current = 0;
    };
  }, []);

  const startScrub = (clientX) => {
    const host = scrollerRef.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const x = clientX - rect.left + host.scrollLeft;
    setCurrentTime(x / Math.max(1e-6, pxPerS));
  };

  const onRulerPointerDown = (e) => {
    e.preventDefault();
    scrubbingRef.current = true;
    startScrub(e.clientX);
    const move = (ev) => scrubbingRef.current && startScrub(ev.clientX);
    const up = () => {
      scrubbingRef.current = false;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up, { once: true });
  };

  const doSplit = () => {
    if (!hover) return;
    onSplitAtPlayhead?.(hover.lane, hover.id, currentTime);
    hoverRef.current = null;
    setHover(null);
  };

  const onAnyDragOver = (e) => {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = "copy";
    } catch {}
  };
  const onAnyDrop = (e) => {
    if (!onUniversalDrop) return;
    onUniversalDrop((px) => px / Math.max(1e-6, pxPerS))(e);
  };

  const handleClickEmpty = useCallback((e) => {
    // Chỉ deselect nếu click vào empty area (không phải clip, button, hoặc control)
    const target = e.target;
    
    // Bỏ qua nếu click vào clip, button, hoặc các control elements
    if (
      target.closest('[data-clip]') ||
      target.closest('button') ||
      target.closest('[role="button"]') ||
      target.closest('input') ||
      target.closest('canvas')
    ) {
      return;
    }
    
    // Deselect nếu click vào empty area của track lane hoặc container
    const trackLane = target.closest('.track-lane');
    if (trackLane || target === e.currentTarget) {
      setSelectedClip(null);
      if (onSelectedClipsChange) {
        onSelectedClipsChange(new Set());
      }
    }
  }, [setSelectedClip, onSelectedClipsChange]);

  // Selection box handlers
  const handleSelectionStart = useCallback((e) => {
    // Only start selection on empty area, not on clips or controls
    const target = e.target;
    
    // Don't start selection if:
    // - Clicking on a clip element
    // - Clicking on buttons or controls
    // - Not left mouse button
    // - Clicking on ruler (for scrubbing)
    // - Clicking on clip that is being dragged/resized
    if (
      target.closest('[data-clip-id]') ||
      target.closest('[data-clip]') ||
      target.closest('button') ||
      target.closest('[role="button"]') ||
      target.closest('input') ||
      target.closest('canvas') ||
      target.closest('[data-ruler]') ||
      target.closest('[data-dragging="true"]') ||
      e.button !== 0 // Only left mouse button
    ) {
      return;
    }

    const host = scrollerRef.current;
    if (!host) return;
    
    const rect = host.getBoundingClientRect();
    const startX = e.clientX - rect.left + host.scrollLeft;
    const startY = e.clientY - rect.top + host.scrollTop;
    
    selectionStartRef.current = { x: startX, y: startY };
    setIsSelecting(true);
    onSelectionBoxChange?.({ startX, startY, endX: startX, endY: startY });
    
    // Clear existing selection when starting new selection
    if (onSelectedClipsChange) {
      onSelectedClipsChange(new Set());
    }
    
    e.preventDefault();
    e.stopPropagation();
  }, [onSelectionBoxChange, onSelectedClipsChange]);

  const handleSelectionMove = useCallback((e) => {
    if (!isSelecting || !selectionStartRef.current) return;
    
    const host = scrollerRef.current;
    if (!host) return;
    
    const rect = host.getBoundingClientRect();
    const endX = e.clientX - rect.left + host.scrollLeft;
    const endY = e.clientY - rect.top + host.scrollTop;
    
    onSelectionBoxChange?.({
      startX: selectionStartRef.current.x,
      startY: selectionStartRef.current.y,
      endX,
      endY,
    });
    
    // Calculate which clips are in selection box using actual DOM positions
    if (clips && onSelectedClipsChange) {
      const box = {
        left: Math.min(selectionStartRef.current.x, endX),
        right: Math.max(selectionStartRef.current.x, endX),
        top: Math.min(selectionStartRef.current.y, endY),
        bottom: Math.max(selectionStartRef.current.y, endY),
      };
      
      const selected = new Set();
      
      // Find all clip elements and check if they intersect with selection box
      const clipElements = host.querySelectorAll('[data-clip-id]');
      clipElements.forEach((clipEl) => {
        // Skip if clip is being dragged/resized
        if (clipEl.dataset.dragging === 'true') {
          return;
        }
        
        const clipRect = clipEl.getBoundingClientRect();
        const hostRect = host.getBoundingClientRect();
        
        // Convert clip position to scroll coordinates
        // Account for scroll position
        const clipLeft = clipRect.left - hostRect.left + host.scrollLeft;
        const clipRight = clipLeft + clipRect.width;
        const clipTop = clipRect.top - hostRect.top + host.scrollTop;
        const clipBottom = clipTop + clipRect.height;
        
        // Check intersection - clip intersects if any part is within selection box
        // Or if selection box is completely within clip (for small selections)
        const intersectsX = clipRight >= box.left && clipLeft <= box.right;
        const intersectsY = clipBottom >= box.top && clipTop <= box.bottom;
        
        // Also check if selection box center is within clip (for small selections)
        const boxCenterX = (box.left + box.right) / 2;
        const boxCenterY = (box.top + box.bottom) / 2;
        const centerInClip = 
          boxCenterX >= clipLeft && 
          boxCenterX <= clipRight && 
          boxCenterY >= clipTop && 
          boxCenterY <= clipBottom;
        
        if ((intersectsX && intersectsY) || centerInClip) {
          const lane = clipEl.dataset.lane || 'video';
          const clipId = clipEl.dataset.clipId;
          if (clipId) {
            selected.add(`${lane}:${clipId}`);
          }
        }
      });
      
      onSelectedClipsChange(selected);
    }
  }, [isSelecting, onSelectionBoxChange, clips, onSelectedClipsChange]);

  const handleSelectionEnd = useCallback(() => {
    setIsSelecting(false);
    selectionStartRef.current = null;
    // Keep selection box visible briefly, then clear
    setTimeout(() => {
      onSelectionBoxChange?.(null);
    }, 100);
  }, [onSelectionBoxChange]);

  useEffect(() => {
    if (!isSelecting) return;
    
    const handleMove = (e) => handleSelectionMove(e);
    const handleEnd = () => handleSelectionEnd();
    
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleEnd);
    window.addEventListener('pointercancel', handleEnd);
    
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleEnd);
      window.removeEventListener('pointercancel', handleEnd);
    };
  }, [isSelecting, handleSelectionMove, handleSelectionEnd]);

  return (
    <div
      ref={scrollerRef}
      className="h-full w-full overflow-auto bg-white select-none"
      data-scroll-host
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onDragOver={onAnyDragOver}
      onDrop={onAnyDrop}
      onClick={handleClickEmpty}
      onPointerDown={handleSelectionStart}
    >
      <div className="relative h-full">
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70" style={{ minWidth: worldWidth }}>
          <div className="relative" onPointerDown={onRulerPointerDown} style={{ width: worldWidth }}>
            <TimeRuler
              widthPx={worldWidth}
              majorPx={majorPx}
              minorPx={minorPx}
            />
            <div
              className="pointer-events-none absolute top-0 bottom-0 w-px bg-brand"
              style={{ left: playheadWorldX }}
            />
          </div>
        </div>

        <div className="relative">
          <div
            className="absolute top-0 bottom-0 w-px bg-brand/90 pointer-events-none"
            style={{ left: playheadWorldX }}
          />
          <Playhead />
          {children}

          {/* Selection box overlay */}
          {selectionBox && (
            <div
              className="absolute border-2 border-brand-500 bg-brand-500/10 pointer-events-none z-30"
              style={{
                left: Math.min(selectionBox.startX, selectionBox.endX),
                top: Math.min(selectionBox.startY, selectionBox.endY),
                width: Math.abs(selectionBox.endX - selectionBox.startX),
                height: Math.abs(selectionBox.endY - selectionBox.startY),
              }}
            />
          )}

          {hover && (
            <div
              style={{
                position: "fixed",
                left: hover.x,
                top: hover.y,
                transform: "translate(-50%, -50%)",
                zIndex: 70,
                pointerEvents: "none",
              }}
            >
              <button
                onClick={doSplit}
                className="grid place-items-center rounded-md bg-brand text-white text-[12px] leading-none shadow-lg border border-white/10"
                style={{ width: 28, height: 24, pointerEvents: "auto" }}
                title={t("video_processor.inspector.timeline.split_at_playhead")}
              >
                <span className="font-mono tracking-tight">][</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
