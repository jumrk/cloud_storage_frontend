"use client";
import React from "react";
import { ChevronRight } from "lucide-react";
import FieldHeader from "./FieldHeader";
import { useTranslations } from "next-intl";

export default function VoiceSelector({
  globalVoice,
  setGlobalVoice,
  voiceOptions,
  onPreview,
  isLoadingPreview,
  isPlayingPreview,
  playingVoiceId,
  voiceSource = "default",
  onOpenSelector,
}) {
  const t = useTranslations();
  const currentVoice = voiceOptions.find((v) => v.id === globalVoice);

  // Generate color pattern for current voice
  const getVoiceColor = (voiceId) => {
    const index = voiceOptions.findIndex((v) => v.id === voiceId);
    const colors = [
      "from-green-400 to-emerald-600",
      "from-pink-400 to-rose-600",
      "from-blue-400 to-cyan-600",
      "from-purple-400 to-violet-600",
      "from-orange-400 to-amber-600",
      "from-teal-400 to-cyan-600",
    ];
    return colors[index % colors.length] || "from-gray-400 to-gray-600";
  };

  return (
    <>
      <section className="mt-2">
        <FieldHeader label={t("video_processor.inspector.voiceover.voice")} />
        <button
          type="button"
          onClick={onOpenSelector}
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-white hover:bg-surface-50 transition group"
        >
          {/* Voice Icon */}
          {currentVoice && (
            <div className="relative shrink-0">
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${getVoiceColor(
                  currentVoice.id
                )} flex items-center justify-center text-white font-semibold text-sm shadow-sm`}
              >
                {currentVoice.label?.[0]?.toUpperCase() ||
                  currentVoice.name?.[0]?.toUpperCase() ||
                  "?"}
              </div>
              {voiceSource === "my" && (
                <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-brand-600 border-2 border-white flex items-center justify-center">
                  <svg
                    className="w-2 h-2 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
              )}
            </div>
          )}

          {/* Voice Info */}
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium text-text-strong">
              {currentVoice?.label ||
                currentVoice?.name ||
                globalVoice ||
                t("video_processor.inspector.voiceover.select_voice")}
            </div>
            <div className="text-xs text-text-muted">
              {voiceSource === "my" ? t("video_processor.inspector.voiceover.cloned_voice") : t("video_processor.inspector.voiceover.default_voice")}
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-text-strong transition" />
        </button>
      </section>
    </>
  );
}
