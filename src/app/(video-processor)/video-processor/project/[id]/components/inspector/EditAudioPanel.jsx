"use client";
import React from "react";
import { MoreHorizontal, Volume2, Gauge, Activity } from "lucide-react";
import { useSelectionMaybe } from "../../context";
import { useTranslations } from "next-intl";

export default function EditAudioPanel() {
  const t = useTranslations();
  const selection = useSelectionMaybe();
  const visible = !!selection?.selectedAudioClip;
  const audioVolume = selection?.audioVolume ?? 100;
  const audioSpeed = selection?.audioSpeed ?? 100;
  const audioStability = selection?.audioStability ?? 50;
  const handleAudioVolumeChange =
    selection?.handleAudioVolumeChange ?? (() => {});
  const handleAudioSpeedChange =
    selection?.handleAudioSpeedChange ?? (() => {});
  const handleAudioStabilityChange =
    selection?.handleAudioStabilityChange ?? (() => {});

  if (!visible) return null;

  return (
    <aside className="w-[320px] shrink-0 border-l border-border bg-white h-full flex flex-col">
      <header className="h-12 border-b border-border px-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-text-strong">
          {t("video_processor.inspector.edit_audio")}
        </div>
        <button
          className="p-1 rounded hover:bg-surface-50 disabled:opacity-50"
          title={t("video_processor.inspector.options")}
        >
          <MoreHorizontal className="w-5 h-5 text-text-muted" />
        </button>
      </header>

      <div className="p-3 space-y-4 overflow-auto">
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
              value={audioVolume}
              onChange={(e) =>
                handleAudioVolumeChange(Number(e.target.value))
              }
              className="flex-1 accent-brand-600"
            />
            <div className="w-12 text-right text-xs text-text-strong">
              {String(audioVolume).padStart(2, "0")} %
            </div>
          </div>
        </section>

        <section aria-label={t("video_processor.inspector.adjust_speed")}>
          <div className="text-xs font-semibold text-text-strong mb-2">
            {t("video_processor.inspector.speed")}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md border border-border grid place-items-center">
              <Gauge className="w-4 h-4 text-text-strong" />
            </div>
            <input
              type="range"
              min={50}
              max={200}
              step={1}
              value={audioSpeed}
              onChange={(e) =>
                handleAudioSpeedChange(Number(e.target.value))
              }
              className="flex-1 accent-brand-600"
            />
            <div className="w-12 text-right text-xs text-text-strong">
              {String(audioSpeed).padStart(3, "0")} %
            </div>
          </div>
          <div className="text-xs text-text-muted mt-1 px-10">
            {t("video_processor.inspector.speed_description")}
          </div>
        </section>

        <section aria-label={t("video_processor.inspector.adjust_stability")}>
          <div className="text-xs font-semibold text-text-strong mb-2">
            {t("video_processor.inspector.stability")}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md border border-border grid place-items-center">
              <Activity className="w-4 h-4 text-text-strong" />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={audioStability}
              onChange={(e) =>
                handleAudioStabilityChange(Number(e.target.value))
              }
              className="flex-1 accent-brand-600"
            />
            <div className="w-12 text-right text-xs text-text-strong">
              {String(audioStability).padStart(2, "0")} %
            </div>
          </div>
          <div className="text-xs text-text-muted mt-1 px-10">
            {t("video_processor.inspector.stability_description")}
          </div>
        </section>
      </div>
    </aside>
  );
}

