"use client";
import { useEffect, useState } from "react";
import { IoAdd, IoClose } from "react-icons/io5";
import SortableListBoard from "./SortableListBoard";
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useColumnBoard } from "@/hooks/jobManagement/useColumnBoard";

function ColumnBoard({ boardId }) {
  const {
    dragRef,
    adding,
    title,
    inputRef,
    sensors,
    list,
    attachListApi,
    setAdding,
    fetchListBoard,
    setTitle,
    handleUpdateListBoard,
    handleDeleteListBoard,
    submit,
    cancel,
    onDragEnd,
    onDragCancel,
    onDragStart,
  } = useColumnBoard(boardId);

  const [draggingType, setDraggingType] = useState(null);
  const [overlayCard, setOverlayCard] = useState(null);

  useEffect(() => {
    const stopNativeDrag = (e) => {
      if (draggingType) e.preventDefault();
    };
    window.addEventListener("dragstart", stopNativeDrag, { capture: true });
    return () =>
      window.removeEventListener("dragstart", stopNativeDrag, {
        capture: true,
      });
  }, [draggingType]);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding, inputRef]);

  useEffect(() => {
    fetchListBoard();
  }, [boardId]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToWindowEdges]}
      onDragStart={(e) => {
        const t = e?.active?.data?.current?.type || null;
        setDraggingType(t);
        if (t === "card") {
          setOverlayCard(e?.active?.data?.current?.preview || null);
        } else {
          setOverlayCard(null);
        }
        onDragStart?.(e);
      }}
      onDragEnd={(e) => {
        setDraggingType(null);
        setOverlayCard(null);
        onDragEnd(e);
      }}
      onDragCancel={(e) => {
        setDraggingType(null);
        setOverlayCard(null);
        onDragCancel?.(e);
      }}
    >
      <SortableContext
        items={list.map((l) => String(l._id))}
        strategy={horizontalListSortingStrategy}
      >
        <div
          ref={dragRef}
          className="flex gap-3 p-3 select-none overflow-auto scrollbar-hide"
          style={{ overscrollBehavior: "contain" }}
          onDragStartCapture={(e) => e.preventDefault()}
        >
          {list.length > 0 &&
            list.map((e) => (
              <SortableListBoard
                key={e._id}
                id={e._id}
                title={e.title}
                count={0}
                boardId={e.boardId}
                handleUpdate={handleUpdateListBoard}
                handleDelete={handleDeleteListBoard}
                onAttach={attachListApi}
              />
            ))}

          {!adding ? (
            <div
              onClick={() => setAdding(true)}
              className="flex hover:border-neutral-500 hover:border-2 cursor-pointer transition-all duration-200 justify-center items-center w-[352px] h-[560px] rounded-2xl border min-w-[352px] border-dashed border-neutral-300 bg-white shadow-sm"
            >
              <div className="inline-flex items-center gap-1 text-sm text-neutral-600 border border-neutral-200 rounded-full px-3 py-1.5">
                <IoAdd className="text-neutral-500" />
                Thêm danh sách
              </div>
            </div>
          ) : (
            <div className="flex hover:border-neutral-500 hover:border-2 cursor-default transition-all duration-200 justify-center items-center w-[352px] min-w-[352px] h-[560px] rounded-2xl border border-dashed border-neutral-300 bg-white shadow-sm">
              <form onSubmit={submit} className="space-y-3" data-drag-ignore>
                <input
                  ref={inputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && cancel()}
                  placeholder="Nhập tiêu đề danh sách…"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-neutral-900 text-white hover:brightness-95 active:translate-y-[1px]"
                  >
                    Thêm
                  </button>
                  <button
                    type="button"
                    onClick={cancel}
                    aria-label="Đóng"
                    className="p-1 rounded-md hover:bg-neutral-100"
                  >
                    <IoClose size={18} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {overlayCard ? (
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-lg w-[320px] p-3">
            <div
              className="font-medium text-neutral-800 truncate"
              title={overlayCard?.title}
            >
              {overlayCard?.title || "Card"}
            </div>
            {overlayCard?.desc ? (
              <div className="mt-1 text-xs text-neutral-500 line-clamp-2">
                {overlayCard.desc}
              </div>
            ) : null}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default ColumnBoard;
