"use client";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CardTask from "./CardTask";

export default function SortableCardTask({
  id,
  listId,
  index,
  onEdit,
  onDelete,
  ...rest
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(id),
    data: {
      type: "card",
      listId: String(listId),
      preview: {
        id,
        index,
        ...rest,
      },
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.95 : 1,
    zIndex: isDragging ? 50 : "auto",
    userSelect: isDragging ? "none" : "auto",
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      draggable={false}
      className="no-native-drag"
      data-drag-ignore
    >
      <CardTask
        id={id}
        index={index}
        onEdit={onEdit}
        onDelete={onDelete}
        {...rest}
      />
    </div>
  );
}
