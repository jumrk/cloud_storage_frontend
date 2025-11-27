import React from "react";
import { useTranslations } from "next-intl";

export function EmptyState({ onClickImport }) {
  const t = useTranslations();
  return (
    <div className="flex h-[calc(100%-56px)] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="relative h-28 w-28">
        <div className="absolute -left-3 top-3 h-16 w-16 rotate-[-14deg] rounded-xl bg-accent/10 ring-1 ring-border" />
        <div className="absolute left-7 top-0 h-16 w-16 rotate-[12deg] rounded-xl bg-brand/10 ring-1 ring-border" />
        <div className="absolute left-4 top-8 h-20 w-20 rotate-3 rounded-xl bg-warning/10 ring-1 ring-border" />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-text-muted">
          {t("video_processor.inspector.panel.media.drag_drop_instruction")}
        </p>
      </div>

      <button
        type="button"
        onClick={onClickImport}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:brightness-110"
      >
        {t("video_processor.inspector.panel.media.import_media")}
      </button>
    </div>
  );
}
