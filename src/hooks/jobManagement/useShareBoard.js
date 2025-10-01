import boardService from "@/lib/services/jobManagement/boardService";
import { useState } from "react";
import toast from "react-hot-toast";

export default function useShareBoard(boardId) {
  const { getBoardById, removeMember, addMember } = boardService();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");

  const normUser = (u = {}) => ({
    id: String(u._id || u.id || ""),
    name:
      u.fullName || u.name || (u.email ? u.email.split("@")[0] : "Người dùng"),
    email: u.email || "",
  });
  const uniqById = (arr) => {
    const map = new Map();
    arr.forEach((u) => {
      const id = String(u._id || u.id || "");
      if (id) map.set(id, normUser(u));
    });
    return Array.from(map.values());
  };
  const handelAddMember = async (emailRaw) => {
    const email = String(emailRaw || "")
      .trim()
      .toLowerCase();
    if (!email) return toast.error("Vui lòng nhập email");

    try {
      const res = await addMember(email, boardId);
      const b = res.data.data;
      const combined = [b.createdBy, ...(b.members || [])].filter(Boolean);

      const list = uniqById(combined);
      const ownerId = String(b.createdBy?._id || "");
      list.sort((a, b2) => (a.id === ownerId ? -1 : b2.id === ownerId ? 1 : 0));
      setMembers(list);
      toast.success("Thêm thành công");
    } catch (err) {
      toast.error(err?.response?.data?.messenger || "Lỗi khi thêm thành viên");
    }
  };

  const handleRemoveMember = async (id) => {
    const memberId = id.trim();
    try {
      const res = await removeMember(boardId, memberId);
      if (!res) {
        toast.error("Lỗi khi gỡ");
      }

      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast.success("Gỡ thành công");
    } catch (error) {
      toast.error("Lỗi");
    }
  };

  const FetchMember = async () => {
    try {
      const res = await getBoardById(boardId);
      const payload = res?.data;
      if (!payload?.success) {
        toast.error(payload?.messenger || "Không lấy được board");
        return;
      }

      const b = payload.data;
      setTitle(b.title);

      const combined = [b.createdBy, ...(b.members || [])].filter(Boolean);
      const list = uniqById(combined);
      const ownerId = String(b.createdBy?._id || "");
      list.sort((a, b2) => (a.id === ownerId ? -1 : b2.id === ownerId ? 1 : 0));
      setMembers(list);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi server");
    }
  };

  return {
    open,
    members,
    link,
    title,
    FetchMember,
    setOpen,
    handelAddMember,
    handleRemoveMember,
  };
}
