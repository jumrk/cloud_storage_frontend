"use client";
import React, { useState } from "react";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import FieldHeader from "./FieldHeader";
import { useTranslations } from "next-intl";

export default function CharacterManager({
  characters = [],
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  voiceOptions,
  globalVoice,
}) {
  const t = useTranslations();
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editVoiceId, setEditVoiceId] = useState("");

  const handleStartEdit = (char) => {
    setEditingId(char.id);
    setEditName(char.name);
    setEditVoiceId(char.voiceId || "");
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      onUpdateCharacter(editingId, {
        name: editName.trim(),
        voiceId: editVoiceId || null,
      });
      setEditingId(null);
      setEditName("");
      setEditVoiceId("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditVoiceId("");
  };

  const handleAdd = () => {
    const newId = `char_${Date.now()}`;
    onAddCharacter({
      id: newId,
      name: `${t("video_processor.inspector.voiceover.character_prefix")} ${characters.length + 1}`,
      voiceId: null,
    });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <FieldHeader label={t("video_processor.inspector.voiceover.character_management")} />
        <button
          type="button"
          onClick={handleAdd}
          className="px-2 py-1 rounded-lg border border-border hover:bg-surface-50 text-sm flex items-center gap-1 text-text-muted"
        >
          <Plus className="w-4 h-4" />
          {t("video_processor.inspector.voiceover.add")}
        </button>
      </div>

      <div className="space-y-2">
        {characters.map((char) => {
          const isEditing = editingId === char.id;
          const voice = char.voiceId
            ? voiceOptions.find((v) => v.id === char.voiceId)
            : null;

          return (
            <div
              key={char.id}
              className="rounded-lg border border-border p-3 bg-white"
            >
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={t("video_processor.inspector.voiceover.character_name_placeholder")}
                    className="w-full rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                  <select
                    value={editVoiceId}
                    onChange={(e) => setEditVoiceId(e.target.value)}
                    className="w-full rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    <option value="">{t("video_processor.inspector.voiceover.use_default_voice")}</option>
                    {voiceOptions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="px-2 py-1 rounded border border-brand-300 text-brand-700 hover:bg-brand-50 text-sm flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {t("video_processor.inspector.voiceover.save")}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-2 py-1 rounded border border-border hover:bg-surface-50 text-sm flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      {t("video_processor.inspector.voiceover.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-strong text-sm">
                      {char.name}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {t("video_processor.inspector.voiceover.voice_label")} {voice ? voice.label : t("video_processor.inspector.voiceover.default_voice")}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(char)}
                      className="p-1.5 rounded hover:bg-surface-50 text-text-muted"
                      title={t("video_processor.inspector.voiceover.edit")}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCharacter(char.id)}
                      className="p-1.5 rounded hover:bg-rose-50 text-rose-600"
                      title={t("video_processor.inspector.voiceover.delete")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {characters.length === 0 && (
          <div className="text-center py-4 text-sm text-text-muted">
            {t("video_processor.inspector.voiceover.no_characters")}
          </div>
        )}
      </div>
    </section>
  );
}

