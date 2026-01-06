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
import { useColumnBoard } from "../../hooks/useColumnBoard";
import { useBoardContext } from "./context/BoardContext";
import { BoardDndProvider } from "./context/BoardDndContext";
import { useTranslations } from "next-intl";
import ListBoardSkeleton from "@/shared/skeletons/ListBoardSkeleton";
function ColumnBoard() {
  const { boardId } = useBoardContext();
  return (
    <BoardDndProvider>
      <ColumnBoardInner boardId={boardId} />
    </BoardDndProvider>
  );
}
function ColumnBoardInner({ boardId }) {
  const t = useTranslations();
  const {
    dragRef,
    adding,
    title,
    inputRef,
    sensors,
    list,
    loading,
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
  }, [boardId, fetchListBoard]);
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
          {loading ? (
            <>
              <ListBoardSkeleton /> <ListBoardSkeleton />
            </>
          ) : (
            <>
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
                  />
                ))}
              {!adding ? (
                <div
                  onClick={() => setAdding(true)}
                  className="flex cursor-pointer transition-all duration-200 justify-center items-center w-[352px] h-[560px] rounded-2xl min-w-[352px] border border-dashed border-gray-200 bg-white shadow-sm hover:border-brand-300 hover:border-2"
                >
                  <div className="inline-flex items-center gap-1 text-sm text-gray-600 border border-gray-200 rounded-full px-3 py-1.5">
                    <IoAdd className="text-gray-600" />
                    {t("job_management.board.add_list")}
                  </div>
                </div>
              ) : (
                <div className="flex cursor-default transition-all duration-200 justify-center items-center w-[352px] min-w-[352px] h-[560px] rounded-2xl border border-dashed border-gray-200 bg-white shadow-sm hover:border-brand-300 hover:border-2">
                  <form
                    onSubmit={submit}
                    className="space-y-3"
                    data-drag-ignore
                  >
                    <input
                      ref={inputRef}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Escape" && cancel()}
                      placeholder={t("job_management.board.enter_list_title")}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-brand-600 text-white hover:bg-brand-500 active:translate-y-[1px]"
                      >
                        {t("job_management.modal.add")}
                      </button>
                      <button
                        type="button"
                        onClick={cancel}
                        aria-label={t("job_management.board.close")}
                        className="p-1 rounded-md hover:bg-white"
                      >
                        <IoClose size={18} />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {overlayCard ? (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-lg w-[320px] p-3">
            <div
              className="font-medium text-gray-900 truncate"
              title={overlayCard?.title}
            >
              {overlayCard?.title || "Card"}
            </div>
            {overlayCard?.desc ? (
              <div className="mt-1 text-xs text-gray-600 line-clamp-2">
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
