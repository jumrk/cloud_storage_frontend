"use client";
import React, { useCallback } from "react";
import { useTimeline } from "../../../context/TimelineContext";

export function DropWithTimeline({ children, handleDropUniversal }) {
  const { toSec } = useTimeline();
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = "copy";
    } catch {}
  }, []);
  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleDropUniversal(toSec)(e);
    },
    [handleDropUniversal, toSec]
  );
  return React.cloneElement(children, { onDragOver, onDrop });
}
