"use client";
import { useMemo, useRef, useState } from "react";
import boardService from "@/lib/services/jobManagement/boardService";

export default function useBoardMembers(boardId) {
  const { getBoardById } = boardService();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const normUser = (u = {}) => ({
    id: String(u._id || u.id || ""),
    fullName:
      u.fullName ||
      u.name ||
      (u.email ? String(u.email).split("@")[0] : "Người dùng"),
    email: u.email || "",
  });

  const uniqById = (arr) => {
    const map = new Map();
    for (const u of arr) {
      const id = String(u?._id || u?.id || "");
      if (!id) continue;
      map.set(id, normUser(u));
    }
    return Array.from(map.values());
  };

  const inflight = useRef(false);

  const refresh = async () => {
    if (!boardId || inflight.current) return;
    inflight.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await getBoardById(boardId);
      const b = res?.data?.data;
      if (!b) throw new Error("Board not found");

      const combined = [b.createdBy, ...(b.members || [])].filter(Boolean);
      const list = uniqById(combined);

      const ownerId = String(b.createdBy?._id || "");
      list.sort((a, b2) => (a.id === ownerId ? -1 : b2.id === ownerId ? 1 : 0));

      const withOwnerFlag = list.map((u) =>
        u.id === ownerId ? { ...u, isOwner: true } : { ...u, isOwner: false }
      );

      setMembers(withOwnerFlag);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      inflight.current = false;
    }
  };

  const memberById = useMemo(() => {
    const m = new Map();
    for (const u of members) m.set(u.id, u);
    return m;
  }, [members]);

  return {
    members,
    memberById,
    loading,
    error,
    refresh,
  };
}
