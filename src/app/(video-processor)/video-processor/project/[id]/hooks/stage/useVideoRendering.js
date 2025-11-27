import { useRef, useCallback } from "react";
import { mapTimelineToMedia } from "../../core/timing";
import { clamp01, sameURL } from "../../utils/previewUtils";

export default function useVideoRendering({
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
  rVfcIdRef,
  dimsRef,
}) {

  const renderFrame = useCallback(() => {
    const comp = compRef.current;
    const deck = deckRef.current;
    const img = imgRef.current;
    
    if (!comp || !deck || !img) return;
    
    const T = getT();
    const inRange = (c) =>
      T >= (c.start ?? 0) && T < (c.start ?? 0) + (c.duration ?? 0);
    const v = (videoClips || []).find(inRange);
    const im = !v ? (imageClips || []).find(inRange) : null;

    if (!v && !im) {
      if (currentUrlRef.current) currentUrlRef.current = "";
      comp.clear();
      renderText();
      if (rVfcIdRef) rVfcIdRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    if (im && !v) {
      if (currentUrlRef.current) currentUrlRef.current = "";
      const url = im.assetId
        ? (getImageThumb || getImageThumbDefault)(im.assetId)
        : im.url;
      if (url && img.src !== url) img.src = url;
      comp.clear();
      if (img.complete && img.naturalWidth) {
        comp.drawImage(img, "contain");
      }
      renderText();
      if (rVfcIdRef) rVfcIdRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    const active = v;
    const url = active.assetId
      ? (getVideoSrc || getVideoSrcDefault)(active.assetId)
      : active.url;
    const el = deck.active;
    const mt = mapTimelineToMedia(active, T, fps);

    const shouldMuteVideo = active.useAudio === false;

    if (el.muted !== shouldMuteVideo) el.muted = shouldMuteVideo;
    if (deck.standby.muted !== shouldMuteVideo)
      deck.standby.muted = shouldMuteVideo;

    const clipVol = clamp01(active.volume ?? 1);
    const masterVol = clamp01(mediaVolume ?? 1);
    const targetVol = shouldMuteVideo ? 0 : clamp01(clipVol * masterVol);

    if (Math.abs((el.volume ?? 1) - targetVol) > 0.001) el.volume = targetVol;
    if (Math.abs((deck.standby.volume ?? 1) - targetVol) > 0.001)
      deck.standby.volume = targetVol;

    const elUrl = el.currentSrc || el.src || "";
    if (url && !sameURL(elUrl, url) && !sameURL(currentUrlRef.current, url)) {
      currentUrlRef.current = url;
      deck.cue(url, mt).then(() => {
        deck.active.muted = shouldMuteVideo;
        deck.standby.muted = shouldMuteVideo;
        deck.active.volume = targetVol;
        deck.standby.volume = targetVol;
        deck.swap();
      });
      // Continue rendering current video while new one is cueing
      // This prevents video from disappearing when text layers are added
      // Always try to render video if it exists, even if dimensions are partial
      const videoToRender = el.videoWidth && el.videoHeight ? el : (deck.standby.videoWidth && deck.standby.videoHeight ? deck.standby : null);
      comp.clear();
      if (videoToRender && videoToRender.readyState >= 2) {
        try {
          comp.drawVideo(videoToRender, "contain");
        } catch (e) {
          // Video not ready yet
        }
      } else if (el.videoWidth || el.videoHeight || deck.standby.videoWidth || deck.standby.videoHeight) {
        // Try to render even if dimensions are partial
        try {
          if (el.videoWidth && el.videoHeight) {
            comp.drawVideo(el, "contain");
          } else if (deck.standby.videoWidth && deck.standby.videoHeight) {
            comp.drawVideo(deck.standby, "contain");
          }
        } catch (e) {
          // Video not ready yet
        }
      }
      renderText();
      if (rVfcIdRef) rVfcIdRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    const currentPlaying = playing;
    if (currentPlaying && el.paused) el.play().catch(() => {});
    if (!currentPlaying && !el.paused) el.pause();

    const drift = mt - (el.currentTime || 0);
    const now = performance.now() / 1000;
    const SEEK_THRESHOLD = 0.2;
    const MIN_SEEK_INTERVAL = 0.2;

    if (currentPlaying) {
      if (
        Math.abs(drift) > SEEK_THRESHOLD &&
        now - (deck.lastSeekTime || 0) > MIN_SEEK_INTERVAL
      ) {
        try {
          el.currentTime = Math.max(0, mt);
          deck.lastSeekTime = now;
        } catch {}
      }
      if (Math.abs((el.playbackRate || 1) - 1) > 0.01) el.playbackRate = 1;
    } else {
      if (Math.abs(drift) > 0.05 && now - (deck.lastSeekTime || 0) > 0.05) {
        try {
          el.currentTime = Math.max(0, mt);
          deck.lastSeekTime = now;
        } catch {}
      }
      if (Math.abs((el.playbackRate || 1) - 1) > 0.01) el.playbackRate = 1;
    }

    if (el.videoWidth && el.videoHeight) {
      if (
        dimsRef.current.w !== el.videoWidth ||
        dimsRef.current.h !== el.videoHeight
      ) {
        dimsRef.current = { w: el.videoWidth, h: el.videoHeight };
      }
    }

    // Always render video if it exists, even if dimensions are not yet available
    // This ensures video is visible even when text layers are present
    // CRITICAL: Always clear and render video FIRST, then text
    comp.clear();
    
    // Try both active and standby elements - prioritize the one with better state
    // IMPORTANT: Always try to render video if we have a video clip, regardless of element state
    let videoRendered = false;
    
    // First, try active element - be more aggressive about rendering
    if (el) {
      try {
        // If we have dimensions, always try to render (even if readyState is low)
        if (el.videoWidth && el.videoHeight) {
          comp.drawVideo(el, "contain");
          videoRendered = true;
        } 
        // If readyState is good, try to render even without dimensions
        else if (el.readyState >= 2) {
          comp.drawVideo(el, "contain");
          videoRendered = true;
        }
        // If we have src but no dimensions yet, still try (dimensions might be loading)
        else if (el.src || el.currentSrc) {
          try {
            comp.drawVideo(el, "contain");
            videoRendered = true;
          } catch (e) {
            // Dimensions not ready yet, but that's okay
          }
        }
      } catch (e) {
        // Video not ready yet, try standby
      }
    }
    
    // If active didn't work, try standby - be more aggressive
    if (!videoRendered && deck.standby) {
      try {
        if (deck.standby.videoWidth && deck.standby.videoHeight) {
          comp.drawVideo(deck.standby, "contain");
          videoRendered = true;
        } else if (deck.standby.readyState >= 2) {
          comp.drawVideo(deck.standby, "contain");
          videoRendered = true;
        } else if (deck.standby.src || deck.standby.currentSrc) {
          try {
            comp.drawVideo(deck.standby, "contain");
            videoRendered = true;
          } catch (e) {
            // Dimensions not ready yet
          }
        }
      } catch (e) {
        // Video not ready yet
      }
    }
    
    // Always render text after video (or if no video)
    renderText();

    if (rVfcIdRef) rVfcIdRef.current = requestAnimationFrame(renderFrame);
  }, [
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
    rVfcIdRef,
    dimsRef,
  ]);

  return { renderFrame };
}

