"use client";
import { createContext, useContext, useState, useCallback, useMemo } from "react";

const VoiceoverContext = createContext(null);

export function VoiceoverProvider({ children }) {
  const [segments, setSegments] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [voiceOptions, setVoiceOptions] = useState([]);
  const [showVoiceIcons, setShowVoiceIcons] = useState(true);
  const [modifiedSegments, setModifiedSegments] = useState(new Set());

  const updateSegmentVoice = useCallback((index, voiceId) => {
    setSegments((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const updated = [...prev];
      updated[index] = { ...updated[index], voiceId };
      return updated;
    });
  }, []);

  const getSegmentVoice = useCallback((index) => {
    if (index < 0 || index >= segments.length) return null;
    return segments[index]?.voiceId || null;
  }, [segments]);

  const toggleShowVoiceIcons = useCallback(() => {
    setShowVoiceIcons((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      segments,
      setSegments,
      selectedIndex,
      setSelectedIndex,
      updateSegmentVoice,
      getSegmentVoice,
      voiceOptions,
      setVoiceOptions,
      showVoiceIcons,
      toggleShowVoiceIcons,
      modifiedSegments,
      setModifiedSegments,
    }),
    [segments, selectedIndex, updateSegmentVoice, getSegmentVoice, voiceOptions, showVoiceIcons, toggleShowVoiceIcons, modifiedSegments]
  );

  return (
    <VoiceoverContext.Provider value={value}>
      {children}
    </VoiceoverContext.Provider>
  );
}

export function useVoiceover() {
  const context = useContext(VoiceoverContext);
  if (!context) {
    throw new Error("useVoiceover must be used within VoiceoverProvider");
  }
  return context;
}

export function useVoiceoverMaybe() {
  return useContext(VoiceoverContext);
}

