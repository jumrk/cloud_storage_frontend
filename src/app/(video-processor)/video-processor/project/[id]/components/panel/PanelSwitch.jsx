"use client";
import React, { lazy, Suspense, useEffect, useMemo } from "react";
import { useNavigation } from "../../context";
import SpinnerSurface from "../ui/SpinnerSurface";

const REGISTRY = {
  media: {
    loader: () => import("./media/MediaPanel"),
    width: "clamp(300px,24vw,420px)",
  },
  audio: {
    loader: () => import("./audio/AudioPanel"),
    width: "clamp(300px,26vw,440px)",
  },
  subtitle: {
    loader: () => import("./subtitle/SubtitlePanel"),
    width: "clamp(320px,28vw,480px)",
  },
  voiceover: {
    loader: () => import("./voiceover/VoiceoverPanel"),
    width: "clamp(320px,28vw,520px)",
  },
};

export default function PanelSwitch() {
  const navigation = useNavigation();

  const { activeNav, setLibWidth } = navigation;

  const entry = REGISTRY[activeNav] || REGISTRY.media;
  const Comp = useMemo(() => lazy(entry.loader), [activeNav, entry.loader]);

  useEffect(() => {
    setLibWidth(entry.width);
  }, [activeNav, entry.width, setLibWidth]);

  return (
    <Suspense
      fallback={
        <div className="w-full h-full relative flex items-center justify-center">
          <SpinnerSurface />
        </div>
      }
    >
      <Comp key={activeNav} />
    </Suspense>
  );
}
