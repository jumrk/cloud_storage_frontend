"use client";
import React, { useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ListBoard from "./ListBoard";
import { LuGripVertical } from "react-icons/lu";
import { useDroppable } from "@dnd-kit/core";

export default function SortableListBoard(props) {
  const { id } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const { setNodeRef: setDropRef } = useDroppable({
    id: `drop-${id}`,
    data: { type: "list", listId: id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
  };

  const handleNativeDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleNativeDrop = useCallback(
    async (e) => {
      try {
        const cardId = e.dataTransfer.getData("d2m.cardId");
        const fromListId = e.dataTransfer.getData("d2m.fromListId");
        if (!cardId || !fromListId || String(fromListId) === String(id)) return;

        const evt = new CustomEvent("d2m:move-card-to-list", {
          detail: { cardId, fromListId, toListId: String(id) },
          bubbles: true,
        });
        e.currentTarget?.dispatchEvent(evt);
      } catch {}
    },
    [id]
  );

  return (
    <div ref={setNodeRef} style={style} className="min-w-[352px]">
      <div
        ref={setDropRef}
        onDragOver={handleNativeDragOver}
        onDrop={handleNativeDrop}
        className="h-full"
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
    </div>
  );
}
