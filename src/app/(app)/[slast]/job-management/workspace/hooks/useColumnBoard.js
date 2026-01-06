import { useCallback, useMemo, useRef, useState } from "react";
import useDragScroll from "@/shared/hooks/useDragScroll";
import toast from "react-hot-toast";
import listBoardService from "../services/listBoardService";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import cardService from "../services/cardListService";
import { useBoardDnd } from "../components/board/context/BoardDndContext";
import { useTranslations } from "next-intl";

export function useColumnBoard(boardId) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);
  const [draggingType, setDraggingType] = useState(null);
  const dragRef = useDragScroll("x", { disabled: draggingType === "card" });
  const { getListApi } = useBoardDnd();
  const t = useTranslations();

  const onDragStart = ({ active }) => {
    setDraggingType(active?.data?.current?.type || "unknown");
  };
  const onDragCancel = () => setDraggingType(null);

  const listService = useMemo(() => listBoardService(), []);
  const { createList, deleteList, getLists, updateList, reorderListsInBoard } =
    listService;

  const cardSvc = useMemo(() => cardService(), []);
  const { moveCard } = cardSvc;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
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
        return toast.error(payload?.messenger || t("job_management.errors.update_failed_short"));
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
      toast.error(err?.response?.data?.messenger || t("job_management.errors.update_error"));
    }
  };

  const handleDeleteListBoard = async (listId) => {
    try {
      const res = await deleteList(listId);
      const data = res.data;
      if (!data.success) return toast.error(data.messenger);
      toast.success(t("job_management.success.delete_success"));
      setList((prev) => prev.filter((l) => l._id !== listId));
    } catch {
      toast.error(t("job_management.errors.general_error"));
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
      toast.success(t("job_management.success.add_success"));
      setTitle("");
      setAdding(false);
    } catch (e2) {
      toast.error(t("job_management.errors.general_error"));
      console.error(e2);
    }
  };

  const cancel = () => {
    setTitle("");
    setAdding(false);
  };
  const fetchListBoard = useCallback(async () => {
    if (!boardId) {
      setLoading(false);
      return;
    }
    setLoading(true);
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
      toast.error(err?.response?.data?.messenger || t("job_management.errors.load_list_error_short"));
    } finally {
      setLoading(false);
    }
  }, [boardId, getLists]);
  const onDragEnd = async ({ active, over }) => {
    try {
      if (!over) return;

      const S = (v) => String(v);
      const aType = active?.data?.current?.type;
      const oType = over?.data?.current?.type;

      // --- Kéo LISTBOARD (reorder list ngang) ---
      if (aType === "list" && oType === "list") {
        if (S(active.id) === S(over.id)) return;

        const oldIndex = list.findIndex((l) => S(l._id) === S(active.id));
        const newIndex = list.findIndex((l) => S(l._id) === S(over.id));
        if (oldIndex < 0 || newIndex < 0) return;

        const prevSnapshot = list.map((l) => ({ ...l }));
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
            setList(() => prevSnapshot);
            toast.error(res?.data?.messenger || t("job_management.errors.save_order_error"));
          }
        } catch {
          setList(() => prevSnapshot);
          toast.error(t("job_management.errors.save_order_failed"));
        }
        return;
      }

      // --- Kéo CARD ---
      if (aType === "card") {
        const fromListId = active?.data?.current?.listId;
        let toListId = null;
        let toPos = 0;

        if (oType === "card") {
          toListId = over?.data?.current?.listId;
          toPos = over?.data?.current?.sortable?.index ?? 0;
        } else if (oType === "list") {
          toListId = over?.data?.current?.listId;
          toPos = over?.data?.current?.itemsCount ?? 0;
        } else {
          const sid = S(over.id || "");
          if (sid.startsWith("list-slot-")) {
            toListId = sid.replace("list-slot-", "");
            toPos = 999999;
          }
        }

        if (!fromListId || !toListId) return;

        const fromKey = S(fromListId);
        const toKey = S(toListId);
        const cardId = S(active.id);

        if (fromKey === toKey) {
          const api = getListApi(fromKey);
          if (api?.setCards) {
            const fromIdx = active?.data?.current?.sortable?.index ?? -1;
            const toIdx =
              oType === "card"
                ? over?.data?.current?.sortable?.index ?? 0
                : over?.data?.current?.itemsCount ?? 0;

            api.setCards((prev) => {
              const oldIndex =
                fromIdx >= 0
                  ? fromIdx
                  : prev.findIndex((c) => S(c._id) === cardId);
              const newIndex = Math.max(0, Math.min(toIdx, prev.length - 1));
              return arrayMove(prev, oldIndex, newIndex);
            });
          }

          try {
            await moveCard(cardId, { toListId: toKey, toPos });
          } catch {
            getListApi(fromKey)?.refetchCards();
            toast.error(t("job_management.errors.move_card_error"));
          }
          return;
        }

        const fromApi = getListApi(fromKey);
        const toApi = getListApi(toKey);

        if (fromApi?.setCards && toApi?.setCards) {
          let moved = null;

          fromApi.setCards((prev) => {
            moved = prev.find((c) => S(c._id) === cardId) || null;
            return prev.filter((c) => S(c._id) !== cardId);
          });

          toApi.setCards((prev) => {
            const arr = [...(prev || [])];
            const pos = Math.max(0, Math.min(toPos, arr.length));
            if (moved) arr.splice(pos, 0, moved);
            return arr;
          });

          try {
            await moveCard(cardId, { toListId: toKey, toPos });
          } catch {
            fromApi.refetchCards?.();
            toApi.refetchCards?.();
            toast.error(t("job_management.errors.move_card_error"));
          }
        } else {
          try {
            await moveCard(cardId, { toListId: toKey, toPos });
            fromApi?.refetchCards?.();
            toApi?.refetchCards?.();
          } catch {
            toast.error(t("job_management.errors.move_card_error"));
          }
        }
        return;
      }
    } finally {
      setDraggingType(null);
    }
  };

  return {
    dragRef,
    adding,
    title,
    inputRef,
    sensors,
    list,
    loading,
    setAdding,
    fetchListBoard,
    setTitle,
    handleUpdateListBoard,
    handleDeleteListBoard,
    submit,
    cancel,
    onDragEnd,
    onDragStart,
    onDragCancel,
    setDraggingType,
  };
}
