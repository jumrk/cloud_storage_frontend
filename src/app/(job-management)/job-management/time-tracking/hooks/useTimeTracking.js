"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import timeTrackingService from "../../services/timeTrackingService";

export default function useTimeTracking() {
  const t = useTranslations("job_management.time_tracking");
  const service = timeTrackingService();

  const [todaySummary, setTodaySummary] = useState(null);
  const [weekSummary, setWeekSummary] = useState(null);
  const [monthSummary, setMonthSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskSessions, setTaskSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, weekRes, monthRes] = await Promise.all([
        service.getTodaySummary(),
        service.getWeekSummary(),
        service.getMonthSummary(),
      ]);

      if (todayRes.data?.success) {
        setTodaySummary(todayRes.data);
      }
      if (weekRes.data?.success) {
        setWeekSummary(weekRes.data);
      }
      if (monthRes.data?.success) {
        setMonthSummary(monthRes.data);
      }
    } catch (error) {
      console.error("Error fetching time tracking data:", error);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    fetchData();
  }, []);

  const formatMinutes = useCallback((minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, []);

  const formatDateTime = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const handleViewTaskDetails = useCallback(
    async (session) => {
      if (!session.cardId?._id) return;

      setSelectedTask({
        cardId: session.cardId._id,
        cardTitle: session.cardId.title,
        boardId: session.boardId?._id,
        boardTitle: session.boardId?.title,
      });

      setLoadingSessions(true);
      try {
        const response = await service.getSessions({
          cardId: session.cardId._id,
        });
        if (response.data?.success) {
          setTaskSessions(response.data.sessions || []);
        }
      } catch (error) {
        console.error("Error fetching task sessions:", error);
      } finally {
        setLoadingSessions(false);
      }
    },
    [service]
  );

  const closeTaskDetails = useCallback(() => {
    setSelectedTask(null);
    setTaskSessions([]);
  }, []);

  const getTotalTaskTime = useCallback(() => {
    return taskSessions.reduce((sum, s) => {
      const duration = s.duration || 0;
      if (s.status === "active") {
        const diffMs = new Date() - new Date(s.startTime);
        return sum + Math.round(diffMs / (1000 * 60));
      }
      return sum + duration;
    }, 0);
  }, [taskSessions]);

  return {
    t,
    todaySummary,
    weekSummary,
    monthSummary,
    loading,
    selectedTask,
    taskSessions,
    loadingSessions,
    formatMinutes,
    formatDate,
    formatDateTime,
    handleViewTaskDetails,
    closeTaskDetails,
    getTotalTaskTime,
  };
}

