"use client";
import { useCallback, useEffect, useRef } from "react";

export default function useMasterClock(initial = 0) {
  const ctxRef = useRef(null);
  const baseRef = useRef(initial);
  const t0Ref = useRef(0);
  const playingRef = useRef(false);

  useEffect(() => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    ctxRef.current = new Ctx();
    return () => ctxRef.current?.close?.();
  }, []);

  const now = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return baseRef.current;
    if (!playingRef.current) return baseRef.current;
    return baseRef.current + (ctx.currentTime - t0Ref.current);
  }, []);

  const play = useCallback(async (at) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    await ctx.resume?.();
    playingRef.current = true;
    baseRef.current = at;
    t0Ref.current = ctx.currentTime;
  }, []);

  const pause = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    baseRef.current = now();
    playingRef.current = false;
  }, [now]);

  const seek = useCallback((to) => {
    baseRef.current = to;
  }, []);

  return { now, play, pause, seek, ctxRef };
}
