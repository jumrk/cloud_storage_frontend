"use client";
import React, { useCallback } from "react";
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
  } = useSortable({ id, data: { type: "card", listId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  const onDragStart = useCallback(
    (e) => {
      try {
        e.dataTransfer.setData("d2m.cardId", String(id));
        e.dataTransfer.setData("d2m.fromListId", String(listId));
        e.dataTransfer.effectAllowed = "move";
      } catch {}
    },
    [id, listId]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      draggable
      onDragStart={onDragStart}
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
