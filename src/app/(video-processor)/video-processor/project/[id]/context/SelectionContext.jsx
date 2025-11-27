"use client";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";

const Ctx = createContext(null);

export function SelectionProvider({ children }) {
  const [selectedClip, setSelectedClip] = useState(null);
  const [volume, setVolume] = useState(100);
  const [audioVolume, setAudioVolume] = useState(100);
  const [audioSpeed, setAudioSpeed] = useState(100);
  const [audioStability, setAudioStability] = useState(50);

  const selectedVideoClip = useMemo(() => {
    if (!selectedClip || selectedClip.lane !== "video") return null;
    const c = selectedClip.clip;
    if (!c || c.type === "image") return null;
    return c;
  }, [selectedClip]);

  const selectedAudioClip = useMemo(() => {
    if (!selectedClip || selectedClip.lane !== "audio") return null;
    const c = selectedClip.clip;
    if (!c || c.type !== "audio") return null;
    return c;
  }, [selectedClip]);

  useEffect(() => {
    if (!selectedVideoClip) return;
    const pct = Math.max(
      0,
      Math.min(100, Math.round(Number(selectedVideoClip.volume ?? 1) * 100))
    );
    setVolume(pct);
  }, [selectedVideoClip?.id, selectedVideoClip?.volume]);

  useEffect(() => {
    if (!selectedAudioClip) return;
    const pct = Math.max(
      0,
      Math.min(100, Math.round(Number(selectedAudioClip.volume ?? 1) * 100))
    );
    setAudioVolume(pct);
    
    const speedValue =
      selectedAudioClip.voiceSpeed ??
      selectedAudioClip.speed ??
      1;
    const speedPct = Math.max(50, Math.min(200, Math.round(speedValue * 100)));
    setAudioSpeed(speedPct);
    
    const stabilityValue =
      selectedAudioClip.voiceStability ?? 0.5;
    const stabilityPct = Math.max(0, Math.min(100, Math.round(stabilityValue * 100)));
    setAudioStability(stabilityPct);
  }, [selectedAudioClip?.id, selectedAudioClip?.volume, selectedAudioClip?.speed, selectedAudioClip?.voiceStability]);

  const handleVolumeChange = useCallback((v) => {
    setVolume(v);
    if (selectedVideoClip?.id) {
      window.dispatchEvent(
        new CustomEvent("timeline.patchClip", {
          detail: {
            lane: "video",
            id: selectedVideoClip.id,
            patch: { volume: v / 100 },
          },
        })
      );
    }
  }, [selectedVideoClip?.id]);

  const handleAudioVolumeChange = useCallback((v) => {
    setAudioVolume(v);
    if (selectedAudioClip?.id) {
      window.dispatchEvent(
        new CustomEvent("timeline.patchClip", {
          detail: {
            lane: "audio",
            id: selectedAudioClip.id,
            patch: { volume: v / 100 },
          },
        })
      );
    }
  }, [selectedAudioClip?.id]);

  const handleAudioSpeedChange = useCallback((v) => {
    setAudioSpeed(v);
    if (selectedAudioClip?.id) {
      const newSpeed = Math.max(0.01, v / 100);
      const previousSpeed = selectedAudioClip.speed ?? 1;
      const currentDuration = Number(selectedAudioClip.duration ?? 0);
      const baseDuration =
        currentDuration && previousSpeed
          ? currentDuration * previousSpeed
          : currentDuration;
      const newDuration =
        baseDuration && newSpeed ? baseDuration / newSpeed : currentDuration;

      window.dispatchEvent(
        new CustomEvent("timeline.patchClip", {
          detail: {
            lane: "audio",
            id: selectedAudioClip.id,
            patch: {
              speed: newSpeed,
              duration: newDuration,
            },
          },
        })
      );

      if (selectedAudioClip.subtitleClipId) {
        window.dispatchEvent(
          new CustomEvent("timeline.patchClip", {
            detail: {
              lane: "text",
              id: selectedAudioClip.subtitleClipId,
              patch: { voiceSpeed: newSpeed },
            },
          })
        );
      }
    }
  }, [selectedAudioClip]);

  const handleAudioStabilityChange = useCallback((v) => {
    setAudioStability(v);
    if (selectedAudioClip?.id) {
      window.dispatchEvent(
        new CustomEvent("timeline.patchClip", {
          detail: {
            lane: "audio",
            id: selectedAudioClip.id,
            patch: { voiceStability: v / 100 },
          },
        })
      );
    }

    if (selectedAudioClip?.subtitleClipId) {
      window.dispatchEvent(
        new CustomEvent("timeline.patchClip", {
          detail: {
            lane: "text",
            id: selectedAudioClip.subtitleClipId,
            patch: { voiceStability: v / 100 },
          },
        })
      );
    }
  }, [selectedAudioClip?.id, selectedAudioClip?.subtitleClipId]);

  const value = useMemo(
    () => ({
      selectedClip,
      selectedVideoClip,
      selectedAudioClip,
      volume,
      audioVolume,
      audioSpeed,
      audioStability,
      setSelectedClip,
      setVolume,
      handleVolumeChange,
      handleAudioVolumeChange,
      handleAudioSpeedChange,
      handleAudioStabilityChange,
    }),
    [
      selectedClip,
      selectedVideoClip,
      selectedAudioClip,
      volume,
      audioVolume,
      audioSpeed,
      audioStability,
      handleVolumeChange,
      handleAudioVolumeChange,
      handleAudioSpeedChange,
      handleAudioStabilityChange,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSelection() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSelection must be used inside <SelectionProvider>");
  return v;
}

export function useSelectionMaybe() {
  return useContext(Ctx);
}


