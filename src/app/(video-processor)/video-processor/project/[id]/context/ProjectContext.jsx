"use client";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import axiosClient from "@/shared/lib/axiosClient";
import toast from "react-hot-toast";

const Ctx = createContext(null);

export function ProjectProvider({ children, projectId }) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

  const [dataProject, setDataProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadTimelineSignal, setReloadTimelineSignal] = useState(0);

  const handleDataProjectChange = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await axiosClient.get(
        `/api/video-processor/project/${projectId}`
      );
      setDataProject(res.data);

      // Always dispatch timeline.updateClips event to sync Timeline component
      if (res.data?.timeline?.tracks) {
        setTimeout(() => {
          const event = new CustomEvent("timeline.updateClips", {
            detail: {
              lane: "all",
              timeline: res.data.timeline,
            },
          });
          window.dispatchEvent(event);
        }, 100);
      }
    } catch (err) {
      console.error("ProjectContext - Error fetching project:", err);
      toast.error("Không thể tải dữ liệu dự án.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const reloadProjectTimeline = useCallback(() => {
    console.log("ProjectContext - reloadProjectTimeline called");
    handleDataProjectChange?.();
    setReloadTimelineSignal((s) => s + 1);
  }, [handleDataProjectChange]);

  const updateDataProject = useCallback((updater) => {
    console.log("updateDataProject");
    setDataProject((prev) => {
      if (!prev) return prev;
      if (typeof updater === "function") {
        return updater(prev);
      }
      return { ...prev, ...updater };
    });
  }, []);

  const updateTimelineFromData = useCallback(
    (timelineData) => {
      if (!timelineData) return;
      updateDataProject((prev) => {
        if (!prev) return prev;
        const prevTracks = prev.timeline?.tracks || [];
        const newTracks = timelineData.tracks || [];

        const mergedTracks = newTracks.map((newTrack) => {
          if (newTrack.kind === "subtitle" && newTrack.clips) {
            const prevTrack = prevTracks.find((t) => t.kind === "subtitle");
            if (prevTrack?.clips) {
              const mergedClips = newTrack.clips.map((newClip) => {
                const prevClip = prevTrack.clips.find(
                  (c) => c.id === newClip.id
                );
                if (prevClip?.wordTiming && !newClip.wordTiming) {
                  return { ...newClip, wordTiming: prevClip.wordTiming };
                }
                return newClip;
              });
              return { ...newTrack, clips: mergedClips };
            }
          }
          return newTrack;
        });

        return {
          ...prev,
          timeline: {
            ...prev.timeline,
            ...timelineData,
            tracks:
              mergedTracks.length > 0
                ? mergedTracks
                : timelineData.tracks || prev.timeline?.tracks,
          },
        };
      });
      window.dispatchEvent(
        new CustomEvent("timeline.updateClips", {
          detail: {
            lane: "all",
            timeline: timelineData,
          },
        })
      );
    },
    [updateDataProject]
  );

  useEffect(() => {
    if (projectId) {
      handleDataProjectChange();
    }
  }, [projectId, handleDataProjectChange]);

  const getVideoSrc = useCallback(
    (assetId) => `${API_BASE}/api/video-processor/assets/${assetId}/stream`,
    [API_BASE]
  );

  const getImageThumb = useCallback(
    (assetId) =>
      `${API_BASE}/api/video-processor/assets/${assetId}/thumb?h=1080`,
    [API_BASE]
  );

  const getAudioSrc = useCallback(
    (assetId) => `${API_BASE}/api/video-processor/assets/${assetId}/stream`,
    [API_BASE]
  );

  const fps = dataProject?.fps ?? 30;
  const lengthSec = dataProject?.durationSec ?? 60;

  const value = useMemo(
    () => ({
      projectId,
      dataProject,
      loading,
      reloadTimelineSignal,
      reloadProjectTimeline,
      updateTimelineFromData,
      handleDataProjectChange,
      updateDataProject,
      getVideoSrc,
      getImageThumb,
      getAudioSrc,
      fps,
      lengthSec,
    }),
    [
      projectId,
      dataProject,
      loading,
      reloadTimelineSignal,
      reloadProjectTimeline,
      updateTimelineFromData,
      handleDataProjectChange,
      updateDataProject,
      getVideoSrc,
      getImageThumb,
      getAudioSrc,
      fps,
      lengthSec,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProject() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProject must be used inside <ProjectProvider>");
  return v;
}

export function useProjectMaybe() {
  return useContext(Ctx);
}
