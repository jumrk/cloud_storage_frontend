"use client";

import React, { useState } from "react";
import { useTimeline } from "../../context/TimelineContext";

export default function EmptyDropSurface({ onDropUniversal }) {
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
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        onDropUniversal(toSec)(e);
      }}
      className="mx-7 my-6 rounded-xl border border-border bg-surface-50"
      style={{
        height: 112,
        outline: over ? "2px solid var(--accent, #15a6ef)" : "none",
        outlineOffset: 0,
        display: "grid",
        placeItems: "center",
      }}
      aria-label="Drop media here"
    >
      <div className="text-sm text-text-muted flex items-center gap-2">
        <span className="i-lucide-panel-left-open" />
        Kéo và thả tệp phương tiện vào đây
      </div>
    </div>
  );
}
