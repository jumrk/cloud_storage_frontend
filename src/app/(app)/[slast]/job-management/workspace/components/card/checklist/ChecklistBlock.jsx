"use client";
import React, { useEffect, useRef, useState } from "react";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import ChecklistItemRow from "./ChecklistItemRow";
import toast from "react-hot-toast";
import checklistItemService from "../../../services/checkListItemService";
import AddItemRow from "../inputs/AddItemRow";
import ChecklistBlockSkeleton from "@/shared/skeletons/RowSkeleton";
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
  const checklistsId = data?._id;
  const total = checkListItems.length;
  const done = checkListItems.filter((i) => i.isDone).length;
  const percent = pct(done, total);
  const hasProgress = total > 0;
  const barClass = hasProgress
    ? percent < 30
      ? "bg-danger-500"
      : percent < 80
      ? "bg-warning-500"
      : "bg-success-500"
    : "bg-white";
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
  const handleCreateCheckListItem = async ({ text }) => {
    try {
      const res = await createItem(checklistsId, {
        text,
        assignee: null,
        dueAt: null,
      });
      const payload = res?.data;
      if (!payload?.success) {
        toast.error(
          payload?.messenger || t("job_management.errors.general_error")
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
      p.map((c) => (c._id === itemId ? { ...c, isDone: nextDone } : c))
    );
    try {
      setLoading(true);
      const res = await updateItem(itemId, { isDone: nextDone });
      const ok = res?.data?.success;
      if (!ok) {
        setCheckListItems(prev);
        toast.error(
          res?.data?.messenger || t("job_management.errors.general_error")
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
      prev.map((it) => (it._id === itemId ? { ...it, ...patch } : it))
    );
    try {
      const res = await updateItem(itemId, patch);
      const payload = res?.data;
      if (!payload?.success) {
        setCheckListItems(prev);
        toast.error(
          payload?.messenger || t("job_management.errors.update_failed")
        );
        return;
      }
      if (payload.data) {
        setCheckListItems((list) =>
          list.map((it) =>
            it._id === itemId ? { ...it, ...payload.data } : it
          )
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
          res?.data?.messenger || t("job_management.errors.general_error")
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
  if (loading) return <ChecklistBlockSkeleton />;
  return (
    <div className="p-3 border border-gray-200 border-dashed rounded-2xl w-full bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IoCheckmarkCircleOutline className="text-brand-500" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => onRename?.(data._id, title.trim())}
            onKeyDown={(e) =>
              e.key === "Enter" && onRename?.(data._id, title.trim())
            }
            className="bg-transparent outline-none text-base font-medium text-gray-900"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            className="h-8 px-3 rounded-md bg-danger-600 hover:bg-danger-500 text-white text-sm"
            onClick={() => onDelete?.(data._id)}
          >
            {t("job_management.card.delete")}
          </button>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-10 tabular-nums text-gray-600">{percent}%</span>
          <div
            className="h-1.5 flex-1 rounded-full overflow-hidden bg-white"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("job_management.checklist.checklist_progress")}
          >
            <div
              className={`h-full transition-[width] duration-300 ease-out ${barClass}`}
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
                            : it.assignee?.id || it.assignee?._id)
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
          <AddItemRow onClose={onClose} onAdd={handleCreateCheckListItem} />
        )}
      </div>
    </div>
  );
}
