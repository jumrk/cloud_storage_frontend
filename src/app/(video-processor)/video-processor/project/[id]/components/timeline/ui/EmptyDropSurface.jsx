"use client";
import React, { useState } from "react";
import { useTimeline } from "../../../context/TimelineContext";

export function EmptyDropSurface({ onDropUniversal }) {
  const { toSec } = useTimeline();
  const [over, setOver] = useState(false);
  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        try {
          e.dataTransfer.dropEffect = "copy";
        } catch {}
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        onDropUniversal(toSec)(e);
      }}
      className="mx-6 my-6 rounded-xl border border-border bg-surface-50"
      style={{
        height: 112,
        display: "grid",
        placeItems: "center",
        outline: over ? "2px solid var(--accent,#15a6ef)" : "none",
      }}
    >
      <div className="text-sm text-text-muted">
        Kéo và thả tệp phương tiện vào đây
      </div>
    </div>
  );
}
