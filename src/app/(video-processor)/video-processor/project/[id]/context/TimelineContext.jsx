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

export function TimelineProvider({
  children,
  fps = 30,
  initialPxPerSec = 100,
  initialTime = 0,
  lengthSec = 60,
  shortestClipSec = Infinity,
  minClipPx = 24,
  absMinPxPerSec = 0.2,
  minPxPerSecBase = 0.2,
  maxPxPerSecBase = 1200,
  maxPxPerFrame = 24,
  viewportMaxSecondsPerScreen = 1.5,
}) {
  const [pxPerSecState, _setPxPerSecState] = useState(initialPxPerSec);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(lengthSec);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => setDuration(lengthSec), [lengthSec]);

  const minPxPerSec = useMemo(() => {
    const byClip =
      Number.isFinite(shortestClipSec) && shortestClipSec > 0
        ? minClipPx / Math.max(0.001, shortestClipSec)
        : absMinPxPerSec;
    return Math.max(absMinPxPerSec, minPxPerSecBase, byClip);
  }, [shortestClipSec, minClipPx, absMinPxPerSec, minPxPerSecBase]);

  const maxPxPerSec = useMemo(() => {
    const byFps = Math.max(1, fps) * maxPxPerFrame;
    const byViewport =
      viewportWidth > 0
        ? viewportWidth / Math.max(0.1, viewportMaxSecondsPerScreen)
        : maxPxPerSecBase;
    return Math.min(maxPxPerSecBase, byFps, byViewport);
  }, [
    fps,
    maxPxPerFrame,
    viewportWidth,
    viewportMaxSecondsPerScreen,
    maxPxPerSecBase,
  ]);

  const clampZoom = useCallback(
    (v) => Math.max(minPxPerSec, Math.min(maxPxPerSec, Number(v))),
    [minPxPerSec, maxPxPerSec]
  );

  const setPxPerSec = useCallback(
    (next) => {
      _setPxPerSecState((prev) => {
        const raw = typeof next === "function" ? next(prev) : next;
        return clampZoom(raw);
      });
    },
    [clampZoom]
  );

  useEffect(() => {
    _setPxPerSecState((prev) => clampZoom(prev));
  }, [clampZoom]);

  const zoomBy = useCallback(
    (factor) => setPxPerSec((v) => v * factor),
    [setPxPerSec]
  );

  const toPx = useCallback(
    (sec) => Math.max(0, Number(sec) || 0) * pxPerSecState,
    [pxPerSecState]
  );

  const toSec = useCallback(
    (px) => Math.max(0, Number(px) || 0) / pxPerSecState,
    [pxPerSecState]
  );

  const value = useMemo(
    () => ({
      fps,
      pxPerSec: pxPerSecState,
      minPxPerSec,
      maxPxPerSec,
      isAtMin: pxPerSecState <= minPxPerSec + 1e-6,
      isAtMax: pxPerSecState >= maxPxPerSec - 1e-6,
      currentTime,
      duration,
      playing,
      setPxPerSec,
      zoomBy,
      setCurrentTime,
      setDuration,
      setPlaying,
      toPx,
      toSec,
      viewportWidth,
      setViewportWidth,
    }),
    [
      fps,
      pxPerSecState,
      minPxPerSec,
      maxPxPerSec,
      currentTime,
      duration,
      playing,
      setPxPerSec,
      zoomBy,
      toPx,
      toSec,
      viewportWidth,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTimeline() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTimeline must be used inside <TimelineProvider>");
  return v;
}

export function useTimelineMaybe() {
  return useContext(Ctx);
}
