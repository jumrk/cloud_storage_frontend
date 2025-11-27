"use client";

import { ChevronDown, Upload } from "lucide-react";
import Popover from "@/shared/ui/Popover";
import AspectItem from "./AspectItem";
import usePreviewState from "../../hooks/media/usePreviewState";
import React, {
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useState,
} from "react";
import { useTimelineMaybe } from "../../context/TimelineContext";
import { useProject, useStage, useSelection } from "../../context";
import { useVoiceLoadingMaybe } from "../../context/VoiceLoadingContext";
import useMasterClock from "../../core/useMasterClock";
import { toFrameTime } from "../../core/timing";
import CanvasCompositor from "../../render/CanvasCompositor";
import { VideoDeck } from "../../core/VideoDeck";
import useAudioMixer from "../../audio/useAudioMixer";
import usePreviewStage from "../../hooks/stage/usePreviewStage";
import useVideoRendering from "../../hooks/stage/useVideoRendering";
import { pickActiveVisual } from "../../utils/previewUtils";
import { clamp01 } from "../../utils/previewUtils";
import HardsubOverlay from "./HardsubOverlay";
import ExportMenu from "./ExportMenu";
import { useTranslations } from "next-intl";

export default function PreviewStage() {
  const t = useTranslations();
  const project = useProject();
  const stage = useStage();
  const selection = useSelection();
  const voiceLoading = useVoiceLoadingMaybe();

  const { dataProject, getVideoSrc, getImageThumb, getAudioSrc, fps } = project;
  const {
    stageVideoClips,
    stageImageClips,
    stageAudioClips,
    stageTextLayers,
    getTextLayers,
  } = stage;
  const { volume } = selection;

  const videoClips = stageVideoClips;
  const imageClips = stageImageClips;
  const audioClips = stageAudioClips;
  const textLayers = stageTextLayers;
  const mediaVolume = volume / 100;

  const validTextLayers = useMemo(() => {
    const latestTextLayers = getTextLayers ? getTextLayers() : textLayers;
    if (!latestTextLayers || latestTextLayers.length === 0) return [];
    return latestTextLayers.filter((layer) => {
      const styleScale = Number(layer?.styleScale) ?? 1;
      return styleScale > 0 && styleScale >= 0.1;
    });
  }, [textLayers, getTextLayers]);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
  const getVideoSrcDefault = (id) =>
    `${API_BASE}/api/video-processor/assets/${id}/stream`;
  const getImageThumbDefault = (id) =>
    `${API_BASE}/api/video-processor/assets/${id}/thumb?h=1080`;
  const getAudioSrcDefault = (id) =>
    `${API_BASE}/api/video-processor/assets/${id}/stream`;

  const tl = useTimelineMaybe();

  const {
    ASPECTS,
    open,
    aspect,
    aspectRatio,
    frameRef,
    vpRef,
    setOpen,
    pickAspect,
    setStageHot,
  } = usePreviewState({
    initialAspectKey: dataProject?.aspect || "16:9",
    projectId: dataProject?._id || dataProject?.id,
  });

  const playing = tl?.playing || false;
  const nowFromCtx = tl?.currentTime ?? 0;

  const activeForLabel = useMemo(
    () => pickActiveVisual(videoClips, imageClips, nowFromCtx || 0),
    [videoClips, imageClips, nowFromCtx]
  );

  const canvasRef = useRef(null);
  const compRef = useRef(null);
  const deckRef = useRef(null);
  const hiddenHolderRef = useRef(null);
  const imgRef = useRef(null);
  const currentUrlRef = useRef("");
  const nowFromCtxRef = useRef(nowFromCtx);
  const playingRef = useRef(playing);
  const textCacheRef = useRef({
    front: null,
    back: null,
    lastHash: null,
    rafId: null,
    lastValidTextLayersRef: null,
    lastT: null,
    lastActiveLayers: null,
    lastActiveLayerIds: null,
  });

  const [frameSize, setFrameSize] = useState({ w: 0, h: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const loadingTimeoutRef = useRef(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportButtonRef = useRef(null);

  const clock = useMasterClock(Number(nowFromCtx) || 0);

  const getCurrentTime = useCallback(() => {
    if (playing) return nowFromCtxRef.current || 0;
    return clock.now();
  }, [clock, playing]);

  // Filter out audio clips that are loading (disable playback for them)
  const filteredAudioClips = useMemo(() => {
    if (
      !voiceLoading ||
      !voiceLoading.loadingClips ||
      voiceLoading.loadingClips.size === 0
    ) {
      return audioClips;
    }

    // If any clip is loading, disable all voice-generated audio clips
    // We can identify voice-generated clips by checking if they're linked to text clips
    // For now, we'll disable all audio when any text clip is loading
    const hasLoadingClips = voiceLoading.loadingClips.size > 0;
    if (hasLoadingClips) {
      // Filter out audio clips that might be voice-generated
      // We'll keep all audio clips but they'll be muted/disabled in useAudioMixer
      // Actually, let's just return empty array to disable all audio playback
      return [];
    }

    return audioClips;
  }, [audioClips, voiceLoading]);

  useAudioMixer({
    ctxRef: clock.ctxRef,
    audioClips: filteredAudioClips,
    getAudioSrc: getAudioSrc || getAudioSrcDefault,
    fps,
    playing,
    now: getCurrentTime,
    mediaVolume: clamp01(mediaVolume ?? 1),
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const comp = new CanvasCompositor(canvas);
    comp.resize(
      Math.max(2, canvas.clientWidth || 1280),
      Math.max(2, canvas.clientHeight || 720)
    );
    compRef.current = comp;

    const makeTextCanvas = (w, h) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d", {
        alpha: true,
        willReadFrequently: false,
      });
      return { canvas: c, ctx };
    };

    const front = makeTextCanvas(canvas.width, canvas.height);
    const back = makeTextCanvas(canvas.width, canvas.height);
    textCacheRef.current = {
      front,
      back,
      lastHash: null,
      pendingHash: null,
      rafId: null,
    };

    const ro = new ResizeObserver(() => {
      const w = Math.max(2, canvas.clientWidth || 1280);
      const h = Math.max(2, canvas.clientHeight || 720);
      comp.resize(w, h);
      if (textCacheRef.current.front) {
        textCacheRef.current.front.canvas.width = w;
        textCacheRef.current.front.canvas.height = h;
      }
      if (textCacheRef.current.back) {
        textCacheRef.current.back.canvas.width = w;
        textCacheRef.current.back.canvas.height = h;
      }
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const unlockedRef = useRef(false);
  useEffect(() => {
    const ctx = clock.ctxRef.current;

    const prewarmVideo = async (el) => {
      if (!el) return;
      try {
        const prevMuted = el.muted;
        el.muted = true;
        await el.play().catch(() => {});
        el.pause();
        el.muted = prevMuted;
      } catch {}
    };

    const unlock = async () => {
      if (unlockedRef.current) return;
      try {
        await ctx?.resume?.();
      } catch {}
      try {
        await prewarmVideo(deckRef.current?.active);
        await prewarmVideo(deckRef.current?.standby);
      } catch {}
      unlockedRef.current = true;
    };

    window.addEventListener("pointerdown", unlock, {
      once: true,
      capture: true,
    });
    window.addEventListener("keydown", unlock, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true });
      window.removeEventListener("keydown", unlock, { capture: true });
    };
  }, [clock]);

  useEffect(() => {
    const a = document.createElement("video");
    const b = document.createElement("video");

    const ensure = (el) => {
      el.playsInline = true;
      el.setAttribute?.("playsinline", "");
      el.preload = "auto";
      el.crossOrigin = "anonymous";
      el.muted = false;
      el.volume = 1;
      el.disablePictureInPicture = true;
      el.controls = false;
      el.preservesPitch = true;
      el.webkitPreservesPitch = true;
      el.style.width = "0px";
      el.style.height = "0px";
      el.style.position = "absolute";
      el.style.opacity = "0";
      el.addEventListener("error", () => {});
    };

    ensure(a);
    ensure(b);
    hiddenHolderRef.current?.appendChild(a);
    hiddenHolderRef.current?.appendChild(b);
    const deck = new VideoDeck(a, b);
    deck.attach();
    deckRef.current = deck;

    return () => {
      try {
        a.pause();
        b.pause();
      } catch {}
      try {
        a.remove();
        b.remove();
      } catch {}
    };
  }, []);

  useEffect(() => {
    const d = deckRef.current;
    if (!d) return;
    const onErr = () => {
      currentUrlRef.current = "";
    };
    d.active.addEventListener?.("error", onErr);
    d.standby.addEventListener?.("error", onErr);
    return () => {
      d.active.removeEventListener?.("error", onErr);
      d.standby.removeEventListener?.("error", onErr);
    };
  }, []);

  const prevPlayingRef = useRef(playing);
  const initializedRef = useRef(false);
  useEffect(() => {
    const wasPlaying = prevPlayingRef.current;
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (playing) {
        clock.play(nowFromCtx || 0);
      } else {
        clock.pause();
        clock.seek(nowFromCtx || 0);
      }
    } else if (playing !== wasPlaying) {
      if (playing) {
        clock.play(nowFromCtx || 0);
      } else {
        clock.pause();
      }
    }
    prevPlayingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    nowFromCtxRef.current = nowFromCtx;
    playingRef.current = playing;
    if (!playing) clock.seek(nowFromCtx || 0);
  }, [nowFromCtx, playing]);

  useEffect(() => {
    const host = vpRef.current;
    if (!host) return;

    const pad = 48;
    const update = () => {
      const vw = host.clientWidth || 1280;
      const vh = host.clientHeight || 720;
      const maxW = Math.min(1040, vw - pad * 2);
      const maxH = Math.min(
        Math.max(360, Math.floor(vh - pad * 2)),
        Math.floor(vh * 0.8)
      );
      const ar = (aspect.w || 16) / (aspect.h || 9);
      let w = Math.min(maxW, Math.floor(maxH * ar));
      let h = Math.floor(w / ar);
      if (h > maxH) {
        h = maxH;
        w = Math.floor(h * ar);
      }
      setFrameSize({ w, h });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(host);
    return () => ro.disconnect();
  }, [aspect, vpRef]);

  const rVfcId = useRef(0);
  const dimsRef = useRef({ w: 0, h: 0 });

  const getT = useCallback(() => {
    const currentPlaying = playingRef.current;
    const currentTime = nowFromCtxRef.current || 0;
    return currentPlaying
      ? toFrameTime(currentTime, fps)
      : toFrameTime(clock.now(), fps);
  }, [fps, clock]);

  const { renderText } = usePreviewStage({
    validTextLayers,
    getTextLayers,
    fps,
    getT,
    compRef,
    textCacheRef,
  });

  const { renderFrame } = useVideoRendering({
    videoClips,
    imageClips,
    fps,
    getT,
    playing,
    compRef,
    deckRef,
    imgRef,
    getVideoSrc,
    getImageThumb,
    getVideoSrcDefault,
    getImageThumbDefault,
    mediaVolume,
    currentUrlRef,
    renderText,
    rVfcIdRef: rVfcId,
    dimsRef,
  });

  const prevClipsRef = useRef({ videoClips, imageClips });
  useEffect(() => {
    const prev = prevClipsRef.current;
    const hasSignificantChange =
      JSON.stringify(prev.videoClips) !== JSON.stringify(videoClips) ||
      JSON.stringify(prev.imageClips) !== JSON.stringify(imageClips);

    if (hasSignificantChange) {
      setIsLoading(true);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }

    prevClipsRef.current = { videoClips, imageClips };
  }, [videoClips, imageClips]);

  useEffect(() => {
    const deck = deckRef.current;
    const comp = compRef.current;
    const img = (imgRef.current = new Image());
    if (!deck || !comp) return;

    let stopped = false;

    const loop = () => {
      if (stopped) return;

      if (isLoading) {
        rVfcId.current = requestAnimationFrame(loop);
        return;
      }

      const currentPlaying = playingRef.current;
      const currentTime = nowFromCtxRef.current || 0;
      const T = currentPlaying
        ? toFrameTime(currentTime, fps)
        : toFrameTime(clock.now(), fps);

      const canvas = canvasRef.current;
      const textCache = textCacheRef.current;
      if (
        canvas &&
        (canvas.width !== frameSize.w || canvas.height !== frameSize.h)
      ) {
        canvas.style.width = `${frameSize.w}px`;
        canvas.style.height = `${frameSize.h}px`;
        comp.resize(frameSize.w, frameSize.h);
        if (textCache.front) {
          textCache.front.canvas.width = frameSize.w;
          textCache.front.canvas.height = frameSize.h;
        }
        if (textCache.back) {
          textCache.back.canvas.width = frameSize.w;
          textCache.back.canvas.height = frameSize.h;
        }
      }

      renderFrame();
    };

    rVfcId.current = requestAnimationFrame(loop);
    return () => {
      stopped = true;
      const id = rVfcId.current;
      if (id) cancelAnimationFrame(id);
    };
  }, [
    videoClips,
    imageClips,
    fps,
    getVideoSrc,
    getImageThumb,
    playing,
    frameSize,
    mediaVolume,
    renderFrame,
    renderText,
    isLoading,
  ]);

  const ease = "cubic-bezier(.2,.8,.2,1)";

  return (
    <section className="h-full w-full bg-white flex flex-col min-h-0">
      <div className="h-14 border-b border-border bg-white flex items-center z-10 justify-between px-4">
        <div className="relative">
          <div className="text-sm font-semibold text-text-strong">
            {dataProject ? dataProject.title : t("video_processor.inspector.stage.untitled_project")}
          </div>
          <div className="absolute -bottom-1.5 left-0 translate-y-full">
            <div className="relative" data-popover-root>
              <button
                onClick={() => setOpen((v) => !v)}
                className="h-8 rounded-lg px-2 inline-flex items-center gap-2 border border-border bg-white hover:bg-surface-50"
              >
                <div className="h-4 w-4 rounded border border-dashed border-brand-300 bg-surface-50" />
                <span className="text-xs text-text-strong">{t("video_processor.inspector.stage.aspect_ratio")}</span>
                <ChevronDown className="w-4 h-4 text-text-muted" />
              </button>
              <Popover open={open} className="left-0 z-[70]">
                <div className="w-72">
                  <div className="px-1 pb-2 text-[13px] font-semibold text-text-strong">
                    {t("video_processor.inspector.stage.aspect_ratio_title")}
                  </div>
                  <div className="max-h-72 overflow-auto scrollbar-hide pr-1">
                    {ASPECTS.map((opt) => (
                      <AspectItem
                        key={opt.key}
                        label={opt.label}
                        ratio={opt.ratioCss}
                        active={aspect.key === opt.key}
                        onClick={() => pickAspect(opt)}
                      />
                    ))}
                  </div>
                </div>
              </Popover>
            </div>
          </div>
        </div>

        <div className="relative" data-popover-root>
          <button
            ref={exportButtonRef}
            onClick={() => setIsExportMenuOpen((v) => !v)}
            className="h-9 rounded-xl px-3 inline-flex items-center gap-2 border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 transition"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">{t("video_processor.inspector.stage.export")}</span>
          </button>
          <ExportMenu
            projectId={dataProject?._id || dataProject?.id}
            isOpen={isExportMenuOpen}
            onClose={() => setIsExportMenuOpen(false)}
          />
        </div>
      </div>

      <div className="relative flex-1 min-h-0 bg-white">
        <div
          ref={vpRef}
          className="absolute inset-0 overflow-hidden z-0 grid place-items-center"
          onMouseEnter={() => setStageHot(true)}
          onMouseLeave={() => setStageHot(false)}
        >
          <div
            data-frame
            ref={frameRef}
            className="relative bg-black overflow-hidden rounded-xl shadow-[var(--shadow-card)]"
            style={{
              width: frameSize.w ? `${frameSize.w}px` : undefined,
              height: frameSize.h ? `${frameSize.h}px` : undefined,
              aspectRatio,
              transition: `width 260ms ${ease}, height 260ms ${ease}, border-radius 260ms ${ease}, box-shadow 260ms ${ease}, transform 260ms ${ease}`,
              willChange: "width, height, transform",
              transform: "translateZ(0)",
            }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full block"
              style={{ willChange: "transform" }}
            />
            <div
              ref={hiddenHolderRef}
              aria-hidden
              className="pointer-events-none select-none"
              style={{ width: 0, height: 0, overflow: "hidden" }}
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <div className="text-white/80 text-xs">{t("video_processor.inspector.stage.loading")}</div>
                </div>
              </div>
            )}
            {!activeForLabel && !isLoading && (
              <div className="absolute left-2 top-2 text-white/80 text-xs px-2 py-1 rounded bg-black/40">
                No visual at {Number(nowFromCtx || 0).toFixed(2)}s
              </div>
            )}
            <HardsubOverlay frameRef={frameRef} frameSize={frameSize} />
          </div>
        </div>
      </div>
    </section>
  );
}
