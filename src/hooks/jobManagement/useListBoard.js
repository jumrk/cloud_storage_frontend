"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import cardService from "@/lib/services/jobManagement/cardListService";
import checklistService from "@/lib/services/jobManagement/checkListService";

export function useListBoard({ id, title, handleUpdate }) {
  const svc = useMemo(() => cardService(), []);
  const { getCardsByList, createCard, updateCard, deleteCard } = svc;
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // modal: card đang mở
  const [activeCardId, setActiveCardId] = useState(null);
  const activeCard = cards.find((c) => c._id === activeCardId) || null;
  const openCard = (cid) => setActiveCardId(cid);
  const closeCard = () => setActiveCardId(null);

  // UI khác
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
  const refresh = async () => {
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
  };

  useEffect(() => {
    if (!id) return;
    if (process.env.NODE_ENV !== "production") {
      if (fetchedRef.current) return;
      fetchedRef.current = true;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
      const res = await deleteCard(cardId);
      const payload = res?.data;
      if (!payload?.success) {
        toast.error(payload?.messenger || "Lỗi khi xóa");
        return;
      }
      setCards((prev) => prev.filter((c) => String(c._id) !== String(cardId)));
      toast.success("Xóa thành công");
    } catch (error) {
      const msg = error?.response?.data?.messenger || "Lỗi";
      toast.error(msg);
    }
  };

  const submitAdd = async () => {
    const titleOnly = addTitle.trim();
    if (!titleOnly || adding) return;

    const tempId = "tmp_" + Date.now();
    const tempCard = normalizeCard({ _id: tempId, title: titleOnly });
    setCards((prev) => [tempCard, ...prev]);

    setAdding(true);
    try {
      const res = await createCard(id, titleOnly);
      const created = normalizeCard(res?.data?.data ?? res?.data ?? {});
      setCards((prev) =>
        prev.map((c) => (c._id === tempId ? (created?._id ? created : c) : c))
      );
      setAddTitle("");
      setAddOpen(false);
      toast.success("Tạo thẻ thành công");
    } catch {
      setCards((prev) => prev.filter((c) => c._id !== tempId));
      toast.error("Tạo thẻ thất bại");
    } finally {
      setAdding(false);
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

  return {
    cards,
    loading,
    adding,
    count: cards.length,
    activeCard,
    openCard,
    closeCard,
    patchCard,
    menuOpen,
    setMenuOpen,
    renameOpen,
    setRenameOpen,
    addOpen,
    setAddOpen,
    tempTitle,
    setTempTitle,
    saving,
    addTitle,
    setAddTitle,
    menuRef,
    renameInputRef,
    addInputRef,
    onSaveRename,
    submitAdd,
    refresh,
    handleDeleteCard,
  };
}
