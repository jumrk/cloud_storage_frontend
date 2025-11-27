"use client";
import React, { useMemo, useState } from "react";
import {
  IoTrashOutline,
  IoTimeOutline,
  IoPersonAddOutline,
} from "react-icons/io5";
import DuePopover from "../popovers/DuePopover";
import MembersPopover from "../popovers/MembersPopover";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";

const fmtShortVN = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  return `${day} thg ${month}`;
};

export default function ChecklistItemRow({
  item,
  members = [],
  onToggle,
  onUpdate,
  setLoading,
  onDelete,
}) {
  const t = useTranslations();
  const [text, setText] = useState(item.text || "");
  const [assignee, setAssignee] = useState(
    typeof item.assignee === "string"
      ? item.assignee
      : item.assignee?.id || item.assignee?._id || ""
  );
  const [dueAt, setDueAt] = useState(item.dueAt || null);

  const [dueOpen, setDueOpen] = useState(false);
  const [memOpen, setMemOpen] = useState(false);

  const assigneeObj = useMemo(
    () => members.find((m) => (m.id ?? m._id) === assignee) || null,
    [members, assignee]
  );

  const commitText = async () => {
    const patch = { text: text.trim() };
    await onUpdate?.(item._id, patch);
  };

  const applyDue = async (nextIso) => {
    setDueAt(nextIso);
    await onUpdate?.(item._id, { dueAt: nextIso });
  };

  const applyAssignee = async (nextIds) => {
    const first = nextIds?.[0] || "";
    try {
      setLoading(true);
      setAssignee(first);
      await onUpdate?.(item._id, { assignee: first || null });
      setLoading(false);
    } catch (error) {
      toast.error(t("job_management.errors.general_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center relative gap-2 py-1">
      <input
        type="checkbox"
        className="h-4 w-4 accent-brand-600"
        checked={!!item.isDone}
        onChange={(e) => onToggle?.(item._id, e.target.checked)}
        title={t("job_management.checklist.mark_complete")}
      />

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitText}
        onKeyDown={(e) => e.key === "Enter" && commitText()}
        placeholder={t("job_management.checklist.item_content")}
        className={`
          min-w-0 flex-1 h-9 rounded-lg border bg-white
          px-3 text-sm outline-none
          focus:border-brand-300 focus:ring-4 focus:ring-brand-100
          ${item.isDone ? "line-through text-text-muted" : "text-text-strong"}
          border-border
        `}
        aria-label={t("job_management.checklist.item_content_label")}
      />

      {dueAt ? (
        <button
          type="button"
          onClick={() => setDueOpen((v) => !v)}
          className="inline-flex items-center gap-1 h-8 rounded-full bg-warning-400/90 text-text-strong text-xs font-medium px-2.5 shadow-sm hover:brightness-95"
          title={t("job_management.checklist.due_date")}
        >
          <IoTimeOutline className="opacity-90" />
          {fmtShortVN(dueAt)}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setDueOpen((v) => !v)}
          className="h-9 w-9 grid place-items-center rounded-lg border border-border bg-white hover:bg-surface-50"
          title={t("job_management.checklist.add_date")}
          aria-label={t("job_management.checklist.add_date")}
        >
          <IoTimeOutline className="text-text-muted" />
        </button>
      )}

      <DuePopover
        open={dueOpen}
        onClose={() => setDueOpen(false)}
        value={dueAt}
        onChange={applyDue}
      />

      {assigneeObj ? (
        <button
          type="button"
          onClick={() => setMemOpen((v) => !v)}
          className="h-8 w-8 rounded-full bg-accent-500 text-white grid place-items-center font-semibold overflow-hidden shadow-sm hover:brightness-95"
          title={assigneeObj.fullName ?? t("job_management.card.members")}
          aria-label={t("job_management.checklist.edit_member")}
        >
          {assigneeObj.avatar ? (
            <img
              src={getAvatarUrl(assigneeObj.avatar)}
              alt={assigneeObj.fullName || "avatar"}
              className="h-full w-full object-cover"
            />
          ) : (
            (assigneeObj.fullName ?? "U").slice(0, 1).toUpperCase()
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setMemOpen((v) => !v)}
          className="h-9 w-9 grid place-items-center rounded-lg border border-border bg-white hover:bg-surface-50"
          title={t("job_management.checklist.assign")}
          aria-label={t("job_management.checklist.assign")}
        >
          <IoPersonAddOutline className="text-text-muted" />
        </button>
      )}

      <MembersPopover
        open={memOpen}
        onClose={() => setMemOpen(false)}
        members={members}
        selectedIds={assignee ? [assignee] : []}
        onChange={applyAssignee}
      />

      <button
        type="button"
        className="h-9 w-9 grid place-items-center rounded-lg text-text-muted hover:text-danger-600 hover:bg-danger-50 active:bg-danger-100 transition-colors"
        onClick={() => onDelete?.(item._id)}
        title={t("job_management.checklist.delete_item")}
        aria-label={t("job_management.checklist.delete_item")}
      >
        <IoTrashOutline />
      </button>
    </div>
  );
}
