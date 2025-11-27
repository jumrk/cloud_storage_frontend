"use client";

import { useRef, useState, useEffect } from "react";
import axiosClient from "@/shared/lib/axiosClient";

const PRESETS = [
  { key: "16:9", label: "16:9", w: 16, h: 9 },
  { key: "9:16", label: "9:16", w: 9, h: 16 },
  { key: "1:1", label: "1:1", w: 1, h: 1 },
  { key: "4:3", label: "4:3", w: 4, h: 3 },
  { key: "3:4", label: "3:4", w: 3, h: 4 },
];

export default function usePreviewState({
  initialAspectKey = "16:9",
  projectId,
} = {}) {
  const ASPECTS = PRESETS.map((x) => ({
    ...x,
    ratio: x.w / x.h,
    ratioCss: `${x.w} / ${x.h}`,
  }));

  const byKey = (k) => ASPECTS.find((x) => x.key === String(k).trim());
  const [open, setOpen] = useState(false);
  const [aspect, setAspect] = useState(
    () => byKey(initialAspectKey) || ASPECTS[0]
  );
  const aspectRatio = aspect.ratioCss;

  const vpRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const next = byKey(initialAspectKey) || ASPECTS[0];
    if (next.key !== aspect.key) setAspect(next);
  }, [initialAspectKey]);

  const pickAspect = async (opt) => {
    if (!opt || opt.key === aspect.key) {
      setOpen(false);
      return;
    }
    setAspect(opt);
    setOpen(false);
    if (projectId) {
      try {
        await axiosClient.put(`/api/video-processor/project/${projectId}`, {
          aspect: opt.key,
        });
      } catch {}
    }
  };

  const setStageHot = () => {};

  return {
    ASPECTS,
    open,
    aspect,
    aspectRatio,
    vpRef,
    frameRef,
    setOpen,
    pickAspect,
    setStageHot,
  };
}
