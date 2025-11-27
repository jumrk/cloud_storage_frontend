import { useRef, useCallback, useMemo } from "react";
import { drawTextLayers } from "../../overlays/TextRenderer";

export default function usePreviewStage({
  validTextLayers,
  getTextLayers, // Getter to read latest textLayers from ref (includes text content updates)
  fps,
  getT,
  compRef,
  textCacheRef,
}) {
  const renderText = useCallback(() => {
    const comp = compRef.current;
    if (!comp) return;
    
    const T = getT();
    const textCache = textCacheRef.current;
    if (!textCache.front || !textCache.back) return;

    // Read latest textLayers from ref (includes text content updates)
    const latestTextLayers = getTextLayers ? getTextLayers() : validTextLayers;
    const latestValidTextLayers = latestTextLayers?.filter((layer) => {
      const styleScale = Number(layer?.styleScale) ?? 1;
      return styleScale > 0 && styleScale >= 0.1;
    }) || [];

    if (!latestValidTextLayers || latestValidTextLayers.length === 0) {
      if (textCache.lastHash !== null) {
        textCache.lastHash = null;
        textCache.lastValidTextLayersRef = null;
        textCache.lastT = null;
        textCache.lastActiveLayers = null;
        textCache.lastActiveLayerIds = null;
        if (textCache.rafId) {
          cancelAnimationFrame(textCache.rafId);
          textCache.rafId = null;
        }
      }
      return;
    }

    const T_rounded = Math.floor(T * 10) / 10;
    // Check structure changes using validTextLayers (state), but use latestValidTextLayers for content
    const shouldRecalcActiveLayers =
      textCache.lastValidTextLayersRef !== validTextLayers ||
      textCache.lastT === null ||
      Math.abs(textCache.lastT - T_rounded) >= 0.1;

    let activeTextLayers = textCache.lastActiveLayers;

    if (shouldRecalcActiveLayers) {
      // Use latestValidTextLayers (from ref) to get latest text content
      activeTextLayers = latestValidTextLayers.filter((t) => {
        return (
          T >= (t.start || 0) && T < (t.start || 0) + (t.duration || 0)
        );
      });
      textCache.lastActiveLayers = activeTextLayers;
      textCache.lastT = T_rounded;
      textCache.lastValidTextLayersRef = validTextLayers; // Track structure changes
    } else {
      // Structure hasn't changed, but text content might have - update activeTextLayers with latest content
      const latestActiveTextLayers = latestValidTextLayers.filter((t) => {
        return (
          T >= (t.start || 0) && T < (t.start || 0) + (t.duration || 0)
        );
      });
      // Only update if IDs match (structure same, content might have changed)
      if (latestActiveTextLayers.length === activeTextLayers.length &&
          latestActiveTextLayers.every((t, i) => t.id === activeTextLayers[i]?.id)) {
        activeTextLayers = latestActiveTextLayers; // Update with latest text content
      }
    }

    if (!activeTextLayers || activeTextLayers.length === 0) {
      if (textCache.lastHash !== null) {
        textCache.lastHash = null;
        textCache.lastValidTextLayersRef = null;
        textCache.lastT = null;
        textCache.lastActiveLayers = null;
        textCache.lastActiveLayerIds = null;
        if (textCache.rafId) {
          cancelAnimationFrame(textCache.rafId);
          textCache.rafId = null;
        }
      }
      return;
    }

    // Check if any layer has karaoke enabled
    const hasKaraoke = activeTextLayers.some((t) => t.karaokeEnabled === true);
    
    const activeLayerIds = activeTextLayers
      .map((t) => t.id || "")
      .sort()
      .join(",");
    
    // For karaoke, we need to render every frame, but still cache non-karaoke layers
    // Round T to 0.05s precision for karaoke to reduce unnecessary recalculations
    const T_rounded_karaoke = hasKaraoke ? Math.round(T * 20) / 20 : T_rounded;
    
    if (!hasKaraoke) {
      const shouldRecalculateHash =
        textCache.lastValidTextLayersRef !== validTextLayers ||
        textCache.lastActiveLayerIds !== activeLayerIds ||
        textCache.lastHash === null;

      let hash = textCache.lastHash;

      if (shouldRecalculateHash) {
        const sortedLayers = [...activeTextLayers].sort((a, b) =>
          (a.id || "").localeCompare(b.id || "")
        );
        hash = sortedLayers
          .map((t) => {
            const x = Math.round((t.x ?? 0.5) * 100) / 100;
            const y = Math.round((t.y ?? 0.85) * 100) / 100;
            const fontSize = Math.round(t.fontSize ?? 48);
            return `${t.id || ""}|${t.text || ""}|${
              t.fill || ""
            }|${fontSize}|${x}|${y}|${t.align || ""}|${t.fontFamily || ""}|${
              t.weight || ""
            }|${t.style || ""}`;
          })
          .join("||");

        textCache.lastValidTextLayersRef = validTextLayers;
        textCache.lastActiveLayerIds = activeLayerIds;
      }

      if (textCache.lastHash !== hash) {
        textCache.lastHash = hash;
      }
    }

    // Always draw - use latestValidTextLayers (from ref) to get latest text content
    drawTextLayers(
      comp.ctx,
      latestValidTextLayers,
      comp.canvas.width,
      comp.canvas.height,
      hasKaraoke ? T_rounded_karaoke : T
    );
  }, [validTextLayers, getTextLayers, getT, compRef, textCacheRef]);

  return { renderText };
}

