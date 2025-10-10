"use client";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ListBoard from "./ListBoard";
import { LuGripVertical } from "react-icons/lu";

export default function SortableListBoard(props) {
  const { id } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(id),
    data: { type: "list" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="min-w-[352px]"
      onDragStartCapture={(e) => e.preventDefault()}
    >
      <ListBoard
        {...props}
        headerRightSlot={
          <button
            type="button"
            aria-label="Kéo để sắp xếp"
            className="p-2 rounded-md hover:bg-neutral-100 text-neutral-600 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
            data-drag-ignore
          >
            <LuGripVertical />
          </button>
        }
      />
    </div>
  );
}
