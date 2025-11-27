"use client";
import React, { useRef, useEffect } from "react";
import { Play, Pause, Mic } from "lucide-react";
import { useTranslations } from "next-intl";

export default function VoiceRecorder({
  recState,
  recSecs,
  recIsPlaying,
  onStartRecording,
  onStopRecording,
  onTogglePlay,
  onReset,
  onUpload,
  uploadingClone,
}) {
  const t = useTranslations();
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <section className="rounded-lg border border-border p-3 bg-surface-50">
      <div className="flex items-center justify-between  mb-2">
        <div className="text-sm font-medium text-text-strong">
          {t("video_processor.inspector.voiceover.record_directly")}
        </div>
        <div className="text-xs text-text-muted">
          {recState === "recording" && t("video_processor.inspector.voiceover.recording")}
          {recState === "paused" && t("video_processor.inspector.voiceover.paused")}
          {recState === "recorded" && t("video_processor.inspector.voiceover.recorded")}
          {recState === "idle" && t("video_processor.inspector.voiceover.ready")}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {recState === "idle" && (
          <button
            type="button"
            onClick={onStartRecording}
            className="px-3 py-1.5 rounded-lg border border-brand-300 text-brand-700 hover:bg-brand-50 text-sm flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            {t("video_processor.inspector.voiceover.start_recording")}
          </button>
        )}
        {recState === "recording" && (
          <button
            type="button"
            onClick={onStopRecording}
            className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-sm"
          >
            {t("video_processor.inspector.voiceover.stop")}
          </button>
        )}
        {recState === "recorded" && (
          <>
            <button
              type="button"
              onClick={onTogglePlay}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-100 text-sm flex items-center gap-2"
            >
              {recIsPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {recIsPlaying ? t("video_processor.inspector.voiceover.pause") : t("video_processor.inspector.voiceover.listen_again")}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-100 text-sm"
            >
              {t("video_processor.inspector.voiceover.record_again")}
            </button>
            <button
              type="button"
              onClick={onUpload}
              disabled={uploadingClone}
              className="px-3 py-1.5 rounded-lg border border-brand-300 text-brand-700 hover:bg-brand-50 disabled:opacity-60 text-sm"
            >
              {uploadingClone ? t("video_processor.inspector.voiceover.uploading_short") : t("video_processor.inspector.voiceover.save_upload")}
            </button>
          </>
        )}

        <div className="ml-auto text-xs text-text-muted tabular-nums">
          {formatTime(recSecs)}
        </div>
      </div>
    </section>
  );
}
