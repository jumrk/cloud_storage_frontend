"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import boardService from "@/lib/services/jobManagement/boardService";

export default function useBoard() {
  const router = useRouter();
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [boards, setBoards] = useState([]);
  const [guestBoard, setGuestBoard] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const { getBoard, postBoard, deleteBoard, getGuestBoard } = boardService();

  const fetchBoards = async () => {
    try {
      setLoading(true);
      setErr("");
      const r = await getBoard();
      const payload = r?.data ?? r;
      setBoards(payload?.data || []);
    } catch (error) {
      const msg = error?.response?.data.messenger;
      toast.error(msg || "Có lỗi xảy ra");
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
        toast.error(payload.messenger || "Lỗi khi tải danh sách");
        return;
      }
      const result = payload.data;
      setGuestBoard(result);
      setLoading(false);
    } catch (error) {
      const msg = error?.response?.data.messenger;
      toast.error(msg || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (board) => {
    setBoards((prev) => [board, ...prev]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErr("Vui lòng nhập tiêu đề bảng");
      return;
    }
    try {
      setLoading(true);
      setErr("");
      const res = await postBoard(title);
      console.log(res);
      if (!res.data.success) {
        toast.error(res.data.messenger || "Tạo bảng thất bại");
        return;
      }
      toast.success("Tạo thành công");
      handleCreated(res.data.data);
      setTitle("");
      setOpen(false);
    } catch (error) {
      const msg = error?.response?.data.messenger;
      toast.error(msg || "Có lỗi xảy ra");
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
        toast.error(data.message || "Không xóa được");
        return;
      }
      setBoards((prev) => prev.filter((b) => b._id !== boardId));
      toast.success("Xóa thành công");
    } catch (error) {
      const msg = error?.response?.data.messenger;
      toast.error(msg || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const createdByName = (b) =>
    b?.members.fullName || b?.createdBy?.fullName || "Khách";

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
    handleDelete,
    fetchGuestBoads,
  };
}
