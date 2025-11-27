"use client";
import { useEffect, useMemo, useCallback } from "react";
import { useTimeline } from "../../../context/TimelineContext";
import { useTranslations } from "next-intl";

export default function ZoomControls() {
  const t = useTranslations();
  const { pxPerSec, setPxPerSec, minPxPerSec, maxPxPerSec, isAtMin, isAtMax } =
    useTimeline();

  const min = Math.max(0.0001, Number(minPxPerSec) || 0.2);
  const max = Math.max(min * 1.01, Number(maxPxPerSec) || 1000);
  const range = useMemo(() => Math.log(max / min), [min, max]);

  const toSlider = useCallback(
    (v) =>
      (Math.log(Math.max(min, Math.min(max, v || min)) / min) / range) * 100,
    [min, max, range]
  );
  const fromSlider = useCallback(
    (p) => min * Math.exp((Math.min(100, Math.max(0, p)) / 100) * range),
    [min, range]
  );

  const pos = useMemo(() => toSlider(pxPerSec), [pxPerSec, toSlider]);

  const onChange = (e) => {
    const p = Number(e.target.value);
    const next = fromSlider(p);
    setPxPerSec((cur) => {
      const clamped = Math.min(max, Math.max(min, next));
      if (Math.abs(clamped - cur) < 1e-6) return cur;
      return clamped;
    });
  };

  const stepZoom = (k) => {
    if (k > 1 && isAtMax) return;
    if (k < 1 && isAtMin) return;
    setPxPerSec((cur) => {
      let next = cur * k;
      if (next > max - 1e-6) next = max;
      if (next < min + 1e-6) next = min;
      if (Math.abs(next - cur) < 1e-6) return cur;
      return next;
    });
  };

  return (
    <div className="ml-auto mr-3 flex items-center gap-3">
      <button
        onClick={() => stepZoom(1 / 1.25)}
        className="size-8 grid place-items-center rounded-full border border-border text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Zoom out"
        disabled={isAtMin}
      >
        −
      </button>

      <input
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={pos}
        onChange={onChange}
        className="zoomRange w-56"
        style={{
          background: `linear-gradient(to right, #0e5f9b 0%, #0e5f9b ${pos}%, #e5e7eb ${pos}%, #e5e7eb 100%)`,
        }}
        aria-label={t("video_processor.inspector.timeline.zoom")}
        title={t("video_processor.inspector.timeline.zoom_with_shortcut")}
      />

      <button
        onClick={() => stepZoom(1.25)}
        className="size-8 grid place-items-center rounded-full border border-border text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Zoom in"
        disabled={isAtMax}
      >
        +
      </button>

      <style jsx>{`
        .zoomRange {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 999px;
          outline: none;
        }
        .zoomRange::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 999px;
          background: #fff;
          border: 1px solid var(--border, #cbd5e1);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.15);
          margin-top: -6px;
          cursor: pointer;
        }
        .zoomRange::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 999px;
          background: #fff;
          border: 1px solid var(--border, #cbd5e1);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.15);
          cursor: pointer;
        }
        .zoomRange::-moz-range-track {
          height: 6px;
          border-radius: 999px;
          background: transparent;
        }
      `}</style>
    </div>
  );
}
