"use client";
import { createContext, useContext, useMemo, useCallback } from "react";
import useSubFromAsset from "../hooks/tools/useSubFromAsset";
import useSubFromProject from "../hooks/tools/useSubFromProject";
import useTranslateSub from "../hooks/tools/useTranslateSub";
import { useProject, useSelection } from "./index";

const Ctx = createContext(null);

export function SubtitleToolsProvider({ children }) {
  const project = useProject();
  const selection = useSelection();

  const { projectId, updateTimelineFromData, reloadProjectTimeline } = project;
  const { selectedVideoClip } = selection;

  const hasAssetId = !!selectedVideoClip?.assetId;

  // Reload project data after subtitle extraction completes successfully
  const handleJobComplete = useCallback(() => {
    // Reload project timeline to get updated subtitle clips with wordTiming
    reloadProjectTimeline?.();
  }, [reloadProjectTimeline]);

  // Hook cho trường hợp có assetId (từ selected clip)
  const subFromAsset = useSubFromAsset({
    projectId,
    selectedClip: selectedVideoClip,
    onReloadProject: handleJobComplete,
  });

  // Hook cho trường hợp không có assetId (từ project)
  const subFromProject = useSubFromProject({
    projectId,
    onReloadProject: handleJobComplete,
  });

  // Hook cho translation
  const translateSub = useTranslateSub({
    projectId,
    onReloadProject: handleJobComplete,
  });

  // Chọn hook dựa trên có selected clip hay không
  const activeHook = hasAssetId ? subFromAsset : subFromProject;

  const startSubtitle = useCallback(
    (cfg) => {
      if (hasAssetId) {
        subFromAsset.startTachSub(cfg);
      } else {
        subFromProject.startTachSub(cfg);
      }
    },
    [hasAssetId, subFromAsset, subFromProject]
  );

  // Hàm dịch phụ đề
  const handleTranslateSub = useCallback(
    (assetId, toLang, options = {}) => {
      if (!toLang) return;
      // Bỏ qua assetId vì translation luôn làm việc với toàn bộ project
      translateSub.startTranslate(toLang);
    },
    [translateSub]
  );

  // Kết hợp loading state từ cả subtitle và translation
  const subtitleLoading = activeHook.loading;
  const translateLoading = translateSub.loading;
  const loading = subtitleLoading || translateLoading;
  
  // Ưu tiên hiển thị translation nếu đang chạy
  const activeLoadingHook = translateLoading ? translateSub : activeHook;
  const loadingAction = activeLoadingHook.loadingAction;
  const loadingText = activeLoadingHook.loadingText;
  const loadingProgress = activeLoadingHook.progress;
  const loadingStatus = activeLoadingHook.status;
  const loadingPhase = activeLoadingHook.phase;

  const value = useMemo(
    () => ({
      loading,
      loadingAction,
      loadingText,
      loadingProgress,
      loadingStatus,
      loadingPhase,
      startSubtitle,
      translateSub: handleTranslateSub,
      hasAssetId,
    }),
    [
      loading,
      loadingAction,
      loadingText,
      loadingProgress,
      loadingStatus,
      loadingPhase,
      startSubtitle,
      handleTranslateSub,
      hasAssetId,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSubtitleTools() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error(
      "useSubtitleTools phải được dùng bên trong <SubtitleToolsProvider>"
    );
  return ctx;
}

export function useSubtitleToolsMaybe() {
  return useContext(Ctx);
}
