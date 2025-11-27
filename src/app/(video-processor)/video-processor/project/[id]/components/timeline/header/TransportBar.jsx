"use client";

import { Play, Pause } from "lucide-react";
import { useEffect } from "react";
import { formatTimecode } from "../../../utils/time";
import { useTimeline } from "../../../context/TimelineContext";

export default function TransportBar() {
  const { currentTime, setCurrentTime, duration, playing, setPlaying } =
    useTimeline();

  useEffect(() => {
    if (!playing) return;
    let raf;
    let last = performance.now();

    const loop = (t) => {
      const dt = (t - last) / 1000;
      last = t;

      setCurrentTime((s) => {
        const next = s + dt;
        if (next >= duration) {
          cancelAnimationFrame(raf);
          setPlaying(false);
          return duration;
        }
        return next;
      });

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, setCurrentTime, duration, setPlaying]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const el = e.target;
      const tag = (el?.tagName || "").toLowerCase();
      const typing =
        tag === "input" || tag === "textarea" || el?.isContentEditable === true;

      if (typing) return;

      const isSpace =
        e.code === "Space" || e.key === " " || e.key === "Spacebar";
      const isK = e.key?.toLowerCase() === "k";

      if ((isSpace || isK) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (duration <= 0) return;
        setPlaying((p) => !p);
      }
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [duration]);

  return (
    <div className="h-10 flex items-center gap-3 px-3">
      <button
        className="h-8 w-8 grid place-items-center rounded-md border border-border"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pause" : "Play"}
        title="Space / K"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>

      <div className="text-sm tabular-nums text-text-muted">
        {formatTimecode(currentTime)}
      </div>
    </div>
  );
}
