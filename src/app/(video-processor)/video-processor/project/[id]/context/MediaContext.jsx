"use client";
import { createContext, useContext, useMemo, useState } from "react";
import useMediaPanel from "../hooks/media/useMediaPanel";
import { useProjectMaybe } from "./ProjectContext";

const Ctx = createContext(null);

export function MediaProvider({ children }) {
  const project = useProjectMaybe();
  const projectId = project?.projectId;

  const media = useMediaPanel({ idProject: projectId });

  const timelineAssetIds = useMemo(() => {
    const set = new Set();
    const tracks = project?.dataProject?.timeline?.tracks || [];
    for (const track of tracks) {
      for (const clip of track?.clips || []) {
        if (clip?.assetId) set.add(String(clip.assetId));
      }
    }
    return set;
  }, [project?.dataProject?.timeline, project?.dataProject?.timeline?.rev]);

  const value = useMemo(
    () => ({
      media,
      timelineAssetIds,
    }),
    [media, timelineAssetIds]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMedia() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMedia must be used inside <MediaProvider>");
  return v;
}

export function useMediaMaybe() {
  return useContext(Ctx);
}
