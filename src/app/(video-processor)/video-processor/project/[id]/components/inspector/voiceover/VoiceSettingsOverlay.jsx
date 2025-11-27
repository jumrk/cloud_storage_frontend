"use client";
import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

// Complete list of languages supported by ElevenLabs models
const ALL_LANGUAGES = [
  "Vietnamese",
  "English",
  "Japanese",
  "Korean",
  "Chinese",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Arabic",
  "Hindi",
  "Turkish",
  "Polish",
  "Dutch",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
  "Greek",
  "Czech",
  "Romanian",
  "Hungarian",
  "Bulgarian",
  "Croatian",
  "Slovak",
  "Slovenian",
  "Estonian",
  "Latvian",
  "Lithuanian",
  "Malay",
  "Indonesian",
  "Thai",
  "Tagalog",
  "Ukrainian",
  "Hebrew",
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Urdu",
  "Persian",
  "Swahili",
  "Catalan",
  "Basque",
  "Galician",
  "Icelandic",
  "Irish",
  "Welsh",
  "Maltese",
  "Luxembourgish",
  "Albanian",
  "Macedonian",
  "Serbian",
  "Bosnian",
  "Montenegrin",
  "Georgian",
  "Armenian",
  "Azerbaijani",
  "Kazakh",
  "Kyrgyz",
  "Uzbek",
  "Mongolian",
  "Nepali",
  "Sinhala",
  "Burmese",
  "Khmer",
  "Lao",
  "Hmong",
  "Amharic",
  "Somali",
  "Yoruba",
  "Igbo",
  "Hausa",
  "Zulu",
  "Xhosa",
  "Afrikaans",
  "Kinyarwanda",
  "Luganda",
];

const getModels = (t) => [
  {
    id: "eleven_v3",
    name: t("video_processor.inspector.voiceover.model_v3_name"),
    desc: t("video_processor.inspector.voiceover.model_v3_desc"),
    badge: { text: t("video_processor.inspector.voiceover.alpha"), tone: "violet" },
    langs: ALL_LANGUAGES,
  },
  {
    id: "eleven_flash_v2_5",
    name: t("video_processor.inspector.voiceover.model_v25_name"),
    desc: t("video_processor.inspector.voiceover.model_v25_desc"),
    badge: { text: t("video_processor.inspector.voiceover.best"), tone: "emerald" },
    langs: ALL_LANGUAGES.slice(0, 29),
  },
  {
    id: "eleven_multilingual_v2",
    name: t("video_processor.inspector.voiceover.model_v2_name"),
    desc: t("video_processor.inspector.voiceover.model_v2_desc"),
    badge: null,
    langs: ALL_LANGUAGES.slice(0, 29),
  },
];

function ModelItem({ model, selected, onSelect, t }) {
  const maxDisplayLangs = 5;
  const displayLangs = model.langs.slice(0, maxDisplayLangs);
  const remainingCount = model.langs.length - maxDisplayLangs;
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({
    top: 0,
    left: 0,
    showAbove: false,
  });
  const triggerRef = useRef(null);

  useEffect(() => {
    if (showTooltip && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipWidth = 256;
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceRight = window.innerWidth - rect.left;
      const minMargin = 16;

      const showAbove = spaceAbove > spaceBelow;
      let top;
      if (showAbove) {
        top = rect.top - minMargin;
      } else {
        top = rect.bottom + minMargin;
      }

      let left;
      if (spaceRight < tooltipWidth) {
        left = rect.right - tooltipWidth;
        if (left < minMargin) {
          left = minMargin;
        }
      } else {
        left = rect.left;
      }

      setTooltipPosition({ top, left, showAbove });
    }
  }, [showTooltip]);

  return (
    <button
      type="button"
      onClick={() => onSelect(model.id)}
      className={`w-full text-left rounded-lg border p-3 transition ${
        selected
          ? "border-brand-600 ring-2 ring-brand-200 bg-brand-50"
          : "border-border hover:border-brand-300 hover:bg-surface-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="font-medium text-text-strong text-sm">
              {model.name}
            </div>
            {model.badge && (
              <span
                className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                  model.badge.tone === "violet"
                    ? "bg-violet-100 text-violet-700"
                    : model.badge.tone === "emerald"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {model.badge.text}
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mb-2">{model.desc}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {displayLangs.map((lang, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-xs rounded-md bg-surface-100 text-text-muted border border-border"
              >
                {lang}
              </span>
            ))}
            {remainingCount > 0 && (
              <div
                className="relative inline-block"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                ref={triggerRef}
              >
                <span className="px-2 py-0.5 text-xs rounded-md bg-surface-100 text-text-muted border border-border cursor-help">
                  {t("video_processor.inspector.voiceover.more_languages", { count: remainingCount })}
                </span>
                {showTooltip && (
                  <div
                    className="fixed z-[9999] w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl border border-gray-700 pointer-events-auto"
                    style={{
                      top: `${tooltipPosition.top}px`,
                      left: `${tooltipPosition.left}px`,
                      transform: tooltipPosition.showAbove
                        ? "translateY(-100%)"
                        : "none",
                    }}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    <div className="font-medium mb-2 text-white">
                      {t("video_processor.inspector.voiceover.all_languages", { count: model.langs.length })}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {model.langs.map((lang, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-200"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div
          className={`shrink-0 rounded-full border w-5 h-5 grid place-items-center ${
            selected ? "bg-brand-600 border-brand-600" : "border-border"
          }`}
        >
          {selected && (
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-white">
              <path
                d="M7.5 13.3 4.7 10.5l-1.2 1.2 4 4 9-9-1.2-1.2z"
                fill="currentColor"
              />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

export default function VoiceSettingsOverlay({
  isOpen,
  onClose,
  targetRef,
  modelId = "eleven_multilingual_v2",
  speed = 0.75,
  stability = 0.6,
  similarity = 0.8,
  styleExaggeration = 0.1,
  speakerBoost = true,
  onModelChange,
  onSpeedChange,
  onStabilityChange,
  onSimilarityChange,
  onStyleExaggerationChange,
  onSpeakerBoostChange,
  onSave,
  onCancel,
}) {
  const t = useTranslations();
  const MODELS = getModels(t);
  const [position, setPosition] = useState({ top: 0, height: 0 });
  const [localModelId, setLocalModelId] = useState(modelId);
  const [localSpeed, setLocalSpeed] = useState(speed);
  const [localStability, setLocalStability] = useState(stability);
  const [localSimilarity, setLocalSimilarity] = useState(similarity);
  const [localStyleExaggeration, setLocalStyleExaggeration] =
    useState(styleExaggeration);
  const [localSpeakerBoost, setLocalSpeakerBoost] = useState(speakerBoost);

  useEffect(() => {
    if (isOpen && targetRef?.current) {
      const updatePosition = () => {
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

  useEffect(() => {
    if (isOpen) {
      setLocalModelId(modelId || "eleven_multilingual_v2");
      setLocalSpeed(speed !== null && speed !== undefined ? speed : 0.75);
      setLocalStability(
        stability !== null && stability !== undefined ? stability : 0.6
      );
      setLocalSimilarity(
        similarity !== null && similarity !== undefined ? similarity : 0.8
      );
      setLocalStyleExaggeration(
        styleExaggeration !== null && styleExaggeration !== undefined
          ? styleExaggeration
          : 0.1
      );
      setLocalSpeakerBoost(
        speakerBoost !== null && speakerBoost !== undefined
          ? speakerBoost
          : true
      );
    }
  }, [
    isOpen,
    modelId,
    speed,
    stability,
    similarity,
    styleExaggeration,
    speakerBoost,
  ]);

  const handleSave = () => {
    if (onModelChange) onModelChange(localModelId);
    if (onSpeedChange) onSpeedChange(localSpeed);
    if (onStabilityChange) onStabilityChange(localStability);
    if (onSimilarityChange) onSimilarityChange(localSimilarity);
    if (onStyleExaggerationChange)
      onStyleExaggerationChange(localStyleExaggeration);
    if (onSpeakerBoostChange) onSpeakerBoostChange(localSpeakerBoost);
    if (onSave) {
      onSave({
        modelId: localModelId,
        speed: localSpeed,
        stability: localStability,
        similarity: localSimilarity,
        styleExaggeration: localStyleExaggeration,
        speakerBoost: localSpeakerBoost,
      });
    }
    onClose();
  };

  const handleCancel = () => {
    setLocalModelId(modelId);
    setLocalSpeed(speed);
    setLocalStability(stability);
    setLocalSimilarity(similarity);
    setLocalStyleExaggeration(styleExaggeration);
    setLocalSpeakerBoost(speakerBoost);
    if (onCancel) onCancel();
    onClose();
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
        <div className="flex items-center gap-3 px-2 py-2 border-b border-border bg-white shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            className="p-2 rounded-lg hover:bg-surface-50 text-text-muted transition-colors"
            title={t("video_processor.inspector.voiceover.back")}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-text-strong">
              {t("video_processor.inspector.voiceover.customize_voice")}
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-hide px-3 py-4 space-y-6">
          <div>
            <label className="text-sm font-medium text-text-strong mb-3 block">
              {t("video_processor.inspector.voiceover.model")}
            </label>
            <div className="space-y-2">
              {MODELS.map((m) => (
                <ModelItem
                  key={m.id}
                  model={m}
                  selected={localModelId === m.id}
                  onSelect={setLocalModelId}
                  t={t}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-strong">
                {t("video_processor.inspector.voiceover.voice_speed")}
              </label>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localSpeed}
                onChange={(e) => setLocalSpeed(Number(e.target.value))}
                className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                style={{
                  background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${
                    localSpeed * 100
                  }%, rgb(229 231 235) ${
                    localSpeed * 100
                  }%, rgb(229 231 235) 100%)`,
                }}
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-text-muted">{t("video_processor.inspector.voiceover.slower")}</span>
                <span className="text-xs text-text-muted">{t("video_processor.inspector.voiceover.faster")}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-strong">
                {t("video_processor.inspector.voiceover.stability_label")}
              </label>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localStability}
                onChange={(e) => setLocalStability(Number(e.target.value))}
                className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                style={{
                  background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${
                    localStability * 100
                  }%, rgb(229 231 235) ${
                    localStability * 100
                  }%, rgb(229 231 235) 100%)`,
                }}
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-text-muted">{t("video_processor.inspector.voiceover.more_variation")}</span>
                <span className="text-xs text-text-muted">{t("video_processor.inspector.voiceover.more_stable")}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-strong">
                Độ giống nhau
              </label>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localSimilarity}
                onChange={(e) => setLocalSimilarity(Number(e.target.value))}
                className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                style={{
                  background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${
                    localSimilarity * 100
                  }%, rgb(229 231 235) ${
                    localSimilarity * 100
                  }%, rgb(229 231 235) 100%)`,
                }}
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-text-muted">Thấp</span>
                <span className="text-xs text-text-muted">Cao</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-strong">
                {t("video_processor.inspector.voiceover.style_exaggeration")}
              </label>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localStyleExaggeration}
                onChange={(e) =>
                  setLocalStyleExaggeration(Number(e.target.value))
                }
                className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                style={{
                  background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${
                    localStyleExaggeration * 100
                  }%, rgb(229 231 235) ${
                    localStyleExaggeration * 100
                  }%, rgb(229 231 235) 100%)`,
                }}
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-text-muted">{t("video_processor.inspector.voiceover.none")}</span>
                <span className="text-xs text-text-muted">{t("video_processor.inspector.voiceover.exaggerated")}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-strong">
                {t("video_processor.inspector.voiceover.speaker_boost")}
              </label>
              <button
                type="button"
                onClick={() => setLocalSpeakerBoost(!localSpeakerBoost)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSpeakerBoost ? "bg-brand-600" : "bg-surface-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSpeakerBoost ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-3 py-3 border-t border-border bg-white shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg border border-border text-text-muted hover:bg-surface-50 text-sm transition"
          >
            {t("video_processor.inspector.voiceover.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
          >
            {t("video_processor.inspector.voiceover.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
