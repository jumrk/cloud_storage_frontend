"use client";
import React from "react";
import FieldHeader from "./FieldHeader";
import { useTranslations } from "next-intl";

const getModels = (t) => [
  {
    id: "eleven_multilingual_v2",
    name: "Multilingual v2",
    desc: t("video_processor.inspector.voiceover.model_multilingual_desc"),
    langs: ["vi", "en", "es", "fr", "de"],
  },
  {
    id: "eleven_turbo_v2_5",
    name: "Turbo v2.5",
    desc: t("video_processor.inspector.voiceover.model_turbo_desc"),
    langs: ["vi", "en"],
  },
];

export default function ModelSelector({ modelId, setModelId }) {
  const t = useTranslations();
  const MODELS = getModels(t);
  return (
    <section className="mt-2">
      <FieldHeader label={t("video_processor.inspector.voiceover.model")} />
      <div className="space-y-2">
        {MODELS.map((m) => {
          const selected = modelId === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setModelId(m.id)}
              className={`w-full text-left rounded-lg border p-3 transition ${
                selected
                  ? "border-brand-600 ring-2 ring-brand-200 bg-brand-50"
                  : "border-border hover:border-brand-300 hover:bg-surface-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-text-strong text-sm">
                    {m.name}
                  </div>
                  <p className="text-xs text-text-muted mt-1">{m.desc}</p>
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
        })}
      </div>
    </section>
  );
}
