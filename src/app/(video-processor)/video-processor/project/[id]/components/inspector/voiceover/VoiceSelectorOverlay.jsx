"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  Play,
  Pause,
  MoreHorizontal,
  ChevronDown,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function VoiceSelectorOverlay({
  isOpen,
  onClose,
  voiceOptions = [],
  selectedVoiceId,
  onSelectVoice,
  onPreviewVoice,
  isLoadingPreview,
  isPlayingPreview,
  playingVoiceId,
  voiceSource = "default",
  targetRef,
  isLoadingVoices = false,
}) {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [position, setPosition] = useState({ top: 0, height: 0 });

  useEffect(() => {
    if (isOpen && targetRef?.current) {
      const updatePosition = () => {
        // Full width và height của content section
        setPosition({
          top: 0,
          height: targetRef.current.offsetHeight,
        });
      };
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }
  }, [isOpen, targetRef]);

  // Filter voices based on search and category
  const filteredVoices = useMemo(() => {
    let filtered = voiceOptions;

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.label?.toLowerCase().includes(query) ||
          v.name?.toLowerCase().includes(query) ||
          v.id?.toLowerCase().includes(query)
      );
    }

    // Filter by category (if needed in future)
    if (selectedCategory !== "all") {
      // Add category filtering logic here
    }

    return filtered;
  }, [voiceOptions, searchQuery, selectedCategory]);

  const handleVoiceClick = (voiceId) => {
    onSelectVoice(voiceId);
  };

  const handlePreview = (e, voiceId) => {
    e.stopPropagation();
    onPreviewVoice(voiceId);
  };

  return (
    <div
      className={`absolute left-0 right-0 bg-white transition-opacity duration-300 ease-out ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      style={{
        top: `${position.top}px`,
        height: `${position.height}px`,
      }}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-2 py-2 border-b border-border bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-50 text-text-muted transition-colors"
            title={t("video_processor.inspector.voiceover.back")}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-text-strong">
              {t("video_processor.inspector.voiceover.select_voice_title")}
            </h2>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("video_processor.inspector.voiceover.search_voices_placeholder")}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand-200 text-sm"
            />
          </div>
        </div>

        {/* Category Filter */}
        {voiceSource === "my" && (
          <div className="px-3 pb-3 shrink-0">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-surface-50 transition text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-strong">
                  Instant Voice Clones
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
            </button>
          </div>
        )}

        {/* Voice List */}
        <div className="flex-1 overflow-auto px-3 py-3">
          {isLoadingVoices ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <div className="text-sm text-text-muted">{t("video_processor.inspector.voiceover.loading_voices")}</div>
            </div>
          ) : filteredVoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-sm text-text-muted">
                {searchQuery.trim()
                  ? t("video_processor.inspector.voiceover.no_voices_found")
                  : t("video_processor.inspector.voiceover.no_voices_yet")}
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredVoices.map((voice, index) => {
                const isSelected = selectedVoiceId === voice.id;
                const isPlaying =
                  isPlayingPreview && playingVoiceId === voice.id;
                const isLoading =
                  isLoadingPreview && playingVoiceId === voice.id;

                // Generate a unique color pattern for each voice (swirling patterns)
                const colorPatterns = [
                  "from-green-300 via-emerald-400 to-green-600",
                  "from-pink-300 via-rose-400 to-pink-600",
                  "from-blue-300 via-cyan-400 to-blue-600",
                  "from-purple-300 via-violet-400 to-purple-600",
                  "from-orange-300 via-amber-400 to-orange-600",
                  "from-teal-300 via-cyan-400 to-teal-600",
                ];
                const colorPattern =
                  colorPatterns[index % colorPatterns.length];

                // Get voice number for icon (use index + 1)
                const voiceNumber = index + 1;
                // Get voice label/name for display
                const voiceLabel = voice.label || voice.name || `Voice ${voiceNumber}`;

                return (
                  <div
                    key={voice.id}
                    onClick={() => handleVoiceClick(voice.id)}
                    className={`group relative flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition ${
                      isSelected ? "bg-brand-50" : "hover:bg-surface-50"
                    }`}
                  >
                    {/* Voice Icon with Clone Badge */}
                    <div className="relative shrink-0">
                      {voice.avatar ? (
                        <img
                          src={voice.avatar}
                          alt={voiceLabel}
                          className="w-10 h-10 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorPattern} flex items-center justify-center text-white font-bold text-sm shadow-sm relative overflow-hidden`}
                        >
                          {/* Swirling pattern effect */}
                          <div className="absolute inset-0 opacity-30">
                            <div className="absolute top-0 left-0 w-5 h-5 bg-white/20 rounded-full blur-sm"></div>
                            <div className="absolute bottom-0 right-0 w-6 h-6 bg-white/20 rounded-full blur-sm"></div>
                          </div>
                          <span className="relative z-10">{voiceNumber}</span>
                        </div>
                      )}
                      {voiceSource === "my" && (
                        <div className="absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full bg-black/80 border border-white/50 flex items-center justify-center">
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Voice Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-text-strong text-xs mb-0.5">
                        {voiceLabel}
                      </div>
                      <div className="text-[12px] text-text-muted leading-tight">
                        {voiceSource === "my"
                          ? t("video_processor.inspector.voiceover.cloned_from")
                          : t("video_processor.inspector.voiceover.default_voice_label")}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handlePreview(e, voice.id)}
                        disabled={isLoading}
                        className="p-1.5 rounded-lg hover:bg-surface-100 text-text-strong disabled:opacity-50 transition"
                        title={isPlaying ? t("video_processor.inspector.voiceover.pause") : t("video_processor.inspector.voiceover.preview")}
                      >
                        {isLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted transition"
                        title={t("video_processor.inspector.options")}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
