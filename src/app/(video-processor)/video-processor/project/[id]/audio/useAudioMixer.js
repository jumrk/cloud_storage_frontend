"use client";
import { useEffect, useRef, useCallback } from "react";
import { mapTimelineToMedia } from "../core/timing";

export default function useAudioMixer({
  ctxRef,
  audioClips = [],
  getAudioSrc,
  fps = 30,
  playing = false,
  now,
}) {
  const pool = useRef(new Map());
  const hostRef = useRef(null);
  const unlockedRef = useRef(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
  const getSrcDefault = useCallback(
    (id) => `${API_BASE}/api/video-processor/assets/${id}/stream`,
    [API_BASE]
  );

  const normalizeClip = (c) => ({
    id:
      c?.id ??
      c?.assetId ??
      c?.url ??
      `clip_${Math.random().toString(36).slice(2)}`,
    assetId: c?.assetId ?? c?.id ?? null,
    url: c?.url ?? null,
    start: Number.isFinite(c?.start)
      ? c.start
      : Number.isFinite(c?.startSec)
      ? c.startSec
      : 0,
    duration: Number.isFinite(c?.duration)
      ? c.duration
      : Number.isFinite(c?.durationSec)
      ? c.durationSec
      : Number.isFinite(c?.endSec) && Number.isFinite(c?.startSec)
      ? Math.max(0, c.endSec - c.startSec)
      : 0,
    speed: c?.speed && c.speed > 0 ? c.speed : 1,
    reverse: !!c?.reverse,
    srcIn: Number.isFinite(c?.srcInSec)
        ? c.srcInSec
      : c?.srcIn ??
        c?.trimIn ??
        c?.in ??
        c?.trimStartSec ??
        c?.inSec ??
        c?.offsetSec ??
        0,
    volume: Number.isFinite(c?.volume) ? c.volume : 1,
    fadeIn: Math.max(0, c?.fadeIn ?? 0),
    fadeOut: Math.max(0, c?.fadeOut ?? 0),
  });

  useEffect(() => {
    const host = document.createElement("div");
    host.style.cssText =
      "position:absolute;left:-9999px;top:-9999px;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;";
    document.body.appendChild(host);
    hostRef.current = host;
    return () => host.remove();
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const prewarm = async (el) => {
      try {
        const m = el.muted,
          v = el.volume;
        el.muted = true;
        el.volume = 0;
        await el.play().catch(() => {});
        el.pause();
        el.muted = m;
        el.volume = v;
      } catch {}
    };

    const unlockAll = async () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      try {
        await ctx.resume();
      } catch {}
      for (const [, ch] of pool.current) await prewarm(ch.el);
    };

    window.addEventListener("pointerdown", unlockAll, {
      capture: true,
      once: true,
    });
    window.addEventListener("keydown", unlockAll, {
      capture: true,
      once: true,
    });
    return () => {
      window.removeEventListener("pointerdown", unlockAll, { capture: true });
      window.removeEventListener("keydown", unlockAll, { capture: true });
    };
  }, [ctxRef]);

  const ensure = useCallback(
    (id) => {
    const ctx = ctxRef.current;
    if (!ctx) return null;

    let ch = pool.current.get(id);
    if (!ch) {
      const el = document.createElement("audio");
      el.crossOrigin = "anonymous";
      el.preload = "auto";
      el.playsInline = true;
      el.loop = false;
      el.muted = false;
      el.controls = false;
      el.volume = 1;
      el.defaultPlaybackRate = 1;
      el.playbackRate = 1;
      hostRef.current?.appendChild(el);

      try {
        const node = ctx.createMediaElementSource(el);
        const gain = ctx.createGain();
        gain.gain.value = 1;
        node.connect(gain).connect(ctx.destination);
        ch = { el, node, gain };
      } catch {
        ch = { el, node: null, gain: null };
      }
      pool.current.set(id, ch);

      if (unlockedRef.current) {
        try {
          const m = el.muted,
            v = el.volume;
          el.muted = true;
          el.volume = 0;
          el.play().catch(() => {});
          el.pause();
          el.muted = m;
          el.volume = v;
        } catch {}
      }
    }
    return ch;
    },
    [ctxRef, hostRef, unlockedRef, pool]
  );

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const clips = (audioClips || []).map(normalizeClip);

    const lastSpeedRef = new Map();

    let raf = 0;
    const SEEK_EPS = 0.15;
    const lastSeekTimeRef = new Map();

    const tick = () => {
      const T = typeof now === "function" ? now() : 0;
      const actives = new Set();

      if (playing && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      for (const clip of clips) {
        const s = clip.start,
          d = clip.duration;
        if (!(T >= s && T < s + d)) continue;
        actives.add(clip.id);

        const ch = ensure(clip.id);
        if (!ch) continue;

        const src = clip.url || (getAudioSrc || getSrcDefault)(clip.assetId);
        if (src && ch.el.src !== src) {
          ch.el.src = src;
          ch.el.load();
          lastSeekTimeRef.set(clip.id, 0);
          lastSpeedRef.delete(clip.id);
        }

        if (ch.el.readyState < 2) {
          if (src && !ch.el.src) {
            ch.el.src = src;
          }
          continue;
        }

        const local = Math.max(0, T - s);
        const basePlaybackRate =
          clip.speed && clip.speed > 0 ? clip.speed : 1;

        const lastSpeed = lastSpeedRef.get(clip.id);
        if (
          lastSpeed === undefined ||
          Math.abs(lastSpeed - basePlaybackRate) > 0.001
        ) {
          ch.el.defaultPlaybackRate = basePlaybackRate;
          ch.el.playbackRate = basePlaybackRate;
          lastSpeedRef.set(clip.id, basePlaybackRate);
        }

        const mt = clip.srcIn + local * basePlaybackRate;
        const ct = ch.el.currentTime || 0;
        const drift = mt - ct;
        const lastSeek = lastSeekTimeRef.get(clip.id) || 0;
        const timeSinceLastSeek = T - lastSeek;

        if (Math.abs((ch.el.playbackRate || 1) - basePlaybackRate) > 0.01) {
          ch.el.playbackRate = basePlaybackRate;
        }

        if (Math.abs(drift) > SEEK_EPS && timeSinceLastSeek > 0.1) {
          try {
            ch.el.currentTime = Math.max(0, mt);
            lastSeekTimeRef.set(clip.id, T);
          } catch {}
          ch.el.playbackRate = basePlaybackRate;
        } else if (Math.abs(drift) <= SEEK_EPS) {
          const driftCorrection = Math.max(
            0.99,
            Math.min(1.01, 1 + -0.1 * drift)
          );
          const correctedRate = basePlaybackRate * driftCorrection;
          if (
            Math.abs(correctedRate - basePlaybackRate) <=
            basePlaybackRate * 0.01
          ) {
            if (Math.abs((ch.el.playbackRate || 1) - correctedRate) > 0.005) {
              ch.el.playbackRate = correctedRate;
          }
          } else {
            ch.el.playbackRate = basePlaybackRate;
          }
        }
        const tail = Math.max(0, d - local);
        let g = Math.max(0, Math.min(1, clip.volume));
        if (clip.fadeIn > 0 && local < clip.fadeIn) g *= local / clip.fadeIn;
        if (clip.fadeOut > 0 && tail < clip.fadeOut) g *= tail / clip.fadeOut;
        if (ch.gain) ch.gain.gain.value = g;
        else ch.el.volume = g;

        if (playing) {
          if (ch.el.paused && ch.el.readyState >= 2) {
            ch.el.play().catch(() => {});
          }
        } else {
          ch.el.pause();
        }
      }

      for (const [id, ch] of pool.current) {
        if (!actives.has(id)) {
          ch.el.pause();
          if (ch.gain) ch.gain.gain.value = 0;
          else ch.el.volume = 0;
          lastSeekTimeRef.delete(id);
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      lastSeekTimeRef.clear();
    };
  }, [
    audioClips,
    getAudioSrc,
    fps,
    playing,
    now,
    ctxRef,
    ensure,
    getSrcDefault,
  ]);
}
