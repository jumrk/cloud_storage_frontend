"use client";
import React, { useEffect, useRef, useState } from "react";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import ChecklistItemRow from "./ChecklistItemRow";
import toast from "react-hot-toast";
import checklistItemService from "@/lib/services/jobManagement/checkListItemService";
import AddItemRow from "./AddItemRow";

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
  // đổi: thay vì onProgressChange, ta phát ra counts
  onCountsChange,
}) {
  const { getItemsByChecklist, createItem, deleteItem, updateItem } =
    checklistItemService();

  const [title, setTitle] = useState(data.title || "");
  const [checkListItems, setCheckListItems] = useState([]);
  const [openAddItem, setOpenAddItem] = useState(false);
  const checklistsId = data?._id;

  const total = checkListItems.length;
  const done = checkListItems.filter((i) => i.isDone).length;
  const percent = pct(done, total);

  const hasProgress = total > 0;
  const barColor = hasProgress
    ? percent < 30
      ? "#FF7979"
      : percent < 80
      ? "#FFA048"
      : "#22C55E"
    : "#94A3B8";
  const trackColor = "#E5E7EB";
  const fillStyle = { width: `${percent}%`, background: barColor };

  // chỉ gửi counts khi thay đổi thực sự
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
      const res = await getItemsByChecklist(checklistsId);
      const payload = res?.data;
      if (!payload?.success) {
        toast.error(payload?.messenger);
        return;
      }
      setCheckListItems(payload.data);
    } catch (error) {
      const msg = error?.response?.data?.messenger || "Lỗi";
      toast.error(msg);
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
        toast.error(payload?.messenger || "Lỗi không thêm được");
        return;
      }
      setCheckListItems((prev) => [...prev, payload.data]);
      toast("Thêm thành công");
    } catch (error) {
      const msg = error?.response?.data?.messenger || "Lỗi";
      toast.error(msg);
    }
  };

  const onToggleItem = async (itemId, nextDone) => {
    const prev = checkListItems;
    setCheckListItems((p) =>
      p.map((c) => (c._id === itemId ? { ...c, isDone: nextDone } : c))
    );
    try {
      const res = await updateItem(itemId, { isDone: nextDone });
      const ok = res?.data?.success;
      if (!ok) {
        setCheckListItems(prev);
        toast.error(res?.data?.messenger || "Không thể thay đổi");
        return;
      }
      toast.success("Cập nhật thành công");
    } catch (e) {
      setCheckListItems(prev);
      toast.error(e?.message || "Cập nhật thất bại");
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
        toast.error(payload?.messenger || "Không thể cập nhật");
        return;
      }
      if (payload.data) {
        setCheckListItems((list) =>
          list.map((it) =>
            it._id === itemId ? { ...it, ...payload.data } : it
          )
        );
      }
      toast.success("Cập nhật thành công");
    } catch (e) {
      setCheckListItems(prev);
      toast.error(e?.message || "Cập nhật thất bại");
    }
  };

  const onDeleteItem = async (itemId) => {
    const prev = checkListItems;
    setCheckListItems(prev.filter((it) => it._id !== itemId));
    try {
      const res = await deleteItem(itemId);
      const ok = res?.data?.success;
      if (!ok) throw new Error(res?.data?.messenger || "Không thể xóa");
      toast.success("Đã xóa");
    } catch (e) {
      setCheckListItems(prev);
      toast.error(e?.message || "Xóa thất bại");
    }
  };

  const onClose = () => setOpenAddItem(false);

  useEffect(() => {
    fetchChecklistItem();
  }, [data]);

  return (
    <div className="p-3 border border-black/30 border-dashed rounded-2xl w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IoCheckmarkCircleOutline />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => onRename?.(data._id, title.trim())}
            onKeyDown={(e) =>
              e.key === "Enter" && onRename?.(data._id, title.trim())
            }
            className="bg-transparent outline-none text-base font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            className="h-8 px-3 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm"
            onClick={() => onDelete?.(data._id)}
          >
            Xóa
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-10 tabular-nums">{percent}%</span>
          <div
            className="h-1.5 flex-1 rounded-full overflow-hidden"
            style={{ backgroundColor: trackColor }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Tiến độ checklist"
          >
            <div
              className="h-full transition-[width] duration-300 ease-out"
              style={fillStyle}
            />
          </div>
        </div>

        <div className="mt-2">
          {checkListItems.map((it) => (
            <div key={it._id} className="py-1">
              <ChecklistItemRow
                item={it}
                members={members}
                onToggle={onToggleItem}
                onUpdate={onUpdateItem}
                onDelete={onDeleteItem}
              />
              {it.dueAt || it.assignee ? (
                <div className="pl-6 text-xs text-neutral-400">
                  {it.assignee && (
                    <span className="mr-3">
                      Giao cho:{" "}
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
            className="h-8 px-3 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm"
            onClick={() => setOpenAddItem(true)}
          >
            Thêm mục
          </button>
        )}

        {openAddItem && (
          <AddItemRow onClose={onClose} onAdd={handleCreateCheckListItem} />
        )}
      </div>
    </div>
  );
}
