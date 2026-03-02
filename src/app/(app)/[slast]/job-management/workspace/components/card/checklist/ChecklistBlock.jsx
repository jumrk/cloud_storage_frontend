"use client";
import React, { useEffect, useRef, useState } from "react";
import { IoCheckmarkCircleOutline, IoPersonAddOutline, IoTrashOutline } from "react-icons/io5";
import ChecklistItemRow from "./ChecklistItemRow";
import MembersPopover from "../popovers/MembersPopover";
import toast from "react-hot-toast";
import checklistItemService from "../../../services/checkListItemService";
import AddItemRow from "../inputs/AddItemRow";
import ChecklistBlockSkeleton from "@/shared/skeletons/RowSkeleton";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";
import { useTranslations } from "next-intl";
function pct(done, total) {
  if (!total) return 0;
  const v = Math.round((done / total) * 100);
  return Math.min(100, Math.max(0, v));
}
function formatDate(dt) {
  try {
    if (!dt) return "";
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "";
  }
}
export default function ChecklistBlock({
  data,
  members,
  onRename,
  onUpdate,
  onDelete,
  onCountsChange,
}) {
  const { getItemsByChecklist, createItem, deleteItem, updateItem } =
    checklistItemService();
  const t = useTranslations();
  const [title, setTitle] = useState(data.title || "");
  const [checkListItems, setCheckListItems] = useState([]);
  const [openAddItem, setOpenAddItem] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const assigneeBtnRef = useRef(null);
  const checklistsId = data?._id;
  const isDone = !!data?.isDone;
  const assigneeId = data?.assignee ? String(data.assignee._id ?? data.assignee.id ?? data.assignee) : null;
  const assigneeUser = assigneeId && typeof data?.assignee === "object" ? data.assignee : members?.find((m) => String(m.id ?? m._id) === assigneeId);
  const total = checkListItems.length;
  const done = checkListItems.filter((i) => i.isDone).length;
  const percentFromItems = pct(done, total);
  const percent = isDone ? 100 : percentFromItems;
  const hasProgress = total > 0 || isDone;
  const barClass = isDone
    ? "bg-success-500"
    : hasProgress
      ? percentFromItems < 30
        ? "bg-danger-500"
        : percentFromItems < 80
          ? "bg-warning-500"
          : "bg-success-500"
      : "bg-gray-200";
  const lastSentRef = useRef({ done, total });
  useEffect(() => {
    const last = lastSentRef.current;
    if (last.done !== done || last.total !== total) {
      onCountsChange?.(data._id, { done, total });
      lastSentRef.current = { done, total };
    }
  }, [done, total, data._id, onCountsChange]);
  const fetchChecklistItem = async () => {
    try {
      setLoading(true);
      const res = await getItemsByChecklist(checklistsId);
      const payload = res?.data;
      if (!payload?.success) {
        toast.error(payload?.messenger);
        return;
      }
      setCheckListItems(payload.data);
      setLoading(false);
    } catch (error) {
      const msg =
        error?.response?.data?.messenger ||
        t("job_management.errors.general_error");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };
  const handleCreateCheckListItem = async ({ text, assignee }) => {
    try {
      const res = await createItem(checklistsId, {
        text,
        assignee: assignee || null,
        dueAt: null,
      });
      const payload = res?.data;
      if (!payload?.success) {
        toast.error(
          payload?.messenger || t("job_management.errors.general_error"),
        );
        return;
      }
      setCheckListItems((prev) => [...prev, payload.data]);
      toast.success(t("job_management.success.add_success"));
    } catch (error) {
      const msg =
        error?.response?.data?.messenger ||
        t("job_management.errors.general_error");
      toast.error(msg);
    }
  };
  const onToggleItem = async (itemId, nextDone) => {
    const prev = checkListItems;
    setCheckListItems((p) =>
      p.map((c) => (c._id === itemId ? { ...c, isDone: nextDone } : c)),
    );
    try {
      setLoading(true);
      const res = await updateItem(itemId, { isDone: nextDone });
      const ok = res?.data?.success;
      if (!ok) {
        setCheckListItems(prev);
        toast.error(
          res?.data?.messenger || t("job_management.errors.general_error"),
        );
        return;
      }
      setLoading(false);
      toast.success(t("job_management.success.update_success"));
    } catch (e) {
      setCheckListItems(prev);
      const msg =
        error?.response?.data?.messenger ||
        t("job_management.errors.general_error");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };
  const onUpdateItem = async (itemId, patch) => {
    const prev = checkListItems;
    setCheckListItems(
      prev.map((it) => (it._id === itemId ? { ...it, ...patch } : it)),
    );
    try {
      const res = await updateItem(itemId, patch);
      const payload = res?.data;
      if (!payload?.success) {
        setCheckListItems(prev);
        toast.error(
          payload?.messenger || t("job_management.errors.update_failed"),
        );
        return;
      }
      if (payload.data) {
        setCheckListItems((list) =>
          list.map((it) =>
            it._id === itemId ? { ...it, ...payload.data } : it,
          ),
        );
      }
      toast.success(t("job_management.success.update_success"));
    } catch (error) {
      const msg =
        error?.response?.data?.messenger ||
        t("job_management.errors.general_error");
      setCheckListItems(prev);
      toast.error(msg);
    }
  };
  const onDeleteItem = async (itemId) => {
    const prev = checkListItems;
    setCheckListItems(prev.filter((it) => it._id !== itemId));
    try {
      const res = await deleteItem(itemId);
      const ok = res?.data?.success;
      if (!ok)
        throw new Error(
          res?.data?.messenger || t("job_management.errors.general_error"),
        );
      toast.success(t("job_management.success.delete_item_success"));
    } catch (e) {
      const msg =
        e?.response?.data?.messenger ||
        t("job_management.errors.general_error");
      setCheckListItems(prev);
      toast.error(msg);
    }
  };
  const onClose = () => setOpenAddItem(false);
  useEffect(() => {
    fetchChecklistItem();
  }, [data]);
  useEffect(() => {
    setTitle(data?.title ?? "");
  }, [data?.title]);

  const handleToggleDone = () => {
    onUpdate?.(data._id, { isDone: !isDone });
  };
  const handleAssigneeChange = (nextIds) => {
    const next = Array.isArray(nextIds) && nextIds.length ? String(nextIds[0]) : null;
    onUpdate?.(data._id, { assignee: next });
    setAssigneeOpen(false);
  };

  if (loading) return <ChecklistBlockSkeleton />;
  return (
    <div className="p-3 border border-gray-200 border-dashed rounded-2xl w-full bg-white">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <IoCheckmarkCircleOutline className="shrink-0 w-5 h-5 text-brand-500" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => onUpdate?.(data._id, { title: title.trim() })}
            onKeyDown={(e) =>
              e.key === "Enter" && onUpdate?.(data._id, { title: title.trim() })
            }
            className={`bg-transparent outline-none text-base font-medium min-w-0 flex-1 ${isDone ? "line-through text-gray-500" : "text-gray-900"}`}
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleToggleDone}
            className="h-8 w-8 rounded-md flex items-center justify-center border border-gray-200 hover:border-brand-500 hover:bg-brand-50 text-gray-600 hover:text-brand-600 transition-colors"
            aria-label={t("job_management.checklist.mark_complete")}
            title={isDone ? t("job_management.checklist.mark_incomplete") : t("job_management.checklist.mark_complete")}
          >
            {isDone ? (
              <svg className="w-4 h-4 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <span className="w-4 h-4 rounded border-2 border-gray-300" />
            )}
          </button>
          <div className="relative">
            <button
              ref={assigneeBtnRef}
              type="button"
              onClick={() => setAssigneeOpen((v) => !v)}
              className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600"
              title={assigneeUser?.fullName || t("job_management.card.add_member")}
            >
              {assigneeUser?.avatar ? (
                <img src={getAvatarUrl(assigneeUser.avatar)} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : assigneeUser?.fullName ? (
                <span className="text-xs font-medium text-gray-700">
                  {(assigneeUser.fullName || "").slice(0, 1).toUpperCase()}
                </span>
              ) : (
                <IoPersonAddOutline className="w-4 h-4" />
              )}
            </button>
            <MembersPopover
              anchorEl={assigneeBtnRef.current}
              open={assigneeOpen}
              onClose={() => setAssigneeOpen(false)}
              members={members || []}
              selectedIds={assigneeId ? [assigneeId] : []}
              onChange={handleAssigneeChange}
            />
          </div>
          <button
            type="button"
            onClick={() => onDelete?.(data._id)}
            className="h-8 w-8 rounded-md flex items-center justify-center text-gray-500 hover:text-danger-600 hover:bg-danger-50 transition-colors"
            aria-label={t("job_management.card.delete")}
            title={t("job_management.card.delete")}
          >
            <IoTrashOutline className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="space-y-1 mt-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-10 tabular-nums text-gray-600">{percent}%</span>
          <div
            className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-200"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("job_management.checklist.checklist_progress")}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-300 ease-out ${barClass}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <div className="mt-2">
          {checkListItems.map((it) => (
            <div key={it._id} className="py-1">
              <ChecklistItemRow
                item={it}
                members={members}
                setLoading={setLoading}
                onToggle={onToggleItem}
                onUpdate={onUpdateItem}
                onDelete={onDeleteItem}
              />
              {it.dueAt || it.assignee ? (
                <div className="pl-6 text-xs text-gray-600">
                  {it.assignee && (
                    <span className="mr-3">
                      Giao cho:{""}
                      {members.find(
                        (m) =>
                          m.id ===
                          (typeof it.assignee === "string"
                            ? it.assignee
                            : it.assignee?.id || it.assignee?._id),
                      )?.fullName || "—"}
                    </span>
                  )}
                  {it.dueAt && <span>Hết hạn: {formatDate(it.dueAt)}</span>}
                </div>
              ) : null}
            </div>
          ))}
        </div>
        {!openAddItem && (
          <button
            className="h-8 px-3 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-sm"
            onClick={() => setOpenAddItem(true)}
          >
            {t("job_management.checklist.add_item")}
          </button>
        )}
        {openAddItem && (
          <AddItemRow
            onClose={onClose}
            onAdd={handleCreateCheckListItem}
            members={members}
          />
        )}
      </div>
    </div>
  );
}
