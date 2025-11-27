import { Pause, Play, FileText } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
function formatDuration(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
    : `${m}:${String(ss).padStart(2, "0")}`;
}
export default function PrettyPreview({ type, src, poster, durationHint = 0 }) {
  const t = useTranslations();
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(durationHint || 0);

  if (type === "subtitle") {
    return (
      <div className="rounded-2xl border border-border bg-white shadow-xl p-6 flex items-center gap-3">
        <FileText className="h-6 w-6 text-brand" />
        <div className="text-sm text-text-muted">
          {t("video_processor.inspector.panel.media.preview.no_preview")}
        </div>
      </div>
    );
  }

  if (type === "image") {
    return (
      <div className="rounded-2xl border border-border bg-white shadow-xl p-3">
        <div className="overflow-hidden rounded-xl">
          <img src={src || poster} alt="" className="w-full object-contain" />
        </div>
      </div>
    );
  }

  if (type === "audio") {
    return (
      <div className="rounded-2xl border border-border bg-white shadow-xl p-4">
        <audio src={src} controls className="w-full" />
      </div>
    );
  }

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const pct = dur ? Math.min(100, (cur / dur) * 100) : 0;
  const onBarClick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const p = ((e.clientX - r.left) / r.width) * 100;
    const v = videoRef.current;
    if (!v || !dur) return;
    v.currentTime = (p / 100) * dur;
  };

  return (
    <div>
      <div className="overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="block w-full h-auto"
          preload="metadata"
          onLoadedMetadata={(e) =>
            setDur(e.currentTarget.duration || durationHint || 0)
          }
          onTimeUpdate={(e) => setCur(e.currentTarget.currentTime || 0)}
          onEnded={() => setPlaying(false)}
          playsInline
          controls={false}
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white shadow-sm hover:bg-surface-50"
          aria-label={playing ? t("video_processor.inspector.panel.media.preview.pause") : t("video_processor.inspector.panel.media.preview.play")}
        >
          {playing ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </button>

        <div className="flex-1">
          <div
            className="relative h-2 cursor-pointer rounded-full bg-surface-200"
            onClick={onBarClick}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            aria-label={t("video_processor.inspector.panel.media.preview.progress")}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-brand/80"
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white shadow ring-1 ring-border"
              style={{ left: `calc(${pct}% - 8px)` }}
            />
          </div>
        </div>

        <div className="w-[92px] text-xs tabular-nums text-text-muted">
          {formatDuration(cur)} <span className="opacity-60">/</span>{" "}
          {formatDuration(dur || durationHint)}
        </div>
      </div>
    </div>
  );
}
