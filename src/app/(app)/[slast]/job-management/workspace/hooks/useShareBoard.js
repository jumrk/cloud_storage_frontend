import boardService from "../services/boardService";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function useShareBoard(boardId) {
  const boardSvc = useMemo(() => boardService(), []);
  const { getBoardById, removeMember, addMember } = boardSvc;
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useTranslations();
  const normUser = useCallback(
    (u = {}) => {
      return {
        id: String(u._id || u.id || ""),
        name:
          u.fullName ||
          u.name ||
          (u.email ? u.email.split("@")[0] : t("job_management.errors.user")),
        email: u.email || "",
        avatar: u.avatar || "",
      };
    },
    [t]
  );

  const uniqById = useCallback(
    (arr = []) => {
      const map = new Map();
      arr.forEach((u) => {
        const id = String(u._id || u.id || "");
        if (id) map.set(id, normUser(u));
      });
      return Array.from(map.values());
    },
    [normUser]
  );

  const handelAddMember = useCallback(async (emailRaw) => {
    const email = String(emailRaw || "")
      .trim()
      .toLowerCase();
    if (!email) return toast.error(t("job_management.errors.enter_email"));

    try {
      setLoading(true);
      const res = await addMember(email, boardId);
      const b = res.data.data;
      const combined = [b.createdBy, ...(b.members || [])].filter(Boolean);
      const list = uniqById(combined);
      const ownerId = String(b.createdBy?._id || "");
      list.sort((a, b2) => (a.id === ownerId ? -1 : b2.id === ownerId ? 1 : 0));
      setMembers(list);
      setLoading(false);
      toast.success(t("job_management.success.add_success"));
    } catch (err) {
      toast.error(err?.response?.data?.messenger || t("job_management.errors.cannot_add_member"));
    } finally {
      setLoading(false);
    }
  }, [addMember, boardId, uniqById]);

  const handleRemoveMember = useCallback(async (id) => {
    const memberId = id.trim();
    try {
      setLoading(true);
      const res = await removeMember(boardId, memberId);
      if (!res) {
        toast.error(t("job_management.errors.unpin_error"));
      }

      setMembers((prev) => prev.filter((m) => m.id !== id));
      setLoading(false);
      toast.success(t("job_management.success.remove_success"));
    } catch (error) {
        toast.error(t("job_management.errors.general_error"));
    } finally {
      setLoading(false);
    }
  }, [boardId, removeMember]);

  const FetchMember = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBoardById(boardId);
      const payload = res?.data;
      if (!payload?.success) {
        toast.error(payload?.messenger || t("job_management.errors.cannot_get_board"));
        return;
      }

      const b = payload.data;
      setTitle(b.title);

      const combined = [b.createdBy, ...(b.members || [])].filter(Boolean);
      const list = uniqById(combined);
      const ownerId = String(b.createdBy?._id || "");
      list.sort((a, b2) => (a.id === ownerId ? -1 : b2.id === ownerId ? 1 : 0));
      setLoading(false);
      setMembers(list);
    } catch (error) {
      console.error(error);
      toast.error(t("job_management.errors.server_error"));
    } finally {
      setLoading(false);
    }
  }, [boardId, getBoardById, uniqById]);

  return {
    open,
    members,
    link,
    title,
    loading,
    FetchMember,
    setOpen,
    handelAddMember,
    handleRemoveMember,
  };
}
