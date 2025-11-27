"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { IoTimeOutline, IoPlay, IoPause, IoStop, IoRefresh } from "react-icons/io5";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import timeTrackingService from "../../../services/timeTrackingService";

function TimeTracking({ cardId, boardId, cardTitle }) {
  const t = useTranslations("job_management.time_tracking");
  const service = useMemo(() => timeTrackingService(), []);
  const [activeSession, setActiveSession] = useState(null);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [previousDuration, setPreviousDuration] = useState(0); // Store previous duration when paused
  const [loading, setLoading] = useState(false);
  const [isCurrentCard, setIsCurrentCard] = useState(false);

  // Format duration to hours, minutes, seconds
  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { hours, minutes, seconds };
  };

  // Fetch active session
  const fetchActiveSession = useCallback(async () => {
    try {
      // First, try to restore from localStorage
      const savedSession = localStorage.getItem("activeWorkSession");
      if (savedSession) {
        try {
          const { sessionId, cardId: savedCardId, startTime } = JSON.parse(savedSession);
          // If it's for this card, restore immediately
          if (String(savedCardId) === String(cardId)) {
            const startTimeDate = new Date(startTime);
            const now = new Date();
            const diffSeconds = Math.floor((now - startTimeDate) / 1000);
            setCurrentDuration(diffSeconds);
          }
        } catch (e) {
          console.error("Error parsing saved session:", e);
        }
      }

      // First, try to get active session
      const activeResponse = await service.getActiveSession();
      if (activeResponse.data?.success && activeResponse.data?.session) {
        const session = activeResponse.data.session;
        setActiveSession(session);
        setIsCurrentCard(String(session.cardId._id) === String(cardId));
        
        if (session.status === "active") {
          const startTime = new Date(session.startTime);
          const now = new Date();
          const diffSeconds = Math.floor((now - startTime) / 1000);
          setCurrentDuration(diffSeconds);
          
          // Save to localStorage
          localStorage.setItem(
            "activeWorkSession",
            JSON.stringify({
              sessionId: session._id,
              cardId: session.cardId._id,
              startTime: session.startTime,
            })
          );
        } else if (session.status === "paused" && session.duration) {
          // For paused sessions, store the duration as previous duration
          setPreviousDuration(session.duration * 60);
          setCurrentDuration(0);
          // Clear localStorage if session is not active
          localStorage.removeItem("activeWorkSession");
        } else if (session.duration) {
          setCurrentDuration(session.duration * 60);
          setPreviousDuration(0);
          // Clear localStorage if session is not active
          localStorage.removeItem("activeWorkSession");
        }
        return;
      }

      // If no active session, check for paused session on this card
      if (cardId) {
        const sessionsResponse = await service.getSessions({
          cardId,
          status: "paused",
          limit: 1,
        });
        
        if (sessionsResponse.data?.success && sessionsResponse.data?.sessions?.length > 0) {
          const session = sessionsResponse.data.sessions[0];
          setActiveSession(session);
          setIsCurrentCard(true);
          
          if (session.duration) {
            // For paused sessions, store as previous duration
            setPreviousDuration(session.duration * 60);
            setCurrentDuration(0);
          }
          // Don't save paused session to localStorage
          return;
        }
      }

      // No session found
      setActiveSession(null);
      setIsCurrentCard(false);
      setCurrentDuration(0);
      // Clear localStorage if no active session
      localStorage.removeItem("activeWorkSession");
    } catch (error) {
      console.error("Error fetching active session:", error);
    }
  }, [cardId, service]);

  // Update timer every second and check for 8-hour warning
  const warningShownRef = useRef(false);
  
  useEffect(() => {
    if (activeSession && activeSession.status === "active" && isCurrentCard) {
      // Reset warning when starting new session
      warningShownRef.current = false;
      
      const interval = setInterval(() => {
        const startTime = new Date(activeSession.startTime);
        const now = new Date();
        const diffSeconds = Math.floor((now - startTime) / 1000);
        setCurrentDuration(diffSeconds);
        
        // Check if working for more than 8 hours (28800 seconds)
        if (diffSeconds > 28800 && !warningShownRef.current) {
          warningShownRef.current = true;
          toast.error(t("work_too_long_warning"), {
            duration: 10000, // Show for 10 seconds
          });
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeSession, isCurrentCard, t]);

  // Auto-save duration every 1 minute
  useEffect(() => {
    if (activeSession && activeSession.status === "active" && isCurrentCard) {
      const saveInterval = setInterval(async () => {
        try {
          await service.updateSessionDuration(activeSession._id);
        } catch (error) {
          console.error("Error auto-saving session duration:", error);
        }
      }, 60000); // 1 minute

      return () => clearInterval(saveInterval);
    }
  }, [activeSession, isCurrentCard, service]);

  // Fetch on mount and when cardId changes
  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  // Start work session
  const handleStart = async () => {
    setLoading(true);
    try {
      const response = await service.startWorkSession({
        cardId,
        boardId,
      });

      if (response.data?.success) {
        if (response.data.activeSession) {
          // User has active session on different card
          const confirm = window.confirm(
            t("switch_task_confirm", {
              taskName: response.data.activeSession.cardTitle,
            })
          );
          if (confirm) {
            // Switch task
            const switchResponse = await service.switchTask({
              cardId,
              boardId,
            });
            if (switchResponse.data?.success) {
              const session = switchResponse.data.session;
              setActiveSession(session);
              setIsCurrentCard(true);
              setCurrentDuration(0);
              // Save to localStorage
              localStorage.setItem(
                "activeWorkSession",
                JSON.stringify({
                  sessionId: session._id,
                  cardId: session.cardId._id,
                  startTime: session.startTime,
                })
              );
              toast.success(t("start_success", { taskName: cardTitle || "task" }));
            }
          }
        } else {
          const session = response.data.session;
          setActiveSession(session);
          setIsCurrentCard(true);
          setCurrentDuration(0);
          // Save to localStorage
          localStorage.setItem(
            "activeWorkSession",
            JSON.stringify({
              sessionId: session._id,
              cardId: session.cardId._id,
              startTime: session.startTime,
            })
          );
          toast.success(t("start_success", { taskName: cardTitle || "task" }));
        }
      }
    } catch (error) {
      console.error("Error starting work session:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // Pause work session
  const handlePause = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      const response = await service.pauseWorkSession(activeSession._id);
      if (response.data?.success) {
        const pausedSession = response.data.session;
        setActiveSession(pausedSession);
        setIsCurrentCard(true);
        // Store current duration as previous duration when paused
        const totalDuration = previousDuration + currentDuration;
        setPreviousDuration(totalDuration);
        setCurrentDuration(0);
        // Clear localStorage when paused
        localStorage.removeItem("activeWorkSession");
        const totalMinutes = Math.floor(totalDuration / 60);
        toast.success(t("pause_success", { minutes: totalMinutes }));
        // Refresh to ensure state is correct
        setTimeout(() => {
          fetchActiveSession();
        }, 100);
      }
    } catch (error) {
      console.error("Error pausing work session:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // Resume work session
  const handleResume = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      const response = await service.resumeWorkSession(activeSession._id);
      if (response.data?.success) {
        const session = response.data.session;
        setActiveSession(session);
        setIsCurrentCard(true);
        // Keep previous duration, reset current duration to 0 (will count from now)
        setCurrentDuration(0);
        // previousDuration is already set from paused session
        // Save to localStorage
        localStorage.setItem(
          "activeWorkSession",
          JSON.stringify({
            sessionId: session._id,
            cardId: session.cardId._id,
            startTime: session.startTime,
          })
        );
        toast.success(t("resume_success"));
      }
    } catch (error) {
      console.error("Error resuming work session:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // Complete work session
  const handleComplete = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      const response = await service.completeWorkSession(activeSession._id);
      if (response.data?.success) {
        setActiveSession(response.data.session);
        setIsCurrentCard(false);
        const totalDurationForComplete = previousDuration + currentDuration;
        const { hours, minutes } = formatDuration(totalDurationForComplete);
        // Clear localStorage when completed
        localStorage.removeItem("activeWorkSession");
        setPreviousDuration(0);
        setCurrentDuration(0);
        toast.success(t("complete_success", { hours, minutes }));
        // Refresh to get updated session
        setTimeout(() => {
          fetchActiveSession();
        }, 500);
      }
    } catch (error) {
      console.error("Error completing work session:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // Calculate total duration (previous + current)
  const totalDuration = previousDuration + currentDuration;
  const { hours, minutes, seconds } = formatDuration(totalDuration);
  const hasActiveSession = activeSession && activeSession.status === "active" && isCurrentCard;
  const isPaused = activeSession && activeSession.status === "paused" && isCurrentCard;
  const isCompleted = activeSession && activeSession.status === "completed";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-text-muted">
        <IoTimeOutline />
        <span className="font-medium text-sm">{t("title")}</span>
      </div>

      <div className="rounded-lg border border-border bg-surface-50 p-4">
        {!activeSession || (!isCurrentCard && !isCompleted) ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-text-muted text-center">
              {t("no_active_session")}
            </p>
            <button
              onClick={handleStart}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <IoPlay size={16} />
              {t("start_work")}
            </button>
          </div>
        ) : hasActiveSession ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-sm font-medium text-text-strong">
                  {t("working")}
                </span>
              </div>
              <div className="text-lg font-semibold text-text-strong">
                {hours > 0 ? `${hours}h ` : ""}
                {minutes}m {seconds}s
              </div>
            </div>
            <div className="text-xs text-text-muted">
              {previousDuration > 0 
                ? `Tổng: ${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s (Đang làm: ${Math.floor(currentDuration / 60)}m ${currentDuration % 60}s)`
                : t("worked_for", { minutes, seconds })}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePause}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border bg-white hover:bg-surface-50 text-text-strong text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <IoPause size={16} />
                {t("pause")}
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <IoStop size={16} />
                {t("complete")}
              </button>
            </div>
          </div>
        ) : isPaused ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>
                <span className="text-sm font-medium text-text-strong">
                  {t("paused")}
                </span>
              </div>
              <div className="text-lg font-semibold text-text-strong">
                {hours > 0 ? `${hours}h ` : ""}
                {minutes}m {seconds > 0 ? `${seconds}s` : ""}
              </div>
            </div>
            <div className="text-xs text-text-muted">
              {t("total_time", { hours, minutes })}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResume}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <IoPlay size={16} />
                {t("resume")}
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border bg-white hover:bg-surface-50 text-text-strong text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <IoStop size={16} />
                {t("complete")}
              </button>
            </div>
          </div>
        ) : isCompleted ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-sm font-medium text-text-strong">
                  {t("completed")}
                </span>
              </div>
              <div className="text-lg font-semibold text-text-strong">
                {hours > 0 ? `${hours}h ` : ""}
                {minutes}m {seconds}s
              </div>
            </div>
            <div className="text-xs text-text-muted">
              {t("total_time", { hours, minutes })}
            </div>
            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <IoRefresh size={16} />
              {t("restart")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default TimeTracking;

