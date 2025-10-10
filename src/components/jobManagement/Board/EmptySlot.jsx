import { useDroppable } from "@dnd-kit/core";

export default function EmptySlot({ listId, count }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `list-slot-${listId}`,
    data: { type: "list", listId: String(listId), itemsCount: count },
  });

  return (
    <div
      ref={setNodeRef}
      className={[
        "w-full rounded-2xl transition-all duration-150 ease-out",
        isOver
          ? "h-26 border-2 border-dashed border-neutral-300 bg-white shadow-sm"
          : "h-3 bg-transparent",
      ].join(" ")}
    >
      {isOver && (
        <div className="h-full w-full flex items-center justify-center">
          <span className="text-xs text-neutral-400">Thả thẻ vào đây</span>
        </div>
      )}
    </div>
  );
}
