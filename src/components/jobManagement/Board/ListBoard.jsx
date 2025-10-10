"use client";
import React, { useEffect } from "react";
import {
  IoAdd,
  IoEllipsisHorizontal,
  IoClose,
  IoPencil,
  IoTrash,
} from "react-icons/io5";
import ModalDetailCardTask from "../Card/ModalDetailCardTask";
import { useListBoard } from "@/hooks/jobManagement/useListBoard";
import SortableCardTask from "../Card/SortableCardTask";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import ListBoardSkeleton from "@/components/skeleton/ListBoardSkeleton";
import EmptySlot from "./EmptySlot";

function ListBoard({
  id,
  handleUpdate,
  handleDelete,
  title = "To do",
  headerRightSlot,
  boardId,
  onAttach,
}) {
  const {
    cards,
    loading,
    count,
    menuOpen,
    renameOpen,
    addOpen,
    tempTitle,
    saving,
    addTitle,
    menuRef,
    renameInputRef,
    addInputRef,
    activeCard,
    setMenuOpen,
    setRenameOpen,
    setAddOpen,
    setTempTitle,
    setAddTitle,
    onSaveRename,
    submitAdd,
    openCard,
    closeCard,
    handleDeleteCard,
    patchCard,
    setCards,
    refresh,
  } = useListBoard({ id, title, handleUpdate });
  useEffect(() => {
    if (!onAttach) return;
    const detach = onAttach(id, {
      setCards: (updater) =>
        setCards((prev) =>
          typeof updater === "function" ? updater(prev) : updater
        ),
      refresh,
    });
    return detach;
  }, [id, onAttach, setCards, refresh]);

  useEffect(() => {
    if (renameOpen)
      setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select?.();
      }, 0);
  }, [renameOpen, renameInputRef]);

  useEffect(() => {
    if (addOpen) setTimeout(() => addInputRef.current?.focus(), 0);
  }, [addOpen, addInputRef]);

  if (loading) return <ListBoardSkeleton />;

  return (
    <div>
      <div className="w-[352px] min-w-[352px] min-h-[560px] rounded-2xl border border-dashed border-neutral-300 bg-white shadow-sm">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div
                className="truncate font-semibold text-neutral-800"
                title={title}
              >
                {title}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">({count})</div>
            </div>

            <div className="shrink-0 flex items-center gap-1">
              {headerRightSlot}
              <button
                onClick={() => setAddOpen(true)}
                data-drag-ignore
                className="p-2 rounded-full border border-neutral-200 hover:bg-neutral-50 text-neutral-600"
                title="Thêm công việc"
              >
                <IoAdd className="text-neutral-600" />
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  data-drag-ignore
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Mở menu"
                >
                  <IoEllipsisHorizontal size={18} />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-44 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden z-10"
                  >
                    <button
                      type="button"
                      data-drag-ignore
                      onClick={() => {
                        setMenuOpen(false);
                        setRenameOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50"
                    >
                      <IoPencil /> Sửa tên
                    </button>
                    <button
                      type="button"
                      data-drag-ignore
                      onClick={() => {
                        handleDelete?.(id);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50 text-red-600"
                    >
                      <IoTrash /> Xóa danh sách
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 pb-3">
          {addOpen && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitAdd();
              }}
              className="mt-2 rounded-2xl bg-white text-black/60 p-2 border border-neutral-200"
              data-drag-ignore
            >
              <input
                ref={addInputRef}
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                placeholder="Nhập tiêu đề"
                className="w-full rounded-lg border border-[#60A5FA] bg-transparent px-3 py-2 text-sm outline-none placeholder:text-neutral-400"
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!addTitle.trim()}
                  className="inline-flex items-center rounded-xl bg-[#3B82F6] hover:brightness-95 text-white text-sm px-4 py-2"
                >
                  Thêm thẻ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddOpen(false);
                    setAddTitle("");
                  }}
                  aria-label="Đóng"
                  className="p-1 rounded-md hover:bg-black/5"
                >
                  <IoClose size={18} />
                </button>
              </div>
            </form>
          )}

          <SortableContext
            items={cards.map((c) => String(c._id))}
            strategy={verticalListSortingStrategy}
          >
            <div className="mt-2 space-y-2">
              {loading ? (
                <div className="text-sm text-neutral-400 py-2 text-center">
                  Đang tải…
                </div>
              ) : cards.length === 0 ? (
                <div className="text-sm text-neutral-400 py-2 text-center">
                  Chưa có thẻ nào
                </div>
              ) : (
                cards.map((c, idx) => (
                  <SortableCardTask
                    key={c._id}
                    listId={id}
                    id={c._id}
                    index={idx}
                    title={c.title}
                    desc={c.desc}
                    progress={c.progress}
                    dueDate={c.dueDate}
                    members={c.members}
                    labels={c.labels}
                    onEdit={openCard}
                    onDelete={handleDeleteCard}
                  />
                ))
              )}
              <EmptySlot listId={id} count={cards.length} />
            </div>
          </SortableContext>
        </div>
      </div>

      <ModalDetailCardTask
        open={Boolean(activeCard)}
        onClose={closeCard}
        card={activeCard}
        boardId={boardId}
        onSave={async (patch) => {
          await patchCard(activeCard._id, patch);
        }}
      />

      {renameOpen && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setRenameOpen(false)}
          />
          <div className="relative z-40 w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-800">
                Sửa tên danh sách
              </h3>
              <button
                type="button"
                data-drag-ignore
                onClick={() => setRenameOpen(false)}
                className="p-1 rounded-md hover:bg-neutral-100"
                aria-label="Đóng"
              >
                <IoClose size={18} />
              </button>
            </div>

            <div className="space-y-3" data-drag-ignore>
              <input
                ref={renameInputRef}
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setRenameOpen(false);
                  if (e.key === "Enter") onSaveRename();
                }}
                disabled={saving}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
                placeholder="Nhập tên danh sách…"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameOpen(false)}
                  className="inline-flex items-center rounded-xl px-3 py-2 border border-neutral-300 hover:bg-neutral-50 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={onSaveRename}
                  disabled={saving}
                  className="inline-flex items-center rounded-xl px-4 py-2 bg-neutral-900 text-white hover:brightness-95 text-sm disabled:opacity-60"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListBoard;
