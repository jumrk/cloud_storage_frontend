"use client";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableChecklistBlock({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.96 : 1,
    zIndex: isDragging ? 10 : "auto",
    width: "100%",
    willChange: "transform",
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      <div {...listeners} {...attributes} className="w-full">
        {children}
      </div>
    </div>
  );
}
