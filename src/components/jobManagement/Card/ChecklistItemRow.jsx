"use client";
import React, { useMemo, useState } from "react";
import {
  IoTrashOutline,
  IoTimeOutline,
  IoPersonAddOutline,
} from "react-icons/io5";
import DuePopover from "@/components/jobManagement/Card/DuePopover";
import MembersPopover from "@/components/jobManagement/Card/MembersPopover";

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
  onDelete,
}) {
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
    setAssignee(first);
    await onUpdate?.(item._id, { assignee: first || null });
  };

  return (
    <div className="flex items-center relative gap-2 py-1">
      {/* checkbox */}
      <input
        type="checkbox"
        className="h-4 w-4 accent-blue-600"
        checked={!!item.isDone}
        onChange={(e) => onToggle?.(item._id, e.target.checked)}
        title="Đánh dấu hoàn thành"
      />

      {/* text */}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitText}
        onKeyDown={(e) => e.key === "Enter" && commitText()}
        placeholder="Nhập nội dung…"
        className={`
          min-w-0 flex-1 h-9 rounded-lg border bg-white
          px-3 text-sm outline-none
          focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100
          ${item.isDone ? "line-through text-neutral-400" : "text-neutral-800"}
          border-neutral-300
        `}
        aria-label="Nội dung mục"
      />

      {/* DUE */}
      {dueAt ? (
        <button
          type="button"
          onClick={() => setDueOpen((v) => !v)}
          className="
                inline-flex items-center gap-1 h-8  rounded-full
                bg-amber-400/90 text-neutral-900 text-xs font-medium
                px-2.5 shadow-sm hover:brightness-95
              "
          title="Ngày hết hạn"
        >
          <IoTimeOutline className="opacity-90" />
          {fmtShortVN(dueAt)}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setDueOpen((v) => !v)}
          className="
                h-9 w-9 grid place-items-center rounded-lg border
                border-neutral-300 bg-white hover:bg-neutral-50
              "
          title="Thêm ngày"
          aria-label="Thêm ngày"
        >
          <IoTimeOutline className="text-neutral-700" />
        </button>
      )}

      <DuePopover
        open={dueOpen}
        onClose={() => setDueOpen(false)}
        value={dueAt}
        onChange={applyDue}
      />

      {/* MEMBER */}
      {assigneeObj ? (
        <button
          type="button"
          onClick={() => setMemOpen((v) => !v)}
          className="
                h-8 w-8 rounded-full bg-teal-500 text-white grid place-items-center
                font-semibold overflow-hidden shadow-sm hover:brightness-95
              "
          title={assigneeObj.fullName ?? "Thành viên"}
          aria-label="Chỉnh thành viên"
        >
          {assigneeObj.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={assigneeObj.avatar}
              alt=""
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
          className="
                h-9 w-9 grid place-items-center rounded-lg border
                border-neutral-300 bg-white hover:bg-neutral-50
              "
          title="Chỉ định"
          aria-label="Chỉ định"
        >
          <IoPersonAddOutline className="text-neutral-700" />
        </button>
      )}

      <MembersPopover
        open={memOpen}
        onClose={() => setMemOpen(false)}
        members={members}
        selectedIds={assignee ? [assignee] : []}
        onChange={applyAssignee}
      />

      {/* delete */}
      <button
        type="button"
        className="
          h-9 w-9 grid place-items-center rounded-lg
          text-neutral-600 hover:text-red-600
          hover:bg-red-50 active:bg-red-100
          transition-colors
        "
        onClick={() => onDelete?.(item._id)}
        title="Xóa mục"
        aria-label="Xóa mục"
      >
        <IoTrashOutline />
      </button>
    </div>
  );
}
