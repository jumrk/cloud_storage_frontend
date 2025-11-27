"use client";
import { createContext, useContext, useState, useCallback } from "react";

const HardsubContext = createContext(null);

export function HardsubProvider({ children }) {
  const [isActive, setIsActive] = useState(false);
  const [boxColor, setBoxColor] = useState("#FF0000"); // Default red
  const [boxRect, setBoxRect] = useState(null); // {x, y, width, height}
  const [autoTrack, setAutoTrack] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  const activate = useCallback(() => {
    setIsActive(true);
  }, []);

  const deactivate = useCallback(() => {
    setIsActive(false);
    setBoxRect(null);
    setAutoTrack(false);
    setProgress(0);
    setProgressMessage("");
  }, []);

  const updateBoxRect = useCallback((rect) => {
    setBoxRect(rect);
  }, []);

  const value = {
    isActive,
    boxColor,
    boxRect,
    autoTrack,
    isProcessing,
    progress,
    progressMessage,
    setBoxColor,
    setAutoTrack,
    setIsProcessing,
    setProgress,
    setProgressMessage,
    activate,
    deactivate,
    updateBoxRect,
  };

  return (
    <HardsubContext.Provider value={value}>
      {children}
    </HardsubContext.Provider>
  );
}

export function useHardsub() {
  const ctx = useContext(HardsubContext);
  if (!ctx) {
    throw new Error("useHardsub must be used within HardsubProvider");
  }
  return ctx;
}

export function useHardsubMaybe() {
  return useContext(HardsubContext);
}

