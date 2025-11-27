"use client";
import React, { useEffect } from "react";
import { X } from "lucide-react";
import CharacterManager from "./CharacterManager";
import CharacterAssignment from "./CharacterAssignment";
import { useTranslations } from "next-intl";

export default function CharacterOverlay({
  isOpen,
  onClose,
  segments = [],
  selectedIndex = null,
  characters = [],
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onAssignSegment,
  onUnassignSegment,
  voiceOptions = [],
  globalVoice,
}) {
  const t = useTranslations();
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-text-strong">
              {t("video_processor.inspector.voiceover.character_management_title")}
            </h2>
            <p className="text-xs text-text-muted mt-1">
              {t("video_processor.inspector.voiceover.character_management_description")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-50 text-text-muted transition-colors"
            title={t("video_processor.inspector.voiceover.close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Character Management */}
            <div className="space-y-4">
              <div className="sticky top-0 bg-white z-10 pb-2">
                <h3 className="text-sm font-semibold text-text-strong mb-4">
                  {t("video_processor.inspector.voiceover.character_management_title")}
                </h3>
              </div>
              <CharacterManager
                characters={characters}
                onAddCharacter={onAddCharacter}
                onUpdateCharacter={onUpdateCharacter}
                onDeleteCharacter={onDeleteCharacter}
                voiceOptions={voiceOptions}
                globalVoice={globalVoice}
              />
            </div>

            {/* Right Column - Character Assignment */}
            <div className="space-y-4">
              <div className="sticky top-0 bg-white z-10 pb-2">
                <h3 className="text-sm font-semibold text-text-strong mb-4">
                  {t("video_processor.inspector.voiceover.assign_segment_to_character_title")}
                </h3>
              </div>
              <CharacterAssignment
                segments={segments}
                selectedIndex={selectedIndex}
                characters={characters}
                onAssignSegment={onAssignSegment}
                onUnassignSegment={onUnassignSegment}
                onSegmentClick={(index) => {
                  // Scroll to segment in VoiceoverPanel if needed
                  // This will be handled by parent component
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-text-muted hover:bg-surface-50 text-sm transition"
          >
            {t("video_processor.inspector.voiceover.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
