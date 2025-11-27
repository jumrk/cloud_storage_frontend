"use client";
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, SlidersHorizontal, RotateCcw, Check } from "lucide-react";
import { useSubtitle, useProject } from "../../../context";
import SubtitleSettingsPanel from "./SubtitleSettingsPanel";
import useSubtitleStyle from "../../../hooks/subtitle/useSubtitleStyle";
import { useTranslations } from "next-intl";

const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog.";

const DEFAULTS = {
  classic: { text: "#ffffff", bg: "rgba(0,0,0,0.45)", highlight: "#ffffff" },
  modern: { text: "#ffffff", bg: "transparent", highlight: "#ffffff" },
  cinematic: { text: "#ffffff", bg: "transparent", highlight: "#ffb000" },
};

const STYLES = [
  { id: "none", name: "None" },
  { id: "classic", name: "Classic" },
  { id: "modern", name: "Modern" },
  { id: "cinematic", name: "Cinematic" },
];

// Preset styles for each caption style
const STYLE_PRESETS = {
  classic: {
    font: "Inter",
    color: "#ffffff",
    scale: 0.5,
    weight: "600",
    style: "normal",
    align: "center",
    bgEnabled: true,
    bgColor: "#000000",
    bgOpacity: 0.45,
    hPlace: 0.5,
    vPlace: 0.85,
    autoBreak: true,
    maxLines: 2,
    maxWords: 12,
  },
  modern: {
    font: "Inter",
    color: "#ffffff",
    scale: 0.6,
    weight: "700",
    style: "normal",
    align: "center",
    bgEnabled: false,
    bgColor: "#000000",
    bgOpacity: 0.5,
    hPlace: 0.5,
    vPlace: 0.85,
    autoBreak: true,
    maxLines: 2,
    maxWords: 12,
  },
  cinematic: {
    font: "Inter",
    color: "#ffffff",
    scale: 0.55,
    weight: "800",
    style: "normal",
    align: "center",
    bgEnabled: false,
    bgColor: "#000000",
    bgOpacity: 0.5,
    karaokeBg: "#ffff00",
    karaokeOpacity: 0.8,
    hPlace: 0.5,
    vPlace: 0.85,
    autoBreak: true,
    maxLines: 2,
    maxWords: 12,
  },
};

function useOutsideClose(ref, onClose) {
  useEffect(() => {
    const fn = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", fn);
    document.addEventListener("touchstart", fn);
    return () => {
      document.removeEventListener("mousedown", fn);
      document.removeEventListener("touchstart", fn);
    };
  }, [onClose, ref]);
}

function StyleCard({
  selected,
  onSelect,
  onReset,
  onOpenPicker,
  onOpenSettings,
  color,
  styleId,
  name,
}) {
  const t = useTranslations("video_processor.inspector.panel.subtitle.style");
  const isNone = styleId === "none";
  return (
    <div
      role="button"
      onClick={onSelect}
      className={`rounded-xl border ${
        selected ? "border-brand-600 ring-2 ring-brand-200" : "border-border"
      } overflow-hidden bg-white transition-shadow`}
    >
      <div className="relative aspect-[16/9] bg-black">
        {!isNone ? (
          <div className="absolute inset-0 grid place-items-center p-3">
            {styleId === "classic" && (
              <div
                className="px-3 py-2 rounded-md max-w-[88%] text-center"
                style={{ background: DEFAULTS.classic.bg, color }}
              >
                <span className="block text-[11px] sm:text-xs font-medium tracking-wide">
                  {SAMPLE_TEXT}
                </span>
              </div>
            )}
            {styleId === "modern" && (
              <div className="max-w-[90%] text-center">
                <span
                  className="block text-sm sm:text-base font-semibold drop-shadow"
                  style={{ color }}
                >
                  {SAMPLE_TEXT}
                </span>
              </div>
            )}
            {styleId === "cinematic" && (
              <div className="max-w-[92%] text-center">
                <span
                  className="inline-block text-[13px] sm:text-sm font-extrabold"
                  style={{ color }}
                >
                  The quick brown fox{" "}
                  <span
                    className="px-1 rounded"
                    style={{
                      background: color,
                      color: "#000",
                    }}
                  >
                    jumps
                  </span>{" "}
                  over the lazy dog.
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-xs text-white/70">No captions</span>
          </div>
        )}
        {selected && (
          <div className="absolute inset-0 border-2 border-brand-600 pointer-events-none rounded-[10px]" />
        )}
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-sm font-medium text-text-strong">
          {!isNone ? (
            <span className="inline-flex w-4 h-4 items-center justify-center rounded-full border border-brand-600">
              <Check className="w-3 h-3 text-brand-600" />
            </span>
          ) : (
            <span className="inline-block w-4 h-4 rounded-full border border-border" />
          )}
          {name}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {!isNone && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPicker();
                }}
                className="w-6 h-6 rounded-md border border-border grid place-items-center"
                title={t("change_color")}
              >
                <span
                  className="inline-block w-4 h-4 rounded"
                  style={{ background: color }}
                />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                }}
                className="w-6 h-6 rounded-md border border-border grid place-items-center"
                title={t("reset")}
              >
                <RotateCcw className="w-3.5 h-3.5 text-text-muted" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSettings();
                }}
                className="w-7 h-7 rounded-md border border-border grid place-items-center"
                title={t("settings")}
              >
                <SlidersHorizontal className="w-4 h-4 text-text-muted" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StyleSubtitle() {
  const t = useTranslations();
  const { showStyle, setShowStyle } = useSubtitle();
  const { dataProject } = useProject();

  const {
    selectedId,
    scale,
    colors,
    settings,
    STYLE_PRESETS,
    DEFAULTS,
    handleSelectStyle,
    handleColorChange,
    handleScaleChange,
    handleResetCard,
    handleSettingsChange,
  } = useSubtitleStyle();

  // Local state for smooth slider dragging
  const [localScale, setLocalScale] = useState(scale);

  // Sync local scale with hook scale when it changes externally
  useEffect(() => {
    setLocalScale(scale);
  }, [scale]);

  const [pickerFor, setPickerFor] = useState(null);
  const popRef = useRef(null);
  useOutsideClose(popRef, () => setPickerFor(null));

  const [showSettings, setShowSettings] = useState(false);
  const [settingsFor, setSettingsFor] = useState("classic");

  const openSettings = (id) => {
    setSettingsFor(id);
    setShowSettings(true);
  };

  const cards = STYLES.map((st) => {
    const c =
      st.id === "classic"
        ? colors.classic
        : st.id === "modern"
        ? colors.modern
        : st.id === "cinematic"
        ? colors.cinematic
        : "#ffffff";
    return { ...st, color: c };
  });

  return (
    <div
      className={`absolute top-0 left-0 right-0 bottom-0 z-10 transition-opacity duration-300 ${
        showStyle ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!showStyle}
    >
      <div
        className={`absolute top-0 left-0 right-0 bottom-0 bg-white flex flex-col transition-all duration-300 ease-out ${
          showStyle
            ? showSettings
              ? "translate-y-0 opacity-0 pointer-events-none"
              : "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0"
        }`}
      >
        <div className="h-14 px-3 sm:px-4 border-b border-border flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowStyle(false)}
            className="h-8 px-2 rounded-md border border-border hover:bg-surface-50 flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("video_processor.inspector.panel.subtitle.style.back")}
          </button>
          <div className="ml-2 text-sm sm:text-base font-semibold text-text-strong">
            {t("video_processor.inspector.panel.subtitle.style.captions")}
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-hide p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">
          {/* Scale Control */}
          <div className="bg-surface-50 rounded-lg p-3 sm:p-4 border border-border/60 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-strong">
                {t("video_processor.inspector.panel.subtitle.style.size")}
              </label>
              <span className="text-xs text-text-muted">
                {Math.round(localScale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.01}
              value={localScale}
              onInput={(e) => {
                const newValue = Number(e.target.value);
                setLocalScale(newValue);
              }}
              onChange={(e) => {
                const newValue = Number(e.target.value);
                setLocalScale(newValue);
                handleScaleChange(newValue);
              }}
              className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              style={{
                background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${
                  ((localScale - 0.2) / 0.8) * 100
                }%, rgb(229 231 235) ${
                  ((localScale - 0.2) / 0.8) * 100
                }%, rgb(229 231 235) 100%)`,
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 shrink-0">
            {cards.map((it) => (
              <div key={it.id} className="relative">
                <StyleCard
                  selected={selectedId === it.id}
                  onSelect={() => handleSelectStyle(it.id)}
                  onReset={() => handleResetCard(it.id)}
                  onOpenPicker={() => setPickerFor(it.id)}
                  onOpenSettings={() => openSettings(it.id)}
                  color={it.color}
                  styleId={it.id}
                  name={it.name}
                />

                {pickerFor === it.id && it.id !== "none" && (
                  <div
                    ref={popRef}
                    className="absolute top-2 right-2 z-30 rounded-xl border border-border bg-white p-2 shadow-lg"
                  >
                    <input
                      type="color"
                      value={it.color}
                      onChange={(e) => {
                        handleColorChange(it.id, e.target.value);
                      }}
                      className="block w-40 h-40 cursor-pointer rounded-md border border-border"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Panel - Overlay với animation mượt mà */}
      <div
        className={`absolute inset-0 z-30 transition-opacity duration-300 ease-out ${
          showSettings
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 transition-transform duration-300 ease-out ${
            showSettings ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <SubtitleSettingsPanel
            settingsFor={settingsFor}
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onClose={() => setShowSettings(false)}
          />
        </div>
      </div>
    </div>
  );
}
