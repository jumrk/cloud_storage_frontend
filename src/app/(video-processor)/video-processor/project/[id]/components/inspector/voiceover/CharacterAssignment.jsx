"use client";
import React, { useState, useMemo } from "react";
import { X } from "lucide-react";
import FieldHeader from "./FieldHeader";
import { useTranslations } from "next-intl";

export default function CharacterAssignment({
  segments = [],
  selectedIndex,
  characters = [],
  onAssignSegment,
  onUnassignSegment,
  onSegmentClick,
}) {
  const t = useTranslations();
  const [quickSelectMode, setQuickSelectMode] = useState(false);
  const [quickSelectCharId, setQuickSelectCharId] = useState(null);

  const selectedSegment =
    selectedIndex !== null ? segments[selectedIndex] : null;

  const assignmentStats = useMemo(() => {
    const stats = {};
    characters.forEach((char) => {
      stats[char.id] = segments.filter(
        (seg) => seg.characterId === char.id
      ).length;
    });
    stats.default = segments.filter((seg) => !seg.characterId).length;
    return stats;
  }, [segments, characters]);

  const handleQuickAssign = (charId) => {
    if (!quickSelectMode) {
      setQuickSelectMode(true);
      setQuickSelectCharId(charId);
    } else {
      setQuickSelectMode(false);
      setQuickSelectCharId(null);
    }
  };

  const handleSegmentClick = (index) => {
    if (quickSelectMode && quickSelectCharId) {
      onAssignSegment(index, quickSelectCharId);
    } else if (onSegmentClick) {
      onSegmentClick(index);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <FieldHeader label={t("video_processor.inspector.voiceover.assign_segment_to_character")} />
        {quickSelectMode && (
          <button
            type="button"
            onClick={() => {
              setQuickSelectMode(false);
              setQuickSelectCharId(null);
            }}
            className="text-xs text-rose-600 hover:text-rose-700"
          >
            {t("video_processor.inspector.voiceover.cancel_quick_select")}
          </button>
        )}
      </div>

      {quickSelectMode && (
        <div className="rounded-lg border border-brand-300 bg-brand-50 p-2 text-xs text-brand-700">
          <strong>{t("video_processor.inspector.voiceover.quick_select_mode")}</strong> {t("video_processor.inspector.voiceover.quick_select_instruction")}{" "}
          <strong>
            {characters.find((c) => c.id === quickSelectCharId)?.name || t("video_processor.inspector.voiceover.this")}
          </strong>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-xs text-text-muted mb-1">{t("video_processor.inspector.voiceover.quick_select")}</div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleQuickAssign("default")}
            className={`px-2 py-1 rounded border text-xs transition ${
              quickSelectMode && quickSelectCharId === "default"
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-border hover:bg-surface-50 text-text-muted"
            }`}
          >
            {t("video_processor.inspector.voiceover.default_voice_with_count", { count: assignmentStats.default || 0 })}
          </button>
          {characters.map((char) => (
            <button
              key={char.id}
              type="button"
              onClick={() => handleQuickAssign(char.id)}
              className={`px-2 py-1 rounded border text-xs transition ${
                quickSelectMode && quickSelectCharId === char.id
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-border hover:bg-surface-50 text-text-muted"
              }`}
            >
              {char.name} ({assignmentStats[char.id] || 0})
            </button>
          ))}
        </div>
      </div>

      {selectedSegment && (
        <div className="rounded-lg border border-border p-3 bg-surface-50">
          <div className="text-xs font-medium text-text-strong mb-2">
            {t("video_processor.inspector.voiceover.selected_segment")}
          </div>
          <div className="text-xs text-text-muted mb-3 line-clamp-2">
            {selectedSegment.text || "—"}
          </div>
          <select
            value={selectedSegment.characterId || "default"}
            onChange={(e) => {
              const charId =
                e.target.value === "default" ? null : e.target.value;
              if (charId) {
                onAssignSegment(selectedIndex, charId);
              } else {
                onUnassignSegment(selectedIndex);
              }
            }}
            className="w-full rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="default">{t("video_processor.inspector.voiceover.use_default_voice")}</option>
            {characters.map((char) => (
              <option key={char.id} value={char.id}>
                {char.name}
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center gap-2">
            {selectedSegment.characterId ? (
              <>
                <span className="text-xs text-text-muted">
                  {t("video_processor.inspector.voiceover.using_voice_of")}{" "}
                  <strong>
                    {characters.find(
                      (c) => c.id === selectedSegment.characterId
                    )?.name || "—"}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => onUnassignSegment(selectedIndex)}
                  className="ml-auto text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  {t("video_processor.inspector.voiceover.unassign")}
                </button>
              </>
            ) : (
              <span className="text-xs text-text-muted">
                {t("video_processor.inspector.voiceover.using_default_voice")}
              </span>
            )}
          </div>
        </div>
      )}

      {segments.length > 0 && (
        <div className="space-y-2 max-h-[400px] overflow-auto">
          <div className="text-xs font-medium text-text-strong mb-2">
            {t("video_processor.inspector.voiceover.segment_list", { count: segments.length })}
          </div>
          <div className="space-y-1.5">
            {segments.map((seg, index) => {
              const assignedChar = seg.characterId
                ? characters.find((c) => c.id === seg.characterId)
                : null;
              const isSelected = selectedIndex === index;
              const isQuickSelectActive =
                quickSelectMode && quickSelectCharId !== null;

              return (
                <div
                  key={seg.id || index}
                  onClick={() => handleSegmentClick(index)}
                  className={`rounded-lg border p-2.5 cursor-pointer transition ${
                    isSelected
                      ? "border-brand-600 bg-brand-50"
                      : isQuickSelectActive
                      ? "border-brand-300 hover:border-brand-400 hover:bg-brand-50/50"
                      : "border-border hover:border-brand-300 hover:bg-surface-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-text-strong mb-1 line-clamp-2">
                        {seg.text || "—"}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        {seg.start !== undefined &&
                          seg.duration !== undefined && (
                            <span>
                              {formatTime(seg.start)} -{" "}
                              {formatTime(seg.start + seg.duration)}
                            </span>
                          )}
                        {assignedChar && (
                          <>
                            <span>•</span>
                            <span className="text-brand-600 font-medium">
                              {assignedChar.name}
                            </span>
                          </>
                        )}
                        {!assignedChar && (
                          <>
                            <span>•</span>
                            <span>{t("video_processor.inspector.voiceover.default_voice")}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="shrink-0 w-2 h-2 rounded-full bg-brand-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {segments.length === 0 && (
        <div className="text-xs text-text-muted text-center py-8 border border-dashed border-border rounded-lg">
          {t("video_processor.inspector.voiceover.no_segments")}
        </div>
      )}
    </section>
  );
}
