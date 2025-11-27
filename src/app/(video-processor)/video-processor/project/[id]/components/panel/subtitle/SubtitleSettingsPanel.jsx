"use client";
import React from "react";
import {
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronUp,
  Minus,
  ChevronDown,
} from "lucide-react";
import useSubtitleSettings, {
  DEFAULT_SETTINGS,
} from "../../../hooks/subtitle/useSubtitleSettings";
import { useTranslations } from "next-intl";

function Section({ title, children, right }) {
  return (
    <div className="border-b border-border last:border-none">
      <div className="h-10 px-3 sm:px-4 flex items-center justify-between">
        <div className="text-xs font-semibold text-text-strong">{title}</div>
        {right}
      </div>
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">{children}</div>
    </div>
  );
}

function Row({ label, children, onReset, disabled }) {
  const t = useTranslations("video_processor.inspector.panel.subtitle.settings");
  return (
    <div
      className={`flex items-center gap-3 py-1.5 ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <div className="w-40 shrink-0 text-xs text-text-strong">{label}</div>
      <div className="flex-1">{children}</div>
      <button
        type="button"
        onClick={onReset}
        className="w-7 h-7 rounded-lg border border-border/60 grid place-items-center transition-all hover:border-border hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed"
        disabled={disabled}
        title={t("reset")}
      >
        <RotateCcw className="w-4 h-4 text-text-muted" />
      </button>
    </div>
  );
}

export default function SubtitleSettingsPanel({
  settingsFor,
  settings,
  onSettingsChange,
  onClose,
}) {
  const t = useTranslations();
  const { handleReset } = useSubtitleSettings({ settings, onSettingsChange });

  return (
    <div className="absolute inset-0 z-30 bg-white">
      <div className="h-14 px-3 sm:px-4 border-b border-border flex items-center justify-between">
        <div className="text-sm font-semibold text-text-strong">
          {t("video_processor.inspector.panel.subtitle.settings.title")}
          <span className="ml-1 text-text-muted font-normal">
            ·{" "}
            {settingsFor === "classic"
              ? t("video_processor.inspector.panel.subtitle.settings.classic")
              : settingsFor === "modern"
              ? t("video_processor.inspector.panel.subtitle.settings.modern")
              : settingsFor === "cinematic"
              ? t("video_processor.inspector.panel.subtitle.settings.cinematic")
              : settingsFor?.charAt(0)?.toUpperCase() + settingsFor?.slice(1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="w-8 h-8 rounded-lg border border-border/60 grid place-items-center transition-all hover:border-border hover:bg-surface-50"
            title={t("video_processor.inspector.panel.subtitle.settings.reset_all")}
          >
            <RotateCcw className="w-4 h-4 text-text-muted" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-border/60 grid place-items-center transition-all hover:border-border hover:bg-surface-50"
            title={t("video_processor.inspector.panel.subtitle.settings.close")}
          >
            <span className="text-sm text-text-muted">×</span>
          </button>
        </div>
      </div>

      <div className="overflow-y-auto scrollbar-hide max-h-[calc(100%-48px)]">
        <Section title={t("video_processor.inspector.panel.subtitle.settings.text")}>
          <Row
            label={t("video_processor.inspector.panel.subtitle.settings.font")}
            onReset={() =>
              onSettingsChange({ ...settings, font: DEFAULT_SETTINGS.font })
            }
          >
            <select
              className="h-8 w-full rounded-lg border border-border/60 bg-white px-2.5 text-sm text-text-strong transition-all hover:border-border focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 appearance-none cursor-pointer"
              value={settings.font}
              onChange={(e) =>
                onSettingsChange({ ...settings, font: e.target.value })
              }
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                paddingRight: "2rem",
              }}
            >
              <option>Inter</option>
              <option>DM Sans</option>
              <option>Poppins</option>
              <option>Roboto</option>
              <option>Oswald</option>
            </select>
          </Row>

          <Row
            label={t("video_processor.inspector.panel.subtitle.settings.color")}
            onReset={() =>
              onSettingsChange({ ...settings, color: DEFAULT_SETTINGS.color })
            }
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="color"
                  className="w-8 h-8 rounded-lg border border-border/60 cursor-pointer transition-all hover:border-border focus:outline-none focus:ring-1 focus:ring-brand-500"
                  value={settings.color}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, color: e.target.value })
                  }
                />
              </div>
              <input
                className="h-8 flex-1 rounded-lg border border-border/60 bg-white px-2.5 text-sm text-text-strong transition-all hover:border-border focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                value={settings.color}
                onChange={(e) =>
                  onSettingsChange({ ...settings, color: e.target.value })
                }
              />
            </div>
          </Row>

          <Row
            label={t("video_processor.inspector.panel.subtitle.settings.scale")}
            onReset={() =>
              onSettingsChange({ ...settings, scale: DEFAULT_SETTINGS.scale })
            }
          >
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.01}
              className="w-full h-1.5 rounded-full bg-surface-100 appearance-none cursor-pointer accent-brand-600"
              style={{
                background: `linear-gradient(to right, rgb(99 102 241) 0%, rgb(99 102 241) ${
                  ((settings.scale - 0.2) / 0.8) * 100
                }%, rgb(229 231 235) ${
                  ((settings.scale - 0.2) / 0.8) * 100
                }%, rgb(229 231 235) 100%)`,
              }}
              value={settings.scale}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  scale: Number(e.target.value),
                })
              }
            />
          </Row>

          <Row
            label={t("video_processor.inspector.panel.subtitle.settings.weight")}
            onReset={() =>
              onSettingsChange({ ...settings, weight: DEFAULT_SETTINGS.weight })
            }
          >
            <select
              className="h-8 w-full rounded-lg border border-border/60 bg-white px-2.5 text-sm text-text-strong transition-all hover:border-border focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 appearance-none cursor-pointer shadow-sm hover:shadow"
              value={settings.weight}
              onChange={(e) =>
                onSettingsChange({ ...settings, weight: e.target.value })
              }
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                paddingRight: "2rem",
              }}
            >
              <option value="400">{t("video_processor.inspector.panel.subtitle.settings.weight_normal")}</option>
              <option value="500">{t("video_processor.inspector.panel.subtitle.settings.weight_medium")}</option>
              <option value="600">{t("video_processor.inspector.panel.subtitle.settings.weight_semibold")}</option>
              <option value="700">{t("video_processor.inspector.panel.subtitle.settings.weight_bold")}</option>
              <option value="800">{t("video_processor.inspector.panel.subtitle.settings.weight_extrabold")}</option>
            </select>
          </Row>

          <Row
            label={t("video_processor.inspector.panel.subtitle.settings.style")}
            onReset={() =>
              onSettingsChange({ ...settings, style: DEFAULT_SETTINGS.style })
            }
          >
            <select
              className="h-8 w-full rounded-lg border border-border/60 bg-white px-2.5 text-sm text-text-strong transition-all hover:border-border focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 appearance-none cursor-pointer shadow-sm hover:shadow"
              value={settings.style}
              onChange={(e) =>
                onSettingsChange({ ...settings, style: e.target.value })
              }
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                paddingRight: "2rem",
              }}
            >
              <option value="normal">{t("video_processor.inspector.panel.subtitle.settings.style_normal")}</option>
              <option value="italic">{t("video_processor.inspector.panel.subtitle.settings.style_italic")}</option>
            </select>
          </Row>

          <Row
            label={t("video_processor.inspector.panel.subtitle.settings.align")}
            onReset={() =>
              onSettingsChange({ ...settings, align: DEFAULT_SETTINGS.align })
            }
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`h-8 w-10 rounded-lg border grid place-items-center transition-all ${
                  settings.align === "left"
                    ? "border-brand-600 ring-1 ring-brand-200 bg-brand-50 text-brand-700"
                    : "border-border/60 text-text-muted hover:border-border hover:bg-surface-50"
                }`}
                onClick={() => onSettingsChange({ ...settings, align: "left" })}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                className={`h-8 w-10 rounded-lg border grid place-items-center transition-all ${
                  settings.align === "center"
                    ? "border-brand-600 ring-1 ring-brand-200 bg-brand-50 text-brand-700"
                    : "border-border/60 text-text-muted hover:border-border hover:bg-surface-50"
                }`}
                onClick={() =>
                  onSettingsChange({ ...settings, align: "center" })
                }
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                type="button"
                className={`h-8 w-10 rounded-lg border grid place-items-center transition-all ${
                  settings.align === "right"
                    ? "border-brand-600 ring-1 ring-brand-200 bg-brand-50 text-brand-700"
                    : "border-border/60 text-text-muted hover:border-border hover:bg-surface-50"
                }`}
                onClick={() =>
                  onSettingsChange({ ...settings, align: "right" })
                }
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>
          </Row>
        </Section>

        <Section
          title={t("video_processor.inspector.panel.subtitle.settings.background")}
          right={
            <label className="inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={settings.bgEnabled}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    bgEnabled: e.target.checked,
                  })
                }
              />
              {t("video_processor.inspector.panel.subtitle.settings.enable")}
            </label>
          }
        >
          <Row
            label={t("video_processor.inspector.panel.subtitle.settings.color")}
            onReset={() =>
              onSettingsChange({
                ...settings,
                bgColor: DEFAULT_SETTINGS.bgColor,
              })
            }
            disabled={!settings.bgEnabled}
          >
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-8 h-8 rounded-lg border border-border/60 cursor-pointer transition-all hover:border-border focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-40 disabled:cursor-not-allowed"
                value={settings.bgColor}
                onChange={(e) =>
                  onSettingsChange({ ...settings, bgColor: e.target.value })
                }
                disabled={!settings.bgEnabled}
              />
              <input
                className="h-8 flex-1 rounded-lg border border-border/60 bg-white px-2.5 text-sm text-text-strong transition-all hover:border-border focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-40 disabled:cursor-not-allowed"
                value={settings.bgColor}
                onChange={(e) =>
                  onSettingsChange({ ...settings, bgColor: e.target.value })
                }
                disabled={!settings.bgEnabled}
              />
            </div>
          </Row>
          <Row
            label={t("video_processor.inspector.panel.subtitle.settings.opacity")}
            onReset={() =>
              onSettingsChange({
                ...settings,
                bgOpacity: DEFAULT_SETTINGS.bgOpacity,
              })
            }
            disabled={!settings.bgEnabled}
          >
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              className="w-full h-1.5 rounded-full bg-surface-100 appearance-none cursor-pointer accent-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(to right, rgb(99 102 241) 0%, rgb(99 102 241) ${
                  settings.bgOpacity * 100
                }%, rgb(229 231 235) ${
                  settings.bgOpacity * 100
                }%, rgb(229 231 235) 100%)`,
              }}
              value={settings.bgOpacity}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  bgOpacity: Number(e.target.value),
                })
              }
              disabled={!settings.bgEnabled}
            />
          </Row>
        </Section>

        {settingsFor === "cinematic" && (
          <Section title={t("video_processor.inspector.panel.subtitle.settings.karaoke")}>
            <Row
              label={t("video_processor.inspector.panel.subtitle.settings.karaoke_bg")}
              onReset={() =>
                onSettingsChange({
                  ...settings,
                  karaokeBg: DEFAULT_SETTINGS.karaokeBg,
                })
              }
            >
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-8 h-8 rounded-lg border border-border/60 cursor-pointer transition-all hover:border-border focus:outline-none focus:ring-1 focus:ring-brand-500"
                  value={settings.karaokeBg || DEFAULT_SETTINGS.karaokeBg}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, karaokeBg: e.target.value })
                  }
                />
                <input
                  className="h-8 flex-1 rounded-lg border border-border/60 bg-white px-2.5 text-sm text-text-strong transition-all hover:border-border focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                  value={settings.karaokeBg || DEFAULT_SETTINGS.karaokeBg}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, karaokeBg: e.target.value })
                  }
                />
              </div>
            </Row>

            <Row
              label={t("video_processor.inspector.panel.subtitle.settings.opacity")}
              onReset={() =>
                onSettingsChange({
                  ...settings,
                  karaokeOpacity: DEFAULT_SETTINGS.karaokeOpacity,
                })
              }
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                className="w-full h-1.5 rounded-full bg-surface-100 appearance-none cursor-pointer accent-brand-600"
                style={{
                  background: `linear-gradient(to right, rgb(99 102 241) 0%, rgb(99 102 241) ${
                    (settings.karaokeOpacity ??
                      DEFAULT_SETTINGS.karaokeOpacity) * 100
                  }%, rgb(229 231 235) ${
                    (settings.karaokeOpacity ??
                      DEFAULT_SETTINGS.karaokeOpacity) * 100
                  }%, rgb(229 231 235) 100%)`,
                }}
                value={
                  settings.karaokeOpacity ?? DEFAULT_SETTINGS.karaokeOpacity
                }
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    karaokeOpacity: Number(e.target.value),
                  })
                }
              />
            </Row>
          </Section>
        )}

        <Section title={t("video_processor.inspector.panel.subtitle.settings.layout")}>
          <Row
            label={t("video_processor.inspector.panel.subtitle.settings.horizontal_position")}
            onReset={() =>
              onSettingsChange({
                ...settings,
                hPlaceBase: DEFAULT_SETTINGS.hPlaceBase,
                hPlaceOffset: DEFAULT_SETTINGS.hPlaceOffset,
                hPlace: DEFAULT_SETTINGS.hPlace,
              })
            }
          >
            <div className="flex items-center gap-2 w-full">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`h-8 w-10 rounded-lg border grid place-items-center transition-all ${
                    (settings.hPlaceBase ?? 0.5) === 0.1
                      ? "border-brand-600 ring-1 ring-brand-200 bg-brand-50 text-brand-700"
                      : "border-border/60 text-text-muted hover:border-border hover:bg-surface-50"
                  }`}
                  onClick={() => {
                    const hPlaceBase = 0.1;
                    const hPlace = Math.max(
                      0,
                      Math.min(1, hPlaceBase + (settings.hPlaceOffset ?? 0))
                    );
                    onSettingsChange({ ...settings, hPlaceBase, hPlace });
                  }}
                  title={t("video_processor.inspector.panel.subtitle.settings.align_left")}
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className={`h-8 w-10 rounded-lg border grid place-items-center transition-all ${
                    (settings.hPlaceBase ?? 0.5) === 0.5
                      ? "border-brand-600 ring-1 ring-brand-200 bg-brand-50 text-brand-700"
                      : "border-border/60 text-text-muted hover:border-border hover:bg-surface-50"
                  }`}
                  onClick={() => {
                    const hPlaceBase = 0.5;
                    const hPlace = Math.max(
                      0,
                      Math.min(1, hPlaceBase + (settings.hPlaceOffset ?? 0))
                    );
                    onSettingsChange({ ...settings, hPlaceBase, hPlace });
                  }}
                  title={t("video_processor.inspector.panel.subtitle.settings.align_center")}
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className={`h-8 w-10 rounded-lg border grid place-items-center transition-all ${
                    (settings.hPlaceBase ?? 0.5) === 0.9
                      ? "border-brand-600 ring-1 ring-brand-200 bg-brand-50 text-brand-700"
                      : "border-border/60 text-text-muted hover:border-border hover:bg-surface-50"
                  }`}
                  onClick={() => {
                    const hPlaceBase = 0.9;
                    const hPlace = Math.max(
                      0,
                      Math.min(1, hPlaceBase + (settings.hPlaceOffset ?? 0))
                    );
                    onSettingsChange({ ...settings, hPlaceBase, hPlace });
                  }}
                  title={t("video_processor.inspector.panel.subtitle.settings.align_right")}
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>
              <input
                type="range"
                min={-0.2}
                max={0.2}
                step={0.01}
                className="flex-1 h-1.5 rounded-full bg-surface-100 appearance-none cursor-pointer accent-brand-600"
                style={{
                  background: `linear-gradient(to right, rgb(99 102 241) 0%, rgb(99 102 241) ${
                    (((settings.hPlaceOffset ?? 0) + 0.2) / 0.4) * 100
                  }%, rgb(229 231 235) ${
                    (((settings.hPlaceOffset ?? 0) + 0.2) / 0.4) * 100
                  }%, rgb(229 231 235) 100%)`,
                }}
                value={settings.hPlaceOffset ?? 0}
                onChange={(e) => {
                  const hPlaceOffset = Number(e.target.value);
                  const hPlaceBase = settings.hPlaceBase ?? 0.5;
                  const hPlace = Math.max(
                    0,
                    Math.min(1, hPlaceBase + hPlaceOffset)
                  );
                  onSettingsChange({ ...settings, hPlaceOffset, hPlace });
                }}
              />
            </div>
          </Row>

          <Row
            label={t("video_processor.inspector.panel.subtitle.settings.vertical_position")}
            onReset={() =>
              onSettingsChange({
                ...settings,
                vPlaceBase: DEFAULT_SETTINGS.vPlaceBase,
                vPlaceOffset: DEFAULT_SETTINGS.vPlaceOffset,
                vPlace: DEFAULT_SETTINGS.vPlace,
              })
            }
          >
            <div className="flex items-center gap-2 w-full">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`h-8 w-10 rounded-lg border grid place-items-center transition-all ${
                    (settings.vPlaceBase ?? 0.85) === 0.1
                      ? "border-brand-600 ring-1 ring-brand-200 bg-brand-50 text-brand-700"
                      : "border-border/60 text-text-muted hover:border-border hover:bg-surface-50"
                  }`}
                  onClick={() => {
                    const vPlaceBase = 0.1;
                    const vPlace = Math.max(
                      0,
                      Math.min(1, vPlaceBase + (settings.vPlaceOffset ?? 0))
                    );
                    onSettingsChange({ ...settings, vPlaceBase, vPlace });
                  }}
                  title={t("video_processor.inspector.panel.subtitle.settings.top")}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className={`h-8 w-10 rounded-lg border grid place-items-center transition-all ${
                    (settings.vPlaceBase ?? 0.85) === 0.5
                      ? "border-brand-600 ring-1 ring-brand-200 bg-brand-50 text-brand-700"
                      : "border-border/60 text-text-muted hover:border-border hover:bg-surface-50"
                  }`}
                  onClick={() => {
                    const vPlaceBase = 0.5;
                    const vPlace = Math.max(
                      0,
                      Math.min(1, vPlaceBase + (settings.vPlaceOffset ?? 0))
                    );
                    onSettingsChange({ ...settings, vPlaceBase, vPlace });
                  }}
                  title={t("video_processor.inspector.panel.subtitle.settings.middle")}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className={`h-8 w-10 rounded-lg border grid place-items-center transition-all ${
                    (settings.vPlaceBase ?? 0.85) === 0.9
                      ? "border-brand-600 ring-1 ring-brand-200 bg-brand-50 text-brand-700"
                      : "border-border/60 text-text-muted hover:border-border hover:bg-surface-50"
                  }`}
                  onClick={() => {
                    const vPlaceBase = 0.9;
                    const vPlace = Math.max(
                      0,
                      Math.min(1, vPlaceBase + (settings.vPlaceOffset ?? 0))
                    );
                    onSettingsChange({ ...settings, vPlaceBase, vPlace });
                  }}
                  title={t("video_processor.inspector.panel.subtitle.settings.bottom")}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <input
                type="range"
                min={-0.2}
                max={0.2}
                step={0.01}
                className="flex-1 h-1.5 rounded-full bg-surface-100 appearance-none cursor-pointer accent-brand-600"
                style={{
                  background: `linear-gradient(to right, rgb(99 102 241) 0%, rgb(99 102 241) ${
                    (((settings.vPlaceOffset ?? 0) + 0.2) / 0.4) * 100
                  }%, rgb(229 231 235) ${
                    (((settings.vPlaceOffset ?? 0) + 0.2) / 0.4) * 100
                  }%, rgb(229 231 235) 100%)`,
                }}
                value={settings.vPlaceOffset ?? 0}
                onChange={(e) => {
                  const vPlaceOffset = Number(e.target.value);
                  const vPlaceBase = settings.vPlaceBase ?? 0.85;
                  const vPlace = Math.max(
                    0,
                    Math.min(1, vPlaceBase + vPlaceOffset)
                  );
                  onSettingsChange({ ...settings, vPlaceOffset, vPlace });
                }}
              />
            </div>
          </Row>

          <Row
            label={t("video_processor.inspector.panel.subtitle.settings.auto_break")}
            onReset={() =>
              onSettingsChange({
                ...settings,
                autoBreak: DEFAULT_SETTINGS.autoBreak,
              })
            }
          >
            <label className="inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={settings.autoBreak}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    autoBreak: e.target.checked,
                  })
                }
              />
              {t("video_processor.inspector.panel.subtitle.settings.enable")}
            </label>
          </Row>

          <Row
            label={t("video_processor.inspector.panel.subtitle.settings.max_lines")}
            onReset={() =>
              onSettingsChange({
                ...settings,
                maxLines: DEFAULT_SETTINGS.maxLines,
              })
            }
          >
            <input
              type="number"
              min={1}
              max={6}
              className="h-8 w-24 rounded-lg border border-border/60 bg-white px-2.5 text-sm text-text-strong transition-all hover:border-border focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
              value={settings.maxLines}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  maxLines: Number(e.target.value),
                })
              }
            />
          </Row>

          <Row
            label={t("video_processor.inspector.panel.subtitle.settings.max_words")}
            onReset={() =>
              onSettingsChange({
                ...settings,
                maxWords: DEFAULT_SETTINGS.maxWords,
              })
            }
          >
            <input
              type="number"
              min={1}
              max={20}
              className="h-8 w-24 rounded-lg border border-border/60 bg-white px-2.5 text-sm text-text-strong transition-all hover:border-border focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
              value={settings.maxWords}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  maxWords: Number(e.target.value),
                })
              }
            />
          </Row>
        </Section>
      </div>
    </div>
  );
}
