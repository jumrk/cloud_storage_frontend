"use client";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useProject } from "./ProjectContext";
import subtitleService from "../services/subtitleService";

const Ctx = createContext(null);

const DEFAULT_SUBTITLE_STYLE = {
  font: "Inter",
  color: "#ffffff",
  scale: 0.5,
  weight: "700",
  style: "normal",
  align: "center",
  bgEnabled: false,
  bgColor: "#000000",
  bgOpacity: 0.5,
  hiEnabled: false,
  hiColor: "#ffffff",
  hiBg: "#ffffff",
  hiOpacity: 0.5,
  karaokeEnabled: false,
  karaokeColor: "#ffff00",
  karaokeBg: "#ffff00",
  karaokeOpacity: 0.8,
  hPlace: 0.5,
  hPlaceBase: 0.5,
  hPlaceOffset: 0,
  vPlace: 0.85,
  vPlaceBase: 0.85,
  vPlaceOffset: 0,
  autoBreak: true,
  maxLines: 2,
  maxWords: 12,
};

export function SubtitleProvider({ children }) {
  const { projectId, dataProject } = useProject();
  const service = subtitleService();
  const [showStyle, setShowStyle] = useState(false);
  const [subtitleStyle, setSubtitleStyle] = useState(DEFAULT_SUBTITLE_STYLE);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load subtitle style from project (only once on mount)
  useEffect(() => {
    if (isInitialized) return;
    
    if (dataProject?.subtitleStyle) {
      const loadedStyle = { ...DEFAULT_SUBTITLE_STYLE, ...dataProject.subtitleStyle };
      
      if (loadedStyle.hPlaceBase === undefined) {
        const hPlace = loadedStyle.hPlace ?? 0.5;
        if (Math.abs(hPlace - 0.1) < 0.1) {
          loadedStyle.hPlaceBase = 0.1;
          loadedStyle.hPlaceOffset = hPlace - 0.1;
        } else if (Math.abs(hPlace - 0.5) < 0.1) {
          loadedStyle.hPlaceBase = 0.5;
          loadedStyle.hPlaceOffset = hPlace - 0.5;
        } else if (Math.abs(hPlace - 0.9) < 0.1) {
          loadedStyle.hPlaceBase = 0.9;
          loadedStyle.hPlaceOffset = hPlace - 0.9;
        } else {
          loadedStyle.hPlaceBase = 0.5;
          loadedStyle.hPlaceOffset = hPlace - 0.5;
        }
      }
      
      if (loadedStyle.vPlaceBase === undefined) {
        const vPlace = loadedStyle.vPlace ?? 0.85;
        if (Math.abs(vPlace - 0.1) < 0.1) {
          loadedStyle.vPlaceBase = 0.1;
          loadedStyle.vPlaceOffset = vPlace - 0.1;
        } else if (Math.abs(vPlace - 0.5) < 0.1) {
          loadedStyle.vPlaceBase = 0.5;
          loadedStyle.vPlaceOffset = vPlace - 0.5;
        } else if (Math.abs(vPlace - 0.9) < 0.1) {
          loadedStyle.vPlaceBase = 0.9;
          loadedStyle.vPlaceOffset = vPlace - 0.9;
        } else {
          loadedStyle.vPlaceBase = 0.85;
          loadedStyle.vPlaceOffset = vPlace - 0.85;
        }
      }
      
      setSubtitleStyle(loadedStyle);
      setIsInitialized(true);
    } else if (dataProject && dataProject.subtitleStyle === null) {
      const noneStyle = { ...DEFAULT_SUBTITLE_STYLE, scale: 0, styleId: "none" };
      setSubtitleStyle(noneStyle);
      setIsInitialized(true);
    } else if (dataProject && !dataProject.subtitleStyle) {
      setSubtitleStyle(DEFAULT_SUBTITLE_STYLE);
      setIsInitialized(true);
    }
  }, [dataProject?.subtitleStyle, dataProject, isInitialized]);
  
  // Don't auto-update subtitleStyle after initialization to avoid overriding user changes
  // User changes are handled by updateSubtitleStyle callback

  const handelShowStyle = useCallback(() => setShowStyle((prev) => !prev), []);

  const updateSubtitleStyle = useCallback(
    async (newStyle) => {
      // If newStyle is null, set to default for UI but send null to backend to remove it
      if (newStyle === null) {
        // Use default style with scale = 0 and styleId = "none" for UI
        const noneStyle = { ...DEFAULT_SUBTITLE_STYLE, scale: 0, styleId: "none" };
        setSubtitleStyle(noneStyle);
      } else {
        // Update state immediately (synchronously) for instant UI update
        setSubtitleStyle(newStyle);
      }
      // Save to backend (async, don't wait)
      if (projectId) {
        service
          .updateSubtitleStyle({ projectId, subtitleStyle: newStyle })
          .catch((err) => {
            console.error("Failed to save subtitle style:", err);
          });
      }
    },
    [projectId, service]
  );

  const value = useMemo(
    () => ({
      showStyle,
      setShowStyle,
      handelShowStyle,
      subtitleStyle,
      updateSubtitleStyle,
    }),
    [showStyle, handelShowStyle, subtitleStyle, updateSubtitleStyle]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSubtitle() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useSubtitle phải được dùng bên trong <SubtitleProvider>");
  return ctx;
}
