"use client";
import React, { useEffect, useRef } from "react";
import {
  IoClose,
  IoAdd,
  IoTimeOutline,
  IoCheckboxOutline,
  IoPersonAddOutline,
  IoPricetagOutline,
  IoDocumentTextOutline,
  IoChatbubbleOutline,
} from "react-icons/io5";
import DuePopover from "@/components/jobManagement/Card/DuePopover";
import MembersPopover from "@/components/jobManagement/Card/MembersPopover";
import LabelPopover from "@/components/jobManagement/Card/LabelPopover";
import DescriptionPopover from "@/components/jobManagement/Card/DescriptionPopover";
import useBoardMembers from "@/hooks/jobManagement/useBoardMembers";
import ChecklistSection from "./ChecklistSection";
import useModalDetailCardTask from "@/hooks/jobManagement/useModalDetailCardTask";
import { AiOutlineDelete, AiOutlineEllipsis } from "react-icons/ai";

function ModalDetailCardTask({ open, card, onClose, onSave, boardId }) {
  const panelRef = useRef(null);
  const { members: boardMembers, refresh } = useBoardMembers(boardId);
  const {
    COLOR_PALETTE,
    memberIds,
    editingTitle,
    titleDraft,
    hasMembers,
    titleInputRef,
    labelColors,
    labelsOpen,
    dueAt,
    dueOpen,
    membersOpen,
    descOpen,
    addingChecklist,
    descDoc,
    hasLabels,
    hasDue,
    hasDescription,
    showAnyQuick,
    newChecklistTitle,
    checkList,
    previewHtml,
    comment,
    addComment,
    setEditingTitle,
    setTitleDraft,
    commitTitle,
    setLabelsOpen,
    setDueOpen,
    setMembersOpen,
    setDescOpen,
    setNewChecklistTitle,
    setAddingChecklist,
    renderLabelChips,
    renderMemberChips,
    formatDueBadge,
    handleSaveDescription,
    fetchCheckList,
    handleCreateCheckList,
    handleDeleteCheckList,
    handleUpdateChecklist,
    fetchComment,
    handleAddComment,
    handleDeleteComment,
    setAddComment,
    moveCheckList,
  } = useModalDetailCardTask(card, onSave, boardMembers);

  useEffect(() => {
    if (!open) return;
    refresh();
    fetchCheckList();
    fetchComment();
  }, [open, boardId]);

  useEffect(() => {
    setTitleDraft(card?.title ?? "");
    setEditingTitle(false);
  }, [card?._id]);

  useEffect(() => {
    if (editingTitle) {
      requestAnimationFrame(() => {
        const el = titleInputRef.current;
        el?.focus();
        if (el) {
          const v = el.value;
          el.value = "";
          el.value = v;
        }
      });
    }
  }, [editingTitle]);

  const fTime = (dt) =>
    dt
      ? new Date(dt).toLocaleString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "short",
        })
      : "";
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 max-h-screen py-10 flex justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-neutral-900/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-6xl max-h-[calc(100vh-80px)] overflow-hidden flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end px-4 py-3 border-b border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-2 rounded-md hover:bg-neutral-100"
          >
            <IoClose size={18} />
          </button>
        </div>

        <div className="px-4 flex-1 overflow-hidden py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 h-full gap-4">
            <div className="flex flex-col rounded-xl border border-dashed border-neutral-300 scrollbar-hide overflow-y-auto">
              {/* title */}
              <div className="sticky flex items-center gap-2 top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-neutral-200 px-3 py-3">
                <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-neutral-400" />
                {!editingTitle ? (
                  <h2
                    className="text-2xl font-semibold text-neutral-800 cursor-text hover:opacity-90"
                    title="Nhấn để chỉnh sửa tiêu đề"
                    onClick={() => setEditingTitle(true)}
                  >
                    {titleDraft || card?.title || "Không có tiêu đề"}
                  </h2>
                ) : (
                  <input
                    ref={titleInputRef}
                    type="text"
                    className="text-2xl font-semibold text-neutral-900 bg-white border-b border-neutral-300 focus:border-neutral-500 outline-none rounded-none px-1 -mx-1"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={commitTitle}
                    placeholder="Nhập tiêu đề…"
                  />
                )}
              </div>
              {/* body */}
              <div className="px-3 py-3">
                <div className="space-y-5  text-sm">
                  {showAnyQuick && (
                    <div className="flex flex-wrap gap-2">
                      {!hasLabels && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setLabelsOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5"
                          >
                            <IoPricetagOutline /> Màu
                          </button>
                          <LabelPopover
                            open={labelsOpen}
                            onClose={() => setLabelsOpen(false)}
                            palette={COLOR_PALETTE}
                            selected={labelColors}
                            onChange={async (nextColors) => {
                              await onSave?.({
                                labels: nextColors,
                                labelColors: nextColors,
                              });
                              setLabelsOpen(false);
                            }}
                          />
                        </div>
                      )}
                      {!hasDue && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setDueOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5"
                          >
                            <IoTimeOutline /> Ngày
                          </button>
                          <DuePopover
                            open={dueOpen}
                            onClose={() => setDueOpen(false)}
                            value={dueAt ?? null}
                            onChange={async (nextIso) => {
                              await onSave?.({ dueAt: nextIso });
                              setDueOpen(false);
                            }}
                          />
                        </div>
                      )}
                      {!hasMembers && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setMembersOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5"
                          >
                            <IoPersonAddOutline /> Thành viên
                          </button>
                          <MembersPopover
                            open={membersOpen}
                            onClose={() => setMembersOpen(false)}
                            members={boardMembers}
                            selectedIds={memberIds}
                            onChange={async (next) => {
                              await onSave?.({ members: next });
                              setMembersOpen(false);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setAddingChecklist((v) => !v)}
                      className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5"
                    >
                      <IoCheckboxOutline /> Việc cần làm
                    </button>
                    {addingChecklist && (
                      <div className="absolute mt-2 z-10 w-80 rounded-xl border border-neutral-300 bg-neutral-100  p-3 shadow-xl">
                        <div className="text-sm mb-2">
                          Thêm danh sách công việc
                        </div>
                        <input
                          autoFocus
                          value={newChecklistTitle}
                          onChange={(e) => setNewChecklistTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter"}
                          placeholder="Tiêu đề"
                          className="w-full h-10 rounded-lg border border-neutral-300 bg-neutral-100 px-3 outline-none focus:border-neutral-500"
                        />

                        <div className="mt-3 flex  items-center gap-2">
                          <button
                            className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                            onClick={handleCreateCheckList}
                          >
                            Thêm
                          </button>
                          <button
                            className="h-9 px-4 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-200 text-sm hover:bg-neutral-700"
                            onClick={() => {
                              setAddingChecklist(false);
                              setNewChecklistTitle("");
                            }}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {hasMembers && (
                      <div className="space-y-2">
                        <div className="text-neutral-600 flex items-center gap-2">
                          <IoPersonAddOutline />
                          <span className="font-medium text-sm">
                            Thành viên
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderMemberChips()}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setMembersOpen(true)}
                              className="h-7 w-7 rounded-md bg-neutral-200 hover:bg-neutral-300 flex items-center justify-center"
                              title="Thêm thành viên"
                            >
                              <IoAdd />
                            </button>
                            <MembersPopover
                              open={membersOpen}
                              onClose={() => setMembersOpen(false)}
                              members={boardMembers}
                              selectedIds={memberIds}
                              onChange={async (next) => {
                                await onSave?.({ members: next });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {hasLabels && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <IoPricetagOutline />
                          <span className="font-medium text-sm">Màu</span>
                        </div>
                        <div className="flex relative items-center gap-2 flex-wrap">
                          {renderLabelChips()}
                          <button
                            type="button"
                            onClick={() => setLabelsOpen(true)}
                            className="h-7 w-7 rounded-md bg-neutral-200 hover:bg-neutral-300 flex items-center justify-center"
                            title="Chọn màu"
                          >
                            <IoAdd />
                          </button>
                          <LabelPopover
                            open={labelsOpen}
                            onClose={() => setLabelsOpen(false)}
                            palette={COLOR_PALETTE}
                            selected={labelColors}
                            onChange={async (nextColors) => {
                              await onSave?.({
                                labels: nextColors,
                                labelColors: nextColors,
                              });
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {hasDue && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-neutral-600">
                        <IoTimeOutline />
                        <span className="font-medium text-sm">
                          Ngày hết hạn
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center h-8 px-3 rounded-md bg-neutral-100 text-neutral-800 text-sm">
                          {formatDueBadge()}
                        </span>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setDueOpen(true)}
                            className="h-8 w-8 rounded-md bg-neutral-200 hover:bg-neutral-300 grid place-items-center"
                            title="Chỉnh ngày"
                          >
                            <IoAdd />
                          </button>
                          <DuePopover
                            open={dueOpen}
                            onClose={() => setDueOpen(false)}
                            value={dueAt ?? null}
                            onChange={async (nextIso) => {
                              await onSave?.({ dueAt: nextIso });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {descOpen ? (
                      <DescriptionPopover
                        open={descOpen}
                        onClose={() => setDescOpen(false)}
                        valueJSON={
                          descDoc || {
                            type: "doc",
                            content: [{ type: "paragraph" }],
                          }
                        }
                        onChange={handleSaveDescription}
                      />
                    ) : (
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-neutral-600">
                            <IoDocumentTextOutline />
                            <span className="font-medium text-sm">Mô tả</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDescOpen((v) => !v)}
                            className="h-8 px-3 rounded-md bg-neutral-200 text-neutral-800 text-sm hover:bg-neutral-300"
                          >
                            {descOpen
                              ? "Đóng"
                              : hasDescription
                              ? "Chỉnh sửa"
                              : "Thêm"}
                          </button>
                        </div>

                        {!descOpen && hasDescription && (
                          <div
                            className="px-1 text-neutral-800 prose prose-sm max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul,&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:pl-3"
                            dangerouslySetInnerHTML={{ __html: previewHtml }}
                          />
                        )}

                        {!descOpen && !hasDescription && (
                          <div className="w-full rounded-lg border border-neutral-300 bg-white text-neutral-500 px-4 py-3">
                            Chưa có mô tả. Nhấn “Thêm” để viết.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <ChecklistSection
                      onDeleteChecklist={handleDeleteCheckList}
                      onRenameChecklist={handleUpdateChecklist}
                      checklists={checkList}
                      boardMembers={boardMembers}
                      onSave={onSave}
                      moveCheckList={moveCheckList}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className=" overflow-auto scrollbar-hide rounded-xl border border-dashed border-neutral-300 p-3">
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2">
                    <IoChatbubbleOutline className="text-neutral-500" />
                    <span className="font-medium text-neutral-800">
                      Nhận xét
                    </span>
                  </div>
                </div>
                <form onSubmit={handleAddComment}>
                  <input
                    type="text"
                    value={addComment}
                    onChange={(e) => setAddComment(e.target.value)}
                    placeholder="Viết bình luận..."
                    className="w-full h-10 rounded-xl border border-neutral-300 bg-white text-neutral-800 placeholder-neutral-400 px-4 outline-none focus:border-neutral-500"
                  />
                </form>
                <div className="space-y-3 w-full">
                  {comment.length > 0 &&
                    comment.map((e) => (
                      <div key={e._id} className="group">
                        <div className="flex items-start gap-3">
                          <div className="flex items-start gap-3 w-full">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-neutral-900">
                                  {e?.userId?.fullName || "Ẩn danh"}
                                </span>
                                {e?.createdAt && (
                                  <span className="text-xs text-neutral-500">
                                    {fTime(e.createdAt)}
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 focus:border-none w-full px-3 py-2 text-[15px] text-neutral-800">
                                {e?.text}
                              </div>
                            </div>
                          </div>

                          {/* button */}
                          <button
                            className="p-1 rounded-md cursor-pointer text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                            aria-label="Mở menu"
                            onClick={() => handleDeleteComment(e._id)}
                          >
                            <AiOutlineDelete size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalDetailCardTask;
