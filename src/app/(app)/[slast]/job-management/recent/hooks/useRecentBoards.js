"use client";

import { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import boardService from "../../workspace/services/boardService";

export default function useRecentBoards() {
  const service = boardService();
  const router = useRouter();
  const params = useParams();
  const slast = params?.slast;
  const t = useTranslations();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatDate = useCallback(
    (date) => {
      if (!date) return t("job_management.pages.never_accessed");
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return t("job_management.pages.unknown");
      return d.toLocaleString("vi-VN");
    },
    [t]
  );

  const fetchRecent = useCallback(async () => {
    try {
      setLoading(true);
      const res = await service.getRecentBoards();
      const payload = res?.data;
      if (payload?.success === false) return;
      setItems(payload?.data || []);
    } finally {
      setLoading(false);
    }
  }, [service]);

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
    fetchRecent,
    formatDate,
    navigateToBoard,
  };
}

