"use client";
import React, { useEffect, useRef, useState } from "react";
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
import DuePopover from "../popovers/DuePopover";
import MembersPopover from "../popovers/MembersPopover";
import LabelPopover from "../popovers/LabelPopover";
import DescriptionPopover from "../popovers/DescriptionPopover";
import useBoardMembers from "../../../hooks/useBoardMembers";
import ChecklistSection from "../checklist/ChecklistSection";
import useModalDetailCardTask from "../../../hooks/useModalDetailCardTask";
import { CHECKLIST_TEMPLATES } from "../../../constants/checklistTemplates";
import { AiOutlineDelete } from "react-icons/ai";
import { useTranslations } from "next-intl";
function ModalDetailCardTask({ open, card, onClose, onSave, boardId }) {
  const panelRef = useRef(null);
  const { members: boardMembers, refresh } = useBoardMembers(boardId);
  const t = useTranslations();
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
    hasStart,
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
    applyChecklistTemplate,
    boardTemplates,
    fetchBoardTemplates,
    createBoardChecklistTemplate,
    handleDeleteCheckList,
    handleUpdateChecklist,
    fetchComment,
    handleAddComment,
    handleDeleteComment,
    setAddComment,
    moveCheckList,
  } = useModalDetailCardTask(card, onSave, boardMembers, boardId);
  const quickMemRef = useRef(null);
  const actionMemRef = useRef(null);
  const [startOpen, setStartOpen] = useState(false);
  const [showCreateTemplateForm, setShowCreateTemplateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateItems, setNewTemplateItems] = useState([{ text: "" }]);
  const addNewTemplateItem = () => setNewTemplateItems((prev) => [...prev, { text: "" }]);
  const removeNewTemplateItem = (idx) =>
    setNewTemplateItems((prev) => prev.filter((_, i) => i !== idx));
  const setNewTemplateItemText = (idx, text) =>
    setNewTemplateItems((prev) => prev.map((it, i) => (i === idx ? { ...it, text } : it)));
  const handleCreateTemplateSubmit = async () => {
    const created = await createBoardChecklistTemplate({
      name: newTemplateName,
      title: newTemplateName,
      items: newTemplateItems.filter((i) => i.text?.trim()),
    });
    if (created) {
      setShowCreateTemplateForm(false);
      setNewTemplateName("");
      setNewTemplateItems([{ text: "" }]);
    }
  };
  useEffect(() => {
    if (!open) return;
    refresh();
    fetchCheckList();
    fetchComment();
    fetchBoardTemplates(boardId);
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
  const formatStartBadge = () => {
    if (!card?.startAt) return "—";
    const d = new Date(card.startAt);
    const s = d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
    return s;
  };
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
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-6xl max-h-[calc(100vh-80px)] overflow-hidden flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end px-4 py-3 border-b border-gray-200">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("job_management.board.close")}
            className="p-2 rounded-md hover:bg-white text-gray-600"
          >
            <IoClose size={18} />
          </button>
        </div>
        <div className="px-4 flex-1 overflow-hidden py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 h-full gap-4">
            <div className="flex flex-col rounded-xl border border-dashed border-gray-200 scrollbar-hide overflow-y-auto">
              <div className="sticky flex items-center gap-2 top-0 z-10 bg-white backdrop-blur supports-[backdrop-filter]:bg-white border-b border-gray-200 px-3 py-3">
                <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-gray-200" />
                {!editingTitle ? (
                  <h2
                    className="text-2xl font-semibold text-gray-900 cursor-text hover:opacity-90"
                    title={t("job_management.board.click_to_edit_title")}
                    onClick={() => setEditingTitle(true)}
                  >
                    {titleDraft ||
                      card?.title ||
                      t("job_management.board.no_title")}
                  </h2>
                ) : (
                  <input
                    ref={titleInputRef}
                    type="text"
                    className="text-2xl font-semibold text-gray-900 bg-white border-b border-gray-200 focus:border-brand-400 outline-none rounded-none px-1 -mx-1"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={commitTitle}
                    placeholder={t("job_management.board.enter_title_ellipsis")}
                  />
                )}
              </div>
              <div className="px-3 py-3">
                <div className="space-y-5 text-sm">
                  {showAnyQuick && (
                    <div className="flex flex-wrap gap-2">
                      {!hasLabels && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setLabelsOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white hover:bg-white px-3 py-1.5 text-gray-900"
                          >
                            <IoPricetagOutline />
                            {t("job_management.board.color")}
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
                      {!hasStart && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setStartOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white hover:bg-white px-3 py-1.5 text-gray-900"
                          >
                            <IoTimeOutline /> Bắt đầu
                          </button>
                          <DuePopover
                            open={startOpen}
                            onClose={() => setStartOpen(false)}
                            value={card?.startAt ?? null}
                            onChange={async (nextIso) => {
                              await onSave?.({ startAt: nextIso });
                              setStartOpen(false);
                            }}
                            label={t("job_management.card.start_date")}
                          />
                        </div>
                      )}
                      {!hasDue && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setDueOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white hover:bg-white px-3 py-1.5 text-gray-900"
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
                            label={t("job_management.card.due_date")}
                          />
                        </div>
                      )}
                      {!hasMembers && (
                        <div className="relative">
                          <button
                            ref={quickMemRef}
                            type="button"
                            onClick={() => setMembersOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white hover:bg-white px-3 py-1.5 text-gray-900"
                          >
                            <IoPersonAddOutline /> Thành viên
                          </button>
                          <MembersPopover
                            anchorEl={quickMemRef.current}
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
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white hover:bg-white px-3 py-1.5 text-gray-900"
                    >
                      <IoCheckboxOutline />
                      {t("job_management.checklist.tasks_to_do")}
                    </button>
                    {addingChecklist && (
                      <div className="absolute mt-2 z-10 w-96 max-h-[80vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                        <div className="text-sm font-medium text-gray-900 mb-2">
                          {t("job_management.checklist.add_checklist")}
                        </div>

                        {/* Form của không gian làm việc này (chỉ board này có) */}
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                            Form của không gian này
                          </div>
                          {boardTemplates.length === 0 ? (
                            <p className="text-xs text-gray-500 py-1">Chưa có form. Tạo mới bên dưới.</p>
                          ) : (
                            <div className="space-y-1">
                              {boardTemplates.map((tmpl) => (
                                <button
                                  key={tmpl._id}
                                  type="button"
                                  onClick={() => applyChecklistTemplate(tmpl)}
                                  className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-brand-200 text-sm text-gray-900"
                                >
                                  {tmpl.name}
                                  <span className="block text-xs text-gray-500 mt-0.5">
                                    {Array.isArray(tmpl.items) ? tmpl.items.length : 0} khâu
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Tạo form chuẩn mới - chỉ lưu trong không gian này */}
                        <div className="mb-3 border-t border-gray-200 pt-3">
                          {!showCreateTemplateForm ? (
                            <button
                              type="button"
                              onClick={() => setShowCreateTemplateForm(true)}
                              className="w-full text-left px-3 py-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-sm text-gray-700"
                            >
                              + Tạo form chuẩn mới (chỉ không gian này)
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-gray-600">Tên form</div>
                              <input
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                placeholder="VD: Quy trình phim thuyết minh"
                                className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-400"
                              />
                              <div className="text-xs font-medium text-gray-600">Các khâu (mỗi dòng một khâu)</div>
                              {newTemplateItems.map((it, idx) => (
                                <div key={idx} className="flex gap-1">
                                  <input
                                    value={it.text}
                                    onChange={(e) => setNewTemplateItemText(idx, e.target.value)}
                                    placeholder={`Khâu ${idx + 1}`}
                                    className="flex-1 h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-400"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeNewTemplateItem(idx)}
                                    className="h-9 w-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 shrink-0"
                                    aria-label="Xóa khâu"
                                  >
                                    <AiOutlineDelete size={14} />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={addNewTemplateItem}
                                className="text-xs text-brand-600 hover:underline"
                              >
                                + Thêm khâu
                              </button>
                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={handleCreateTemplateSubmit}
                                  disabled={!newTemplateName.trim()}
                                  className="h-9 px-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm disabled:opacity-50"
                                >
                                  Lưu form
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowCreateTemplateForm(false);
                                    setNewTemplateName("");
                                    setNewTemplateItems([{ text: "" }]);
                                  }}
                                  className="h-9 px-3 rounded-lg border border-gray-200 text-gray-700 text-sm"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Form mẫu (built-in) */}
                        <div className="mb-3 border-t border-gray-200 pt-3">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                            Form mẫu
                          </div>
                          <div className="space-y-1">
                            {CHECKLIST_TEMPLATES.map((tmpl) => (
                              <button
                                key={tmpl.id}
                                type="button"
                                onClick={() => applyChecklistTemplate(tmpl)}
                                className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-brand-200 text-sm text-gray-900"
                              >
                                {tmpl.name}
                                <span className="block text-xs text-gray-500 mt-0.5">
                                  {tmpl.items.length} khâu
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-3">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                            Hoặc tạo checklist trống
                          </div>
                          <input
                            autoFocus
                            value={newChecklistTitle}
                            onChange={(e) => setNewChecklistTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateCheckList()}
                            placeholder={t("job_management.card.title")}
                            className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 outline-none focus:border-brand-400"
                          />
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              className="h-9 px-4 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm"
                              onClick={handleCreateCheckList}
                            >
                              {t("job_management.modal.add")}
                            </button>
                            <button
                              className="h-9 px-4 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm hover:bg-white"
                              onClick={() => {
                                setAddingChecklist(false);
                                setNewChecklistTitle("");
                                setShowCreateTemplateForm(false);
                              }}
                            >
                              {t("job_management.modal.cancel")}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {hasMembers && (
                      <div className="space-y-2">
                        <div className="text-gray-600 flex items-center gap-2">
                          <IoPersonAddOutline />
                          <span className="font-medium text-sm">
                            {t("job_management.card.members")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderMemberChips()}
                          <div className="relative">
                            <button
                              ref={actionMemRef}
                              type="button"
                              onClick={() => setMembersOpen(true)}
                              className="h-7 w-7 rounded-md bg-white hover:bg-white border border-gray-200 flex items-center justify-center"
                              title={t("job_management.card.add_member")}
                            >
                              <IoAdd className="text-gray-600" />
                            </button>
                            <MembersPopover
                              anchorEl={actionMemRef.current}
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
                        <div className="flex items-center gap-2 text-gray-600">
                          <IoPricetagOutline />
                          <span className="font-medium text-sm">
                            {t("job_management.board.color")}
                          </span>
                        </div>
                        <div className="flex relative items-center gap-2 flex-wrap">
                          {renderLabelChips()}
                          <button
                            type="button"
                            onClick={() => setLabelsOpen(true)}
                            className="h-7 w-7 rounded-md bg-white hover:bg-white border border-gray-200 flex items-center justify-center"
                            title={t("job_management.card.select_color")}
                          >
                            <IoAdd className="text-gray-600" />
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
                  {hasStart && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <IoTimeOutline />
                        <span className="font-medium text-sm">
                          Ngày bắt đầu
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center h-8 px-3 rounded-md bg-white text-gray-900 text-sm">
                          {formatStartBadge()}
                        </span>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setStartOpen(true)}
                            className="h-8 w-8 rounded-md bg-white hover:bg-white border border-gray-200 grid place-items-center"
                            title={t("job_management.card.edit_start_date")}
                          >
                            <IoAdd className="text-gray-600" />
                          </button>
                          <DuePopover
                            open={startOpen}
                            onClose={() => setStartOpen(false)}
                            value={card?.startAt ?? null}
                            onChange={async (nextIso) => {
                              await onSave?.({ startAt: nextIso });
                            }}
                            label={t("job_management.card.start_date")}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {hasDue && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <IoTimeOutline />
                        <span className="font-medium text-sm">
                          {t("job_management.card.due_date")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center h-8 px-3 rounded-md bg-white text-gray-900 text-sm">
                          {formatDueBadge()}
                        </span>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setDueOpen(true)}
                            className="h-8 w-8 rounded-md bg-white hover:bg-white border border-gray-200 grid place-items-center"
                            title={t("job_management.card.edit_due_date")}
                          >
                            <IoAdd className="text-gray-600" />
                          </button>
                          <DuePopover
                            open={dueOpen}
                            onClose={() => setDueOpen(false)}
                            value={dueAt ?? null}
                            onChange={async (nextIso) => {
                              await onSave?.({ dueAt: nextIso });
                            }}
                            label={t("job_management.card.due_date")}
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
                          <div className="flex items-center gap-2 text-gray-600">
                            <IoDocumentTextOutline />
                            <span className="font-medium text-sm">
                              {t("job_management.board.description")}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDescOpen((v) => !v)}
                            className="h-8 px-3 rounded-md bg-brand-600 text-white text-sm hover:bg-brand-500"
                          >
                            {descOpen
                              ? t("job_management.modal.close")
                              : hasDescription
                              ? t("job_management.modal.edit")
                              : t("job_management.modal.add")}
                          </button>
                        </div>
                        {!descOpen && hasDescription && (
                          <div
                            className="px-1 text-gray-900 prose prose-sm max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul,&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:pl-3"
                            dangerouslySetInnerHTML={{ __html: previewHtml }}
                          />
                        )}
                        {!descOpen && !hasDescription && (
                          <div className="w-full rounded-lg border border-gray-200 bg-white text-gray-600 px-4 py-3">
                            {t("job_management.modal.no_description")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <ChecklistSection
                      onDeleteChecklist={handleDeleteCheckList}
                      onRenameChecklist={handleUpdateChecklist}
                      onUpdateChecklist={handleUpdateChecklist}
                      checklists={checkList}
                      boardMembers={boardMembers}
                      onSave={onSave}
                      moveCheckList={moveCheckList}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-auto scrollbar-hide rounded-xl border border-dashed border-gray-200 p-3">
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2">
                    <IoChatbubbleOutline className="text-gray-600" />
                    <span className="font-medium text-gray-900">Nhận xét</span>
                  </div>
                </div>
                <form onSubmit={handleAddComment}>
                  <input
                    type="text"
                    value={addComment}
                    onChange={(e) => setAddComment(e.target.value)}
                    placeholder={t("job_management.card.write_comment")}
                    className="w-full h-10 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-text-muted px-4 outline-none focus:border-brand-400"
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
                                <span className="text-sm font-semibold text-gray-900">
                                  {e?.userId?.fullName || "Ẩn danh"}
                                </span>
                                {e?.createdAt && (
                                  <span className="text-xs text-gray-600">
                                    {fTime(e.createdAt)}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 w-full px-3 py-2 text-[15px] text-gray-900">
                                {e?.text}
                              </div>
                            </div>
                          </div>
                          <button
                            className="p-1 rounded-md text-gray-600 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                            aria-label={t("job_management.card.delete_comment")}
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
