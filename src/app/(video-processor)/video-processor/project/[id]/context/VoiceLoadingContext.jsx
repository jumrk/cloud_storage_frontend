"use client";
import { createContext, useContext, useState, useCallback, useMemo } from "react";

const VoiceLoadingContext = createContext(null);

export function VoiceLoadingProvider({ children }) {
  // Track loading state for each clip by clipId
  const [loadingClips, setLoadingClips] = useState(new Set());
  const [loadingProgress, setLoadingProgress] = useState(new Map()); // clipId -> progress

  const setClipLoading = useCallback((clipId, isLoading) => {
    setLoadingClips((prev) => {
      const next = new Set(prev);
      if (isLoading) {
        next.add(clipId);
      } else {
        next.delete(clipId);
      }
      return next;
    });
  }, []);

  const setClipProgress = useCallback((clipId, progress) => {
    setLoadingProgress((prev) => {
      const next = new Map(prev);
      if (progress !== null && progress !== undefined) {
        next.set(clipId, progress);
      } else {
        next.delete(clipId);
      }
      return next;
    });
  }, []);

  const isClipLoading = useCallback((clipId) => {
    return loadingClips.has(clipId);
  }, [loadingClips]);

  const getClipProgress = useCallback((clipId) => {
    return loadingProgress.get(clipId) || 0;
  }, [loadingProgress]);

  const clearClipLoading = useCallback((clipId) => {
    setLoadingClips((prev) => {
      const next = new Set(prev);
      next.delete(clipId);
      return next;
    });
    setLoadingProgress((prev) => {
      const next = new Map(prev);
      next.delete(clipId);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      loadingClips,
      loadingProgress,
      setClipLoading,
      setClipProgress,
      isClipLoading,
      getClipProgress,
      clearClipLoading,
    }),
    [
      loadingClips,
      loadingProgress,
      setClipLoading,
      setClipProgress,
      isClipLoading,
      getClipProgress,
      clearClipLoading,
    ]
  );

  return (
    <VoiceLoadingContext.Provider value={value}>
      {children}
    </VoiceLoadingContext.Provider>
  );
}

export function useVoiceLoading() {
  const context = useContext(VoiceLoadingContext);
  if (!context) {
    throw new Error("useVoiceLoading must be used within VoiceLoadingProvider");
  }
  return context;
}

export function useVoiceLoadingMaybe() {
  return useContext(VoiceLoadingContext);
}

