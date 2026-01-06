"use client";

import { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import boardService from "../../workspace/services/boardService";

export default function usePinnedBoards() {
  const service = boardService();
  const router = useRouter();
  const params = useParams();
  const slast = params?.slast;
  const t = useTranslations();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPinned = useCallback(async () => {
    try {
      setLoading(true);
      const res = await service.getPinnedBoards();
      const payload = res?.data;
      if (payload?.success === false) {
        toast.error(
          payload?.messenger || t("job_management.errors.cannot_load_pinned")
        );
        return;
      }
      setItems(payload?.data || []);
    } catch (error) {
      const msg = error?.response?.data?.messenger;
      toast.error(msg || t("job_management.errors.cannot_load_pinned"));
    } finally {
      setLoading(false);
    }
  }, [service, t]);

  const handleUnpin = useCallback(
    async (boardId) => {
      try {
        await service.unpinBoard(boardId);
        setItems((prev) => prev.filter((item) => item.board._id !== boardId));
        toast.success(t("job_management.success.unpin_success"));
      } catch (error) {
        const msg = error?.response?.data?.messenger;
        toast.error(msg || t("job_management.errors.cannot_unpin"));
      }
    },
    [service, t]
  );

  const navigateToBoard = useCallback(
    (boardId) => {
      const boardPath = slast 
        ? `/${slast}/job-management/workspace/board/${boardId}`
        : `/job-management/workspace/board/${boardId}`;
      router.push(boardPath);
    },
    [router, slast]
  );

  return {
    items,
    loading,
    t,
    fetchPinned,
    handleUnpin,
    navigateToBoard,
  };
}

