"use client";
import React, { useRef } from "react";

export default function DragScrollRow({ className = "", children }) {
  const ref = useRef(null);
  const st = useRef({
    down: false,
    startX: 0,
    startLeft: 0,
    dragging: false,
    lastDragEnd: 0,
  });

  const THRESHOLD = 12;
  const SUPPRESS_MS = 140;

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    const el = ref.current;
    if (!el) return;

    st.current.down = true;
    st.current.dragging = false;
    st.current.startX = e.clientX;
    st.current.startLeft = el.scrollLeft;
    el.style.cursor = "grabbing";
  };

  const onPointerMove = (e) => {
    if (!st.current.down) return;
    const el = ref.current;
    if (!el) return;

    const dx = e.clientX - st.current.startX;

    if (!st.current.dragging && Math.abs(dx) >= THRESHOLD) {
      st.current.dragging = true;
      document.body.classList.add("select-none");
    }
    if (st.current.dragging) {
      el.scrollLeft = st.current.startLeft - dx;
    }
  };

  const onPointerUp = () => {
    const el = ref.current;
    if (el) el.style.cursor = "";
    if (!st.current.down) return;

    if (st.current.dragging) {
      st.current.lastDragEnd = performance.now();
    }
    st.current.down = false;
    st.current.dragging = false;
    document.body.classList.remove("select-none");
  };

  const onClickCapture = (e) => {
    if (performance.now() - st.current.lastDragEnd < SUPPRESS_MS) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onWheel = (e) => {
    const el = ref.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onClickCapture={onClickCapture}
      onWheel={onWheel}
      className={`flex items-center w-full overflow-x-auto scrollbar-hide select-none ${className}`}
      style={{
        cursor: "grab",
        touchAction: "pan-x",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {children}
    </div>
  );
}
