import axiosClient from "@/shared/lib/axiosClient";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import useMediaPanel from "./media/useMediaPanel";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export default function useAppShell(id) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

  const [activeNav, setActiveNav] = useState("media");
  const [libWidth, setLibWidth] = useState("clamp(280px, 24vw, 396px)");
  const [dataProject, setDataProject] = useState(null);
  const [loading, setLoading] = useState(false);

  const libRef = useRef(null);

  const [timelineH, setTimelineH] = useState(280);
  const [overlay, setOverlay] = useState(false);

  const [stageVideoClips, setStageVideoClips] = useState([]);
  const [stageImageClips, setStageImageClips] = useState([]);
  const [stageAudioClips, setStageAudioClips] = useState([]);
  const [reloadTimelineSignal, setReloadTimelineSignal] = useState(0);
  const [stageTextLayers, setStageTextLayers] = useState([]);

  const [selectedClip, setSelectedClip] = useState(null);
  const [volume, setVolume] = useState(100);

  const media = useMediaPanel({ idProject: id });

  const timelineAssetIds = useMemo(() => {
    const set = new Set();
    const tracks = dataProject?.timeline?.tracks || [];
    for (const track of tracks) {
      for (const clip of track?.clips || []) {
        if (clip?.assetId) set.add(String(clip.assetId));
      }
    }
    return set;
  }, [dataProject?.timeline, dataProject?.timeline?.rev]);

  const handleDataProjectChange = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/api/video-processor/project/${id}`);
      setDataProject(res.data);
    } catch {
      toast.error("Không thể tải dữ liệu dự án.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const reloadProjectTimeline = useCallback(() => {
    handleDataProjectChange?.();
    setReloadTimelineSignal((s) => s + 1);
  }, [handleDataProjectChange]);

  const selectedVideoClip = useMemo(() => {
    if (!selectedClip || selectedClip.lane !== "video") return null;
    const c = selectedClip.clip;
    if (!c || c.type === "image") return null;
    return c;
  }, [selectedClip]);

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

  const handleStageVisualsChange = useCallback(
    ({
      videoClips = [],
      imageClips = [],
      audioClips = [],
      textLayers = [],
    }) => {
      setStageVideoClips(videoClips);
      setStageImageClips(imageClips);
      setStageAudioClips(audioClips);
      setStageTextLayers(textLayers);
    },
    []
  );

  const onStartResizeLib = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const rect = libRef.current?.getBoundingClientRect();
    const startW = rect?.width ?? 320;
    const minW = 240;
    const maxW = Math.min(560, Math.round((window.innerWidth || 1200) * 0.42));
    const move = (ev) => {
      const dx = ev.clientX - startX;
      const w = clamp(Math.round(startW + dx), minW, maxW);
      setLibWidth(`${w}px`);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  const onStartResizeTimeline = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = timelineH;
    const minH = 160;
    const maxH = 820;
    const move = (ev) => {
      const dy = ev.clientY - startY;
      const h = clamp(Math.round(startH - dy), minH, maxH);
      setTimelineH(h);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  useEffect(() => {
    let r = 0;
    const decide = () => {
      cancelAnimationFrame(r);
      r = requestAnimationFrame(() => {
        const vh = window.innerHeight || 800;
        setOverlay(timelineH > vh * 0.55);
      });
    };
    decide();
    window.addEventListener("resize", decide, { passive: true });
    return () => {
      cancelAnimationFrame(r);
      window.removeEventListener("resize", decide);
    };
  }, [timelineH]);

  const styleVars = useMemo(
    () => ({
      ["--rail-w"]: "clamp(64px, 6vw, 84px)",
      ["--lib-w"]: libWidth,
      ["--timeline-h"]: `${timelineH}px`,
      ["--main-h"]: overlay ? "100svh" : "calc(100svh - var(--timeline-h))",
    }),
    [libWidth, timelineH, overlay]
  );

  const fps = dataProject?.fps ?? 30;
  const lengthSec = dataProject?.durationSec ?? 60;

  return {
    activeNav,
    dataProject,
    media,
    libRef,
    timelineH,
    overlay,
    stageVideoClips,
    stageImageClips,
    stageAudioClips,
    stageTextLayers,
    timelineAssetIds,
    volume,
    selectedVideoClip,
    styleVars,
    fps,
    lengthSec,
    loading,
    reloadTimelineSignal,
    reloadProjectTimeline,
    setTimelineH,
    setOverlay,
    setSelectedClip,
    setVolume,
    setActiveNav,
    getVideoSrc,
    getImageThumb,
    getAudioSrc,
    setLibWidth,
    handleDataProjectChange,
    handleStageVisualsChange,
    onStartResizeLib,
    onStartResizeTimeline,
  };
}
