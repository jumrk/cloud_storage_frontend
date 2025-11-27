"use client";
import { useRef } from "react";
import { useTimeline } from "../../../context/TimelineContext";

export default function Playhead() {
  const { currentTime, setCurrentTime, toPx, toSec } = useTimeline();
  const ref = useRef(null);

  const onDown = (e) => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const startLeft = el.getBoundingClientRect().left;
    const move = (ev) =>
      setCurrentTime(Math.max(0, toSec(ev.clientX - startLeft)));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      ref={ref}
      onPointerDown={onDown}
      className="pointer-events-auto absolute z-10 top-0 bottom-0 w-[2px] bg-brand"
      style={{ left: toPx(currentTime) }}
    >
      <div className="absolute -top-2 -left-2 w-4 h-4 rounded-md border-2 border-brand bg-white" />
    </div>
  );
}
