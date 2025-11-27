"use client";

import { Scissors, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ToolsBar({
  onSplit,
  onDelete,
  disabledSplit = false,
  disabledDelete = true,
}) {
  const t = useTranslations();
  return (
    <div className="flex items-center gap-2 px-2">
      <button
        type="button"
        onClick={onSplit}
        disabled={disabledSplit}
        title={t("video_processor.inspector.timeline.split_with_shortcut")}
        aria-label={t("video_processor.inspector.timeline.split")}
        className="h-8 px-2 inline-flex items-center justify-center rounded-md border border-border bg-white hover:bg-surface-50 disabled:opacity-50"
      >
        <Scissors className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onDelete}
        disabled={disabledDelete}
        title={t("video_processor.inspector.timeline.delete_with_shortcut")}
        aria-label={t("video_processor.inspector.timeline.delete")}
        className="h-8 px-2 inline-flex items-center justify-center rounded-md border border-border bg-white hover:bg-surface-50 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
