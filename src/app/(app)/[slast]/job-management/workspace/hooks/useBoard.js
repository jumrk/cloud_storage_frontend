"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import boardService from "../services/boardService";
import { useTranslations } from "next-intl";

export default function useBoard() {
  const router = useRouter();
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [boards, setBoards] = useState([]);
  const [guestBoard, setGuestBoard] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [pinnedIds, setPinnedIds] = useState(new Set());
  const t = useTranslations();
  const {
    getBoard,
    postBoard,
    deleteBoard,
    getGuestBoard,
    getPinnedBoards,
    pinBoard: pinBoardApi,
    unpinBoard: unpinBoardApi,
  } = boardService();

  const fetchBoards = async () => {
    try {
      setLoading(true);
      setErr("");
      const r = await getBoard();
      const payload = r?.data ?? r;
      setBoards(payload?.data || []);
    } catch (error) {
      const msg = error?.response?.data.messenger;
      toast.error(msg || t("job_management.errors.general_error"));
    } finally {
      setLoading(false);
    }
  };

  const fetchGuestBoads = async () => {
    try {
      setLoading(true);
      const res = await getGuestBoard();
      const payload = res.data;
      if (!payload.success) {
        toast.error(payload.messenger || t("job_management.errors.load_list_error_short"));
        return;
      }
      const result = payload.data;
      setGuestBoard(result);
      setLoading(false);
    } catch (error) {
      const msg = error?.response?.data.messenger;
      toast.error(msg || t("job_management.errors.general_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (board) => {
    setBoards((prev) => [board, ...prev]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErr(t("job_management.errors.enter_board_title"));
      return;
    }
    try {
      setLoading(true);
      setErr("");
      const res = await postBoard(title);
      if (!res.data.success) {
        toast.error(res.data.messenger || t("job_management.errors.create_board_failed"));
        return;
      }
      toast.success(t("job_management.success.create_success"));
      handleCreated(res.data.data);
      setTitle("");
      setOpen(false);
    } catch (error) {
      const msg = error?.response?.data.messenger;
      toast.error(msg || t("job_management.errors.general_error"));
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (boardId) => {
    try {
      setLoading(true);
      const res = await deleteBoard(boardId);
      const data = res.data;
      if (!data.success) {
        toast.error(data.message || t("job_management.errors.cannot_delete_board"));
        return;
      }
      setBoards((prev) => prev.filter((b) => b._id !== boardId));
      toast.success(t("job_management.success.delete_success"));
    } catch (error) {
      const msg = error?.response?.data.messenger;
      toast.error(msg || t("job_management.errors.general_error"));
    } finally {
      setLoading(false);
    }
  };

  const getBoardOwner = (b = {}) => {
    if (b?.createdBy && typeof b.createdBy === "object") return b.createdBy;
    if (Array.isArray(b?.members)) {
      const owner =
        b.members.find((m) => m?.isOwner || m?.role === "owner") || b.members[0];
      if (owner && typeof owner === "object") return owner;
    }
    if (b?.members && typeof b.members === "object") return b.members;
    return null;
  };

  const createdByName = (b) => {
    const owner = getBoardOwner(b);
    if (owner?.fullName) return owner.fullName;
    if (owner?.name) return owner.name;
    if (owner?.email) return owner.email.split("@")[0];
    return t("job_management.errors.guest");
  };

  const createdByAvatar = (b) => {
    const owner = getBoardOwner(b);
    return owner?.avatar || "";
  };

  const fetchPinnedBoards = async () => {
    try {
      const res = await getPinnedBoards();
      const payload = res?.data;
      if (payload?.success === false) {
        toast.error(payload?.messenger || t("job_management.errors.cannot_load_pinned"));
        return;
      }
      const ids =
        (payload?.data || [])
          .map((item) => String(item?.board?._id || item?.boardId))
          .filter(Boolean) || [];
      setPinnedIds(new Set(ids));
    } catch (error) {
      const msg = error?.response?.data?.messenger;
      toast.error(msg || "Không tải được danh sách ghim");
    }
  };

  const isBoardPinned = (boardId) => pinnedIds.has(String(boardId));

  const pinBoard = async (boardId) => {
    try {
      await pinBoardApi(boardId);
      setPinnedIds((prev) => {
        const next = new Set(prev);
        next.add(String(boardId));
        return next;
      });
      toast.success(t("job_management.success.pin_success"));
    } catch (error) {
      const msg = error?.response?.data?.messenger;
      toast.error(msg || t("job_management.errors.cannot_pin"));
    }
  };

  const unpinBoard = async (boardId) => {
    try {
      await unpinBoardApi(boardId);
      setPinnedIds((prev) => {
        const next = new Set(prev);
        next.delete(String(boardId));
        return next;
      });
      toast.success(t("job_management.success.unpin_success"));
    } catch (error) {
      const msg = error?.response?.data?.messenger;
      toast.error(msg || t("job_management.errors.cannot_unpin"));
    }
  };

  const togglePinBoard = async (boardId) => {
    if (isBoardPinned(boardId)) {
      await unpinBoard(boardId);
    } else {
      await pinBoard(boardId);
    }
  };

  return {
    open,
    boards,
    title,
    loading,
    inputRef,
    router,
    err,
    guestBoard,
    setOpen,
    setBoards,
    setTitle,
    setLoading,
    setErr,
    fetchBoards,
    handleSubmit,
    handleCreated,
    createdByName,
    createdByAvatar,
    handleDelete,
    fetchGuestBoads,
    fetchPinnedBoards,
    isBoardPinned,
    pinBoard,
    unpinBoard,
    togglePinBoard,
    pinnedIds,
  };
}
