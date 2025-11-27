"use client";
import React, { useEffect, useMemo, useRef } from "react";
import { Upload } from "lucide-react";
import MediaCard from "./MediaCard";
import { EmptyState } from "./EmptyState";
import Button from "@/shared/ui/button";
import DragScrollRow from "@/shared/ui/DragScrollRow";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useMedia, useProject } from "../../../context";
import { useTranslations } from "next-intl";

function MediaCardSkeleton() {
  return (
    <div className="select-none">
      <div className="h-[98px] max-w-[174px] w-[174px] overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <Skeleton height={98} width={174} />
      </div>
      <div className="mt-1">
        <Skeleton height={14} width={140} />
      </div>
    </div>
  );
}

export default function MediaPanel() {
  const t = useTranslations();
  const media = useMedia();
  const project = useProject();
  const hasLoadedOnceRef = useRef(false);

  const { media: mediaPanel, timelineAssetIds } = media;
  const { loading: projectLoading, projectId } = project;

  useEffect(() => {
    hasLoadedOnceRef.current = false;
  }, [projectId]);

  useEffect(() => {
    if (
      mediaPanel.items.length > 0 ||
      (mediaPanel.idProject &&
        !mediaPanel.loading &&
        mediaPanel.items.length === 0)
    ) {
      hasLoadedOnceRef.current = true;
    }
  }, [mediaPanel.items.length, mediaPanel.idProject, mediaPanel.loading]);

  const hasProjectId = projectId && mediaPanel.idProject;
  const isInitializing =
    hasProjectId && !hasLoadedOnceRef.current && mediaPanel.items.length === 0;
  const isLoading = mediaPanel.loading || projectLoading || isInitializing;

  useEffect(() => {
    if (!mediaPanel.idProject) return;
    mediaPanel.loadMedia();
  }, [mediaPanel.idProject]);

  const skeletonItems = useMemo(() => Array.from({ length: 12 }), []);

  return (
    <div
      className="h-full w-full bg-white text-text-strong flex flex-col overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={mediaPanel.onDrop}
    >
      <div className="shrink-0 border-b border-border px-4 py-3">
        <DragScrollRow className="gap-1.5">
          {mediaPanel.TABS.map(({ key, label, icon: Icon }) => {
            const activeTab = mediaPanel.active === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => mediaPanel.setActive(key)}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm ${
                  activeTab
                    ? "bg-brand text-white"
                    : "text-text-muted hover:bg-surface-50"
                }`}
              >
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {label}
              </button>
            );
          })}
        </DragScrollRow>

        <div className="flex items-center">
          <input
            ref={mediaPanel.inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => mediaPanel.handleFiles(e.target.files)}
            accept="video/*,image/*,audio/*,.srt,.vtt,.ass,.ssa,.sbv,.sub,.ttml,.dfxp"
          />
          <Button
            type="button"
            className="mt-2"
            handleClick={mediaPanel.openPicker}
            fullWidth
          >
            <div className="flex items-center justify-center gap-2">
              <Upload className="h-4 w-4" />
              {t("video_processor.inspector.panel.media.import_media")}
            </div>
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {isLoading && mediaPanel.items.length === 0 ? (
          <div className="p-4">
            <SkeletonTheme baseColor="#d5e4ed" highlightColor="#f8fafc">
              <div className="grid grid-cols-2 gap-4">
                {skeletonItems.map((_, i) => (
                  <MediaCardSkeleton key={i} />
                ))}
              </div>
            </SkeletonTheme>
          </div>
        ) : !isLoading && mediaPanel.filtered.length === 0 ? (
          <div className="h-full grid place-items-center">
            <EmptyState onClickImport={mediaPanel.openPicker} />
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {mediaPanel.filtered.map((m) => (
                <MediaCard
                  key={m.id}
                  item={m}
                  onClick={() => {}}
                  isUsed={timelineAssetIds?.has?.(
                    String(m.serverAsset?.id || m.serverAsset?._id || m.id)
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
