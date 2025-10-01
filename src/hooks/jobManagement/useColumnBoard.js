import { useRef, useState } from "react";
import useDragScroll from "@/lib/hook/useDragScroll";
import toast from "react-hot-toast";
import listBoardService from "@/lib/services/jobManagement/listBoardService";

import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

export function useColumnBoard(boardId) {
  const dragRef = useDragScroll("x");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [list, setList] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const inputRef = useRef(null);

  const { createList, deleteList, getLists, updateList, reorderListsInBoard } =
    listBoardService();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleUpdateListBoard = async (listId, patch) => {
    if (!listId || !patch || typeof patch !== "object") return;

    const body = {
      ...(patch.title !== undefined
        ? { title: String(patch.title).trim() }
        : {}),
      ...(patch.pos !== undefined ? { pos: Number(patch.pos) } : {}),
    };

    let prevSnapshot = null;

    setList((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      prevSnapshot = arr;
      return arr
        .map((l) => (l._id === listId ? { ...l, ...body } : l))
        .sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0));
    });

    try {
      const res = await updateList(listId, body);
      const payload = res?.data;
      if (payload?.success === false) {
        setList(prevSnapshot);
        return toast.error(payload?.messenger || "Cập nhật không thành công");
      }
      const updated = payload?.data;
      if (updated && updated._id === listId) {
        setList((prev) =>
          prev
            .map((l) =>
              l._id === listId
                ? {
                    ...l,
                    title: updated.title ?? l.title,
                    pos: Number(updated.pos ?? l.pos),
                  }
                : l
            )
            .sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0))
        );
      }
    } catch (err) {
      setList(prevSnapshot);
      toast.error(err?.response?.data?.messenger || "Lỗi cập nhật");
    }
  };

  const handleDeleteListBoard = async (listId) => {
    try {
      const res = await deleteList(listId);
      const data = res.data;
      if (!data.success) return toast.error(data.messenger);
      toast.success("Xóa thành công");
      setList((prev) => prev.filter((l) => l._id !== listId));
    } catch {
      toast.error("Lỗi");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const name = title.trim();
    if (!name) return;
    try {
      const res = await createList(boardId, name);
      const data = res.data.data;
      setList((prev) => {
        const arr = Array.isArray(prev) ? prev.slice() : [];
        const next = [...arr, data].sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0));
        return next;
      });
      toast.success("Thêm thành công");
      setTitle("");
      setAdding(false);
    } catch (e2) {
      toast.error("Lỗi");
      console.error(e2);
    }
  };

  const cancel = () => {
    setTitle("");
    setAdding(false);
  };
  const fetchListBoard = async (boardId) => {
    if (!boardId) return;
    try {
      const res = await getLists(boardId);
      const payload = res?.data;
      const data = Array.isArray(payload?.data) ? payload.data : payload;

      const lists = (data || [])
        .map((l) => ({
          _id: String(l._id),
          boardId: String(l.boardId),
          title: l.title || "",
          pos: typeof l.pos === "number" ? l.pos : Number(l.pos) || 0,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt,
        }))
        .sort(
          (a, b) =>
            a.pos - b.pos || a.createdAt?.localeCompare?.(b.createdAt) || 0
        );

      setList(lists);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.messenger || "Lỗi tải danh sách");
    }
  };
  const onDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = list.findIndex((l) => l._id === active.id);
    const newIndex = list.findIndex((l) => l._id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const prevSnapshot = list;
    const next = arrayMove(list, oldIndex, newIndex).map((l, idx) => ({
      ...l,
      pos: (idx + 1) * 1000,
    }));
    setList(next);

    try {
      const updates = next.map((l) => ({ listId: l._id, pos: l.pos }));
      const res = await reorderListsInBoard(boardId, updates);
      const ok = res?.data?.success !== false;
      if (!ok) {
        setList(prevSnapshot);
        toast.error(res?.data?.messenger || "Không lưu được thứ tự");
      }
    } catch {
      setList(prevSnapshot);
      toast.error("Lỗi lưu thứ tự");
    }
  };
  const openAddTask = () => setOpenAdd(true);
  const closeAddTask = () => setOpenAdd(false);
  return {
    dragRef,
    adding,
    title,
    inputRef,
    sensors,
    list,
    setAdding,
    fetchListBoard,
    setTitle,
    handleUpdateListBoard,
    handleDeleteListBoard,
    submit,
    cancel,
    onDragEnd,
  };
}
