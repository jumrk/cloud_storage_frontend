"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import cardService from "@/lib/services/jobManagement/cardListService";
import { arrayMove } from "@dnd-kit/sortable";

export function useListBoard({ id, title, handleUpdate }) {
  const svc = useMemo(() => cardService(), []);
  const {
    getCardsByList,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderCardsInList,
  } = svc;

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCardId, setActiveCardId] = useState(null);
  const activeCard = cards.find((c) => c._id === activeCardId) || null;
  const openCard = (cid) => setActiveCardId(cid);
  const closeCard = () => setActiveCardId(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [saving, setSaving] = useState(false);
  const [addTitle, setAddTitle] = useState("");

  const menuRef = useRef(null);
  const renameInputRef = useRef(null);
  const addInputRef = useRef(null);

  useEffect(() => setTempTitle(title), [title]);

  const extractList = (res) =>
    res?.data?.data ?? res?.data?.cards ?? res?.data ?? [];

  const normalizeCard = (raw) => {
    const descText = raw?.descText || "";
    const descHtml = raw?.descHtmlCached || "";
    return {
      ...raw,
      dueDate: raw?.dueAt ?? null,
      desc: descText || (descHtml ? "" : ""),
      labels: Array.isArray(raw?.labels) ? raw.labels : [],
      members: Array.isArray(raw?.members) ? raw.members : [],
      progress: raw?.progress ?? null,
    };
  };

  const fetchedRef = useRef(false);
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCardsByList(id);
      const list = extractList(res).map(normalizeCard);
      setCards(list);
    } catch {
      toast.error("Không tải được danh sách thẻ");
    } finally {
      setLoading(false);
    }
  }, [getCardsByList, id]);

  useEffect(() => {
    if (!id) return;
    if (process.env.NODE_ENV !== "production") {
      if (fetchedRef.current) return;
      fetchedRef.current = true;
    }
    refresh();
  }, [id, refresh]);

  const onSaveRename = async () => {
    const next = String(tempTitle || "").trim();
    if (!next || next === title) return setRenameOpen(false);
    try {
      setSaving(true);
      await handleUpdate?.(id, { title: next });
      setRenameOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      setLoading(true);
      const res = await deleteCard(cardId);
      const payload = res?.data;
      if (!payload?.success) {
        toast.error(payload?.messenger || "Lỗi khi xóa");
        return;
      }
      setCards((prev) => prev.filter((c) => String(c._id) !== String(cardId)));
      setLoading(false);
      toast.success("Xóa thành công");
    } catch (error) {
      const msg = error?.response?.data?.messenger || "Lỗi";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const submitAdd = async () => {
    const titleOnly = addTitle.trim();
    if (!titleOnly) return;

    const tempId = "tmp_" + Date.now();
    const tempCard = normalizeCard({ _id: tempId, title: titleOnly });
    setCards((prev) => [...prev, tempCard]);

    try {
      setLoading(true);
      const res = await createCard(id, titleOnly);
      const created = normalizeCard(res?.data?.data ?? res?.data ?? {});
      setCards((prev) =>
        prev.map((c) => (c._id === tempId ? (created?._id ? created : c) : c))
      );
      setAddTitle("");
      setAddOpen(false);
      setLoading(false);
      toast.success("Tạo thẻ thành công");
    } catch (error) {
      setCards((prev) => prev.filter((c) => c._id !== tempId));
      const msg = error?.response?.data?.messenger || "Lỗi";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const patchCard = async (cardId, patch) => {
    const idx = cards.findIndex((c) => c._id === cardId);
    if (idx === -1) return;
    const prev = cards[idx];

    const backendPatch = { ...patch };
    if ("dueDate" in backendPatch && !("dueAt" in backendPatch)) {
      backendPatch.dueAt = backendPatch.dueDate;
      delete backendPatch.dueDate;
    }

    const merged = normalizeCard({ ...prev, ...backendPatch });
    setCards((arr) => arr.map((c) => (c._id === cardId ? merged : c)));

    try {
      await updateCard(cardId, backendPatch);
    } catch (e) {
      setCards((arr) => arr.map((c) => (c._id === cardId ? prev : c)));
      toast.error("Cập nhật thất bại");
      throw e;
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = cards.map((c) => c._id);
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const prev = cards;
    const next = arrayMove(prev, oldIndex, newIndex);
    setCards(next);

    try {
      await moveCard(active.id, { toListId: id, toPos: newIndex });
      toast.success("Sắp xếp thành công");
    } catch {
      setCards(prev);
      toast.error("Sắp xếp thất bại");
    }
  };

  const onDragOverNative = (e) => e.preventDefault();

  const onDropNative = async (e) => {
    const cardId = e.dataTransfer.getData("d2m.cardId");
    const fromListId = e.dataTransfer.getData("d2m.fromListId");
    if (!cardId || !fromListId) return;

    if (String(fromListId) === String(id)) return;

    const toPos = cards.length;

    try {
      window?.dispatchEvent?.(
        new CustomEvent("d2m:card-moved", {
          detail: { cardId, fromListId, toListId: id, toPos },
        })
      );
    } catch {}

    const destIds = cards.map((c) => c._id);
    if (!destIds.includes(cardId)) {
      const safePos = Math.max(0, Math.min(toPos, destIds.length));
      destIds.splice(safePos, 0, cardId);
      setCards((prev) => {
        if (prev.some((c) => String(c._id) === String(cardId))) return prev;
        const clone = [...prev];
        clone.splice(
          safePos,
          0,
          normalizeCard({ _id: cardId, title: "Đang chuyển…" })
        );
        return clone;
      });
    }

    try {
      await reorderCardsInList(id, destIds);
      await refresh();
      toast.success("Đã di chuyển thẻ");
    } catch {
      setCards((prev) => prev.filter((c) => String(c._id) !== String(cardId)));
      toast.error("Di chuyển thất bại");
    }
  };

  useEffect(() => {
    const onMoved = async (ev) => {
      const { cardId, fromListId, toListId, toPos } = ev?.detail || {};
      if (!cardId) return;

      if (String(fromListId) === String(id)) {
        const next = cards.filter((c) => String(c._id) !== String(cardId));
        setCards(next);
        const nextIds = next.map((c) => c._id);
        try {
          await reorderCardsInList(id, nextIds);
        } catch {
          await refresh();
        }
      }

      if (String(toListId) === String(id)) {
        setCards((prev) => {
          if (prev.find((c) => String(c._id) === String(cardId))) return prev;
          const clone = [...prev];
          const safePos = Math.max(
            0,
            Math.min(toPos ?? clone.length, clone.length)
          );
          clone.splice(
            safePos,
            0,
            normalizeCard({ _id: cardId, title: "Đang chuyển…" })
          );
          return clone;
        });
      }
    };

    window.addEventListener("d2m:card-moved", onMoved);
    return () => window.removeEventListener("d2m:card-moved", onMoved);
  }, [cards, id, reorderCardsInList, refresh]);

  return {
    cards,
    loading,
    count: cards.length,
    activeCard,
    menuOpen,
    renameOpen,
    addOpen,
    tempTitle,
    saving,
    addTitle,
    menuRef,
    renameInputRef,
    addInputRef,
    openCard,
    closeCard,
    patchCard,
    setMenuOpen,
    setRenameOpen,
    setAddOpen,
    setTempTitle,
    setAddTitle,
    onSaveRename,
    submitAdd,
    refresh,
    handleDeleteCard,
    handleDragEnd,
    onDragOverNative,
    onDropNative,
    setCards,
  };
}
