"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { IoPersonAddOutline } from "react-icons/io5";
import MembersPopover from "../popovers/MembersPopover";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";

export default function AddItemRow({ onClose, onAdd, members = [] }) {
  const [text, setText] = useState("");
  const [assignee, setAssignee] = useState(null);
  const [memOpen, setMemOpen] = useState(false);
  const inputRef = useRef(null);
  const memberBtnRef = useRef(null);
  const t = useTranslations();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const reset = () => {
    setText("");
    setAssignee(null);
  };

  const submit = async () => {
    const trimmedText = text.trim();
    if (!trimmedText) return;
    await onAdd?.({ text: trimmedText, assignee: assignee || null, dueAt: null });
    reset();
    inputRef.current?.focus(); 
  };

  const handleClose = () => {
    onClose?.();
    reset();
  };

  const assigneeObj = useMemo(
    () => members.find((m) => (m.id ?? m._id) === assignee) || null,
    [members, assignee]
  );

  const applyAssignee = (nextIds) => {
    const first = nextIds?.[0] || null;
    setAssignee(first);
    setMemOpen(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="w-full rounded-xl bg-white px-3 py-2"
    >
      <div className="grid gap-2 items-center grid-cols-[auto,1fr,auto]">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("job_management.checklist.add_item")}
          className="min-w-0 w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
        />
        <div className="flex gap-2 justify-end items-center">
            <div className="relative">
                {assigneeObj ? (
                    <button
                    type="button"
                    ref={memberBtnRef}
                    onClick={() => setMemOpen((v) => !v)}
                    className="h-8 w-8 rounded-full bg-accent-500 text-white grid place-items-center font-semibold overflow-hidden shadow-sm hover:brightness-95"
                    title={assigneeObj.fullName ?? t("job_management.card.members")}
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
                    ref={memberBtnRef}
                    onClick={() => setMemOpen((v) => !v)}
                    className="h-9 w-9 grid place-items-center rounded-lg border border-gray-200 bg-white hover:bg-white"
                    title={t("job_management.checklist.assign")}
                    >
                    <IoPersonAddOutline className="text-gray-600" />
                    </button>
                )}
                 <MembersPopover
                    open={memOpen}
                    onClose={() => setMemOpen(false)}
                    members={members}
                    selectedIds={assignee ? [assignee] : []}
                    onChange={applyAssignee}
                    anchorEl={memberBtnRef.current}
                />
            </div>

          <button
            type="button"
            onClick={handleClose}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm hover:bg-white"
          >
            {t("job_management.modal.cancel")}
          </button>
          <button
            type="submit"
            disabled={!text.trim()}
            className="h-9 px-4 rounded-lg text-sm text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50"
          >
            {t("job_management.modal.add")}
          </button>
        </div>
      </div>
    </form>
  );
}
