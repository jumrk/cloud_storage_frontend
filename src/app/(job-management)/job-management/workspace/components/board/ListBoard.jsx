"use client";
import React, { useEffect } from "react";
import {
  IoAdd,
  IoEllipsisHorizontal,
  IoClose,
  IoPencil,
  IoTrash,
} from "react-icons/io5";
import ModalDetailCardTask from "../card/modals/ModalDetailCardTask";
import { useListBoard } from "../../hooks/useListBoard";
import SortableCardTask from "../card/SortableCardTask";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import ListBoardSkeleton from "@/shared/skeletons/ListBoardSkeleton";
import EmptySlot from "./EmptySlot";
import { useBoardDnd } from "./context/BoardDndContext";
import { useTranslations } from "next-intl";

function ListBoard({
  id,
  handleUpdate,
  handleDelete,
  title = "To do",
  headerRightSlot,
  boardId,
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
  const { registerList } = useBoardDnd();
  const t = useTranslations();

  useEffect(() => {
    const detach = registerList(id, {
      setCards: (updater) =>
        setCards((prev) =>
          typeof updater === "function" ? updater(prev) : updater
        ),
      refetchCards: refresh,
    });
    return detach;
  }, [id, registerList, setCards, refresh]);

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
      <div className="w-[352px] min-w-[352px] min-h-[560px] rounded-2xl border border-dashed border-border bg-white shadow-sm">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div
                className="truncate font-semibold text-text-strong"
                title={title}
              >
                {title}
              </div>
              <div className="text-xs text-text-muted mt-0.5">({count})</div>
            </div>

            <div className="shrink-0 flex items-center gap-1">
              {headerRightSlot}
              <button
                onClick={() => setAddOpen(true)}
                data-drag-ignore
                className="p-2 rounded-full border border-border text-text-muted hover:bg-surface-50"
                title={t("job_management.board.add_task")}
              >
                <IoAdd className="text-text-muted" />
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  data-drag-ignore
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-2 rounded-full text-text-muted hover:bg-surface-50"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label={t("job_management.board.open_menu")}
                >
                  <IoEllipsisHorizontal size={18} />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-44 rounded-xl border border-border bg-white shadow-lg overflow-hidden z-10"
                  >
                    <button
                      type="button"
                      data-drag-ignore
                      onClick={() => {
                        setMenuOpen(false);
                        setRenameOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-50"
                    >
                      <IoPencil /> {t("job_management.board.edit_name")}
                    </button>
                    <button
                      type="button"
                      data-drag-ignore
                      onClick={() => {
                        handleDelete?.(id);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50"
                    >
                      <IoTrash /> {t("job_management.board.delete_list")}
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
              className="mt-2 rounded-2xl bg-white text-text-strong p-2 border border-border"
              data-drag-ignore
            >
              <input
                ref={addInputRef}
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                placeholder={t("job_management.board.enter_title")}
                className="w-full rounded-lg border border-brand-300 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-text-muted focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!addTitle.trim()}
                  className="inline-flex items-center rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm px-4 py-2 disabled:opacity-60"
                >
                  {t("job_management.board.add_card")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddOpen(false);
                    setAddTitle("");
                  }}
                  aria-label={t("job_management.board.close")}
                  className="p-1 rounded-md hover:bg-surface-50"
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
                <div className="text-sm text-text-muted py-2 text-center">
                  {t("job_management.board.loading")}
                </div>
              ) : cards.length === 0 ? (
                <div className="text-sm text-text-muted py-2 text-center">
                  {t("job_management.board.no_cards_yet")}
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
                    startDate={c.startAt}
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
          <div className="relative z-40 w-full max-w-sm rounded-2xl border border-border bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-strong">
                {t("job_management.board.edit_list_name")}
              </h3>
              <button
                type="button"
                data-drag-ignore
                onClick={() => setRenameOpen(false)}
                className="p-1 rounded-md hover:bg-surface-50"
                aria-label={t("job_management.board.close")}
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
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none placeholder:text-text-muted focus:ring-2 focus:ring-brand-200 focus:border-brand-300"
                placeholder={t("job_management.board.enter_list_name")}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameOpen(false)}
                  className="inline-flex items-center rounded-xl px-3 py-2 border border-border hover:bg-surface-50 text-sm"
                >
                  {t("job_management.modal.cancel")}
                </button>
                <button
                  type="button"
                  onClick={onSaveRename}
                  disabled={saving}
                  className="inline-flex items-center rounded-xl px-4 py-2 bg-brand-600 text-white hover:bg-brand-500 text-sm disabled:opacity-60"
                >
                  {t("job_management.modal.save")}
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
