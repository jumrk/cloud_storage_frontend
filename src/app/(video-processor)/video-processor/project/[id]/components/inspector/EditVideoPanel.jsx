"use client";
import React, { useState } from "react";
import {
  MoreHorizontal,
  Volume2,
  AudioLines,
  Type,
  Loader2,
  ChevronDown,
} from "lucide-react";
import LanguageSelect from "../ui/LanguageSelect";
import { useSelectionMaybe, useSubtitleToolsMaybe } from "../../context";
import { useTranslations } from "next-intl";

export default function EditVideoPanel({
  onTachAudio = () => {},
  loading: audioLoading = false,
  loadingAction: audioLoadingAction = null,
  loadingText: audioLoadingText,
  loadingProgress: audioProgress = null,
  loadingStatus: audioStatus = null,
  loadingPhase: audioPhase = null,
}) {
  const t = useTranslations();
  const selection = useSelectionMaybe();
  const subtitleTools = useSubtitleToolsMaybe();
  const visible = !!selection?.selectedVideoClip;
  const volume = selection?.volume ?? 100;
  const handleVolumeChange = selection?.handleVolumeChange ?? (() => {});

  const subLoading = subtitleTools?.loading || false;
  const subLoadingAction = subtitleTools?.loadingAction;
  const subLoadingText = subtitleTools?.loadingText || t("video_processor.inspector.processing");
  const subProgress = subtitleTools?.loadingProgress ?? null;
  const subPhase = subtitleTools?.loadingPhase;

  // Ưu tiên subtitle loading nếu đang chạy, nếu không thì dùng audio
  const loading = subLoading || audioLoading;
  const loadingAction = subLoading ? subLoadingAction : audioLoadingAction;
  const loadingText = subLoading ? subLoadingText : (audioLoadingText || t("video_processor.inspector.processing"));
  const loadingProgress = subLoading
    ? subProgress ?? null
    : audioProgress ?? null;
  const loadingPhase = subLoading ? subPhase : audioPhase;

  const isSubActive = subLoading && subLoadingAction === "tachSub";
  const isAudioActive = audioLoading && audioLoadingAction === "tachAudio";

  const disableVolume = loading;
  const disableSubBtn = loading && !isAudioActive;
  const disableAudioBtn = loading && !isSubActive;

  // Hiển thị progress nếu có giá trị number hợp lệ
  // Chỉ hiển thị khi có progress thực sự (không phải initial 0 hoặc undefined)
  const hasProgress =
    loading &&
    typeof loadingProgress === "number" &&
    !Number.isNaN(loadingProgress) &&
    loadingProgress > 0 &&
    loadingProgress <= 100;
  const pct = hasProgress ? Math.round(loadingProgress) : null;

  const [subOpen, setSubOpen] = useState(false);
  const [lang, setLang] = useState("vi-VN");

  const handleStartSub = () => {
    if (disableSubBtn || !lang || !subtitleTools) return;
    subtitleTools.startSubtitle({ lang });
  };
  if (!visible) return null;

  return (
    <aside className="w-[320px] shrink-0 border-l border-border bg-white h-full flex flex-col">
      <header className="h-12 border-b border-border px-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-text-strong">
          {t("video_processor.inspector.edit_video")}
        </div>
        <button
          className="p-1 rounded hover:bg-surface-50 disabled:opacity-50"
          disabled={loading}
          title={t("video_processor.inspector.options")}
        >
          <MoreHorizontal className="w-5 h-5 text-text-muted" />
        </button>
      </header>

      <div className="p-3 space-y-4 overflow-auto ">
        {loading && (
          <div
            className="rounded-lg border border-border bg-surface-50 px-3 py-2 text-xs text-text-strong"
            role={hasProgress ? "group" : "status"}
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="truncate">
                {loadingText}
                {loadingPhase ? (
                  <span className="text-text-muted"> · {loadingPhase}</span>
                ) : null}
              </span>
              {hasProgress ? (
                <span className="ml-auto tabular-nums">{pct}%</span>
              ) : null}
            </div>
            {hasProgress ? (
              <div
                className="mt-2 h-1.5 w-full rounded-full bg-border/50 overflow-hidden"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                aria-label={t("video_processor.inspector.processing_progress")}
              >
                <div
                  className="h-full bg-brand-600 transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            ) : null}
          </div>
        )}

        {/* Âm lượng */}
        <section aria-label={t("video_processor.inspector.adjust_volume")}>
          <div className="text-xs font-semibold text-text-strong mb-2">
            {t("video_processor.inspector.volume")}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md border border-border grid place-items-center">
              <Volume2 className="w-4 h-4 text-text-strong" />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={volume}
              onChange={(e) =>
                !disableVolume && handleVolumeChange(Number(e.target.value))
              }
              className={`flex-1 accent-brand-600 ${
                disableVolume ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={disableVolume}
            />
            <div
              className={`w-12 text-right text-xs text-text-strong ${
                disableVolume ? "opacity-50" : ""
              }`}
            >
              {String(volume).padStart(2, "0")} %
            </div>
          </div>
        </section>

        {/* Công cụ AI */}
        <section className="pt-2" aria-label={t("video_processor.inspector.ai_tools")}>
          <div className="text-xs font-semibold text-text-strong mb-2">
            {t("video_processor.inspector.ai_tools")}
          </div>

          {/* Phụ đề tự động */}
          <div
            className={`w-full rounded-xl border border-border bg-white px-3 py-2.5 text-left transition ${
              disableSubBtn ? "opacity-60" : "hover:bg-surface-50"
            }`}
          >
            <button
              type="button"
              onClick={() => setSubOpen((v) => !v)}
              className="w-full flex items-center gap-3"
              disabled={isSubActive}
              aria-expanded={subOpen ? "true" : "false"}
            >
              <div className="w-8 h-8 rounded-lg grid place-items-center bg-accent-50">
                {isSubActive ? (
                  <Loader2 className="w-4 h-4 animate-spin text-accent-600" />
                ) : (
                  <Type className="w-4 h-4 text-accent-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-text-strong">
                    {t("video_processor.inspector.auto_subtitle")}
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700">
                    {t("video_processor.inspector.free")}
                  </span>
                  <span className="ml-auto text-xs text-text-muted">
                    {isSubActive && hasProgress ? `${pct}%` : null}
                  </span>
                </div>
                <div className="text-xs text-text-muted truncate">
                  {t("video_processor.inspector.auto_subtitle_description")}
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-text-muted transition-transform ${
                  subOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out grid ${
                subOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="min-h-0">
                <div className="p-3 flex flex-col gap-2">
                  <label className="text-xs font-medium text-text-strong">
                    {t("video_processor.inspector.video_language")}
                  </label>
                  <div className=" gap-2">
                    <LanguageSelect
                      value={lang}
                      onChange={setLang}
                      disabled={isSubActive}
                    />
                    <div className="w-full mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleStartSub}
                        disabled={disableSubBtn || !lang}
                        className={`h-9 px-3 rounded-lg text-sm font-medium text-white transition ${
                          disableSubBtn || !lang
                            ? "bg-brand-400 opacity-60 cursor-not-allowed"
                            : "bg-brand-600 hover:bg-brand-700"
                        }`}
                        aria-busy={isSubActive}
                      >
                        {t("video_processor.inspector.create")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tách Audio */}
          <button
            onClick={() => !disableAudioBtn && onTachAudio()}
            className={`w-full rounded-xl mt-2 border border-border bg-white px-3 py-2.5 text-left flex items-center gap-3 transition ${
              disableAudioBtn
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-surface-50"
            }`}
            disabled={disableAudioBtn}
            aria-busy={isAudioActive}
          >
            <div className="w-8 h-8 rounded-lg grid place-items-center bg-blue-50">
              {isAudioActive ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <AudioLines className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-strong">
                {t("video_processor.inspector.extract_audio")}
              </div>
              <div className="text-xs text-text-muted truncate">
                {t("video_processor.inspector.extract_audio_description")}
              </div>
            </div>
          </button>
        </section>
      </div>
    </aside>
  );
}
