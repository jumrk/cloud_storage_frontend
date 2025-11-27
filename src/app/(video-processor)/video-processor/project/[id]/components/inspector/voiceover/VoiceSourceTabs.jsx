"use client";
import React from "react";
import { Upload } from "lucide-react";
import FieldHeader from "./FieldHeader";
import { useTranslations } from "next-intl";

export default function VoiceSourceTabs({
  voiceSource,
  setVoiceSource,
  onFileUpload,
  fileInputRef,
  voiceName,
  setVoiceName,
  uploadingClone,
  uploadProgress,
}) {
  const t = useTranslations();
  return (
    <section className="space-y-3 mt-2 min-h-0">
      <FieldHeader label={t("video_processor.inspector.voiceover.voice_library")} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setVoiceSource("default")}
          className={`px-3 py-1.5 rounded-lg border text-sm transition ${
            voiceSource === "default"
              ? "border-brand-600 text-brand-700 bg-brand-50"
              : "border-border text-text-muted hover:bg-surface-50"
          }`}
        >
          {t("video_processor.inspector.voiceover.default_voice")}
        </button>
        <button
          type="button"
          onClick={() => setVoiceSource("my")}
          className={`px-3 py-1.5 rounded-lg border text-sm transition ${
            voiceSource === "my"
              ? "border-brand-600 text-brand-700 bg-brand-50"
              : "border-border text-text-muted hover:bg-surface-50"
          }`}
        >
          {t("video_processor.inspector.voiceover.my_voice")}
        </button>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          voiceSource === "my"
            ? "max-h-[500px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-2">
          <div className="w-full flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border w-full flex justify-center border-border text-text-muted hover:bg-surface-50 text-sm transition"
              title={t("video_processor.inspector.voiceover.upload_audio_file")}
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={onFileUpload}
            />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="p-2">
              <label className="text-xs text-text-muted mb-1 block">
                {t("video_processor.inspector.voiceover.voice_name")}
              </label>
              <input
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                placeholder={t("video_processor.inspector.voiceover.voice_name_placeholder")}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 transition"
              />
            </div>
            {uploadingClone && (
              <div>
                <div className="text-xs text-text-muted mb-1">
                  {t("video_processor.inspector.voiceover.uploading")} {uploadProgress}%
                </div>
                <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-brand-600 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
