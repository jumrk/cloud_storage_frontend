"use client";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LuGripVertical } from "react-icons/lu";
import CardTask from "./CardTask";
import { useTranslations } from "next-intl";

export default function SortableCardTask({
  id,
  listId,
  index,
  onEdit,
  onDelete,
  ...rest
}) {
  const t = useTranslations();
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
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="no-native-drag flex items-stretch gap-0 rounded-xl"
      data-drag-ignore
    >
      <button
        type="button"
        aria-label={t("job_management.board.drag_to_sort")}
        className="flex shrink-0 cursor-grab active:cursor-grabbing touch-none items-center justify-center self-center rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        {...attributes}
        {...listeners}
        draggable={false}
      >
        <LuGripVertical size={18} />
      </button>
      <div className="min-w-0 flex-1">
        <CardTask
          id={id}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
          {...rest}
        />
      </div>
    </div>
  );
}
