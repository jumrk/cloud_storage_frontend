"use client";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

const Ctx = createContext(null);

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function StageProvider({ children }) {
  const [stageVideoClips, setStageVideoClips] = useState([]);
  const [stageImageClips, setStageImageClips] = useState([]);
  const [stageAudioClips, setStageAudioClips] = useState([]);
  const [stageTextLayers, setStageTextLayers] = useState([]);
  const [timelineH, setTimelineH] = useState(280);
  const [overlay, setOverlay] = useState(false);

  const textLayersStructureRef = useRef("");
  const textLayersRef = useRef([]);

  const handleStageVisualsChange = useCallback(
    ({
      videoClips = [],
      imageClips = [],
      audioClips = [],
      textLayers = [],
    }) => {
      // CRITICAL: Always update video/image/audio clips first to ensure they're not lost
      // This is especially important when textLayers change (e.g., when subtitle style changes)
      setStageVideoClips(videoClips);
      setStageImageClips(imageClips);
      setStageAudioClips(audioClips);

      // Always update ref with latest textLayers (for render loop)
      textLayersRef.current = textLayers;

      const newStructure =
        textLayers?.map((t) => `${t.id}:${t.start}:${t.duration}`).join("|") ||
        "";
      const currentStructure = textLayersStructureRef.current;

      // Update state if structure changed OR if video/image/audio clips are provided
      // This ensures video is not lost when textLayers change (e.g., style change from none to something)
      if (
        newStructure !== currentStructure ||
        videoClips.length > 0 ||
        imageClips.length > 0 ||
        audioClips.length > 0
      ) {
        textLayersStructureRef.current = newStructure;
        setStageTextLayers(textLayers);
      }
    },
    []
  );

  const onStartResizeTimeline = useCallback(
    (e) => {
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
    },
    [timelineH]
  );

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
      ["--lib-w"]: "clamp(280px, 24vw, 396px)",
      ["--timeline-h"]: `${timelineH}px`,
      ["--main-h"]: overlay ? "100svh" : "calc(100svh - var(--timeline-h))",
    }),
    [timelineH, overlay]
  );

  const getTextLayers = useCallback(() => {
    return textLayersRef.current;
  }, []);

  const value = useMemo(
    () => ({
      stageVideoClips,
      stageImageClips,
      stageAudioClips,
      stageTextLayers,
      getTextLayers,
      timelineH,
      overlay,
      styleVars,
      handleStageVisualsChange,
      setTimelineH,
      setOverlay,
      onStartResizeTimeline,
    }),
    [
      stageVideoClips,
      stageImageClips,
      stageAudioClips,
      stageTextLayers,
      getTextLayers,
      timelineH,
      overlay,
      styleVars,
      handleStageVisualsChange,
      onStartResizeTimeline,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStage() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStage must be used inside <StageProvider>");
  return v;
}

export function useStageMaybe() {
  return useContext(Ctx);
}
