"use client";
import React, { useMemo, useState } from "react";
import {
  Play,
  Image as ImageIcon,
  Music2,
  Maximize2,
  X,
  FileText,
} from "lucide-react";
import Modal from "@/shared/ui/Modal";
import PrettyPreview from "./PrettyPreview";
import { useTranslations } from "next-intl";

function formatDuration(total = 0) {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return (
    (h ? `${h}:` : "") +
    String(m).padStart(2, "0") +
    ":" +
    String(sec).padStart(2, "0")
  );
}

export default function MediaCard({ item, onClick, isUsed = false }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const isVideo = item.type === "video";
  const isImage = item.type === "image";
  const isAudio = item.type === "audio";
  const isSubtitle = item.type === "subtitle";

  const uploading = item.status === "uploading";
  const used = Boolean(isUsed);

  const thumb = useMemo(
    () => item.thumb || item.thumbUrl || item.coverUrl || null,
    [item.thumb, item.thumbUrl, item.coverUrl]
  );

  const previewSrc =
    item.serverAsset?.fileUrl || item.fileUrl || item.src || null;
  const extLabel = (item.name?.split(".").pop() || "").toUpperCase();

  const onDragStart = (e) => {
    const payload = {
      id: item.id,
      assetId: item.serverAsset?.id || item.id,
      type: item.type,
      name: item.name,
      durationSec:
        Number(item.durationSec) > 0
          ? Number(item.durationSec)
          : item.type === "image"
          ? 3
          : 0,
      fileUrl: item.serverAsset?.fileUrl || item.fileUrl || null,
      coverUrl: thumb || null,
      fps: item.serverAsset?.fps || null,
      width: item.serverAsset?.width || null,
      height: item.serverAsset?.height || null,
    };
    e.dataTransfer.setData("application/x-d2m-asset", JSON.stringify(payload));
    e.dataTransfer.setData("text/plain", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <>
      <div className="select-none">
        <div
          role="button"
          tabIndex={0}
          draggable
          onDragStart={onDragStart}
          onClick={() => onClick?.(item)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick?.(item);
            }
          }}
          className="group relative block h-[98px] max-w-[174px] overflow-hidden rounded-xl border border-border bg-white shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
        >
          <div className="relative h-full w-full overflow-hidden bg-surface-50">
            {(isImage || isVideo) && thumb ? (
              <img
                src={thumb}
                alt={item.name}
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                {isVideo && <Play className="h-8 w-8 text-brand/70" />}
                {isImage && <ImageIcon className="h-8 w-8 text-brand/70" />}
                {isAudio && <Music2 className="h-8 w-8 text-brand/70" />}
                {isSubtitle && <FileText className="h-8 w-8 text-brand/70" />}
              </div>
            )}

            {isVideo && item.durationSec > 0 && (
              <div className="absolute left-1 bottom-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] leading-none text-white">
                {formatDuration(item.durationSec)}
              </div>
            )}

            {isSubtitle && (
              <div className="absolute left-1 bottom-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] leading-none text-white">
                {extLabel || "SUB"}
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0">
                <div
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand to-brand/60 transition-[height] duration-200"
                  style={{ height: `${item.progress || 0}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-md bg-black/40 px-2 py-0.5 text-xs text-white">
                    {Math.min(99, Math.round(item.progress || 0))}%
                  </span>
                </div>
              </div>
            )}

            {used && !uploading && (
              <div className="absolute right-1 top-1 rounded-md bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                {t("video_processor.inspector.panel.media.added")}
              </div>
            )}

            {(isVideo || isImage || isAudio) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(true);
                }}
                className="absolute right-1 bottom-1 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={t("video_processor.inspector.panel.media.view_large")}
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}

            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-opacity group-hover:bg-black/5" />
          </div>
        </div>

        <div className="mt-1 truncate text-[13px] text-text-strong">
          {item.name}
        </div>
      </div>

      {open && (isVideo || isImage || isAudio) && (
        <Modal onClose={() => setOpen(false)}>
          <div className="p-4 w-full max-w-4xl">
            <div className="flex items-start justify-between mb-3">
              <div className="truncate pr-4 text-sm text-text-muted">
                {item.name}
              </div>
              <button
                className="rounded-md p-1 hover:bg-surface-50"
                onClick={() => setOpen(false)}
                aria-label={t("video_processor.inspector.panel.media.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <PrettyPreview
              type={item.type}
              src={previewSrc}
              poster={thumb || item.coverUrl || undefined}
              durationHint={item.durationSec}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
