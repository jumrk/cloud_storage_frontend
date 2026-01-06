"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import taskService from "../../services/taskService";
import { useTranslations } from "next-intl";

export default function useAssignedTasks() {
  const service = useMemo(() => taskService(), []);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations();

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await service.getAssignedCards();
      const payload = res?.data;
      if (payload?.success === false) {
        toast.error(payload?.messenger || t("job_management.errors.cannot_load_tasks"));
        return;
      }
      setTasks(payload?.data || []);
    } catch (error) {
      const msg = error?.response?.data?.messenger;
      toast.error(msg || "Không tải được công việc");
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    refetch: fetchTasks,
  };
}


