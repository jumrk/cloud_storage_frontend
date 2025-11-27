import axiosClient from "@/shared/lib/axiosClient";

export default function timeTrackingService() {
  // Start a work session
  const startWorkSession = (data) =>
    axiosClient.post("/api/job-management/time-tracking/sessions/start", data);

  // Pause a work session
  const pauseWorkSession = (sessionId) =>
    axiosClient.post(
      `/api/job-management/time-tracking/sessions/${sessionId}/pause`
    );

  // Resume a work session
  const resumeWorkSession = (sessionId) =>
    axiosClient.post(
      `/api/job-management/time-tracking/sessions/${sessionId}/resume`
    );

  // Complete a work session
  const completeWorkSession = (sessionId) =>
    axiosClient.post(
      `/api/job-management/time-tracking/sessions/${sessionId}/complete`
    );

  // Switch to another task
  const switchTask = (data) =>
    axiosClient.post("/api/job-management/time-tracking/sessions/switch", data);

  // Get active session
  const getActiveSession = () =>
    axiosClient.get("/api/job-management/time-tracking/sessions/active");

  // Get sessions with filters
  const getSessions = (params = {}) =>
    axiosClient.get("/api/job-management/time-tracking/sessions", { params });

  // Get today's summary
  const getTodaySummary = () =>
    axiosClient.get("/api/job-management/time-tracking/summary/today");

  // Get week summary
  const getWeekSummary = () =>
    axiosClient.get("/api/job-management/time-tracking/summary/week");

  // Get month summary
  const getMonthSummary = () =>
    axiosClient.get("/api/job-management/time-tracking/summary/month");

  // Get range summary
  const getRangeSummary = (params) =>
    axiosClient.get("/api/job-management/time-tracking/summary/range", {
      params,
    });

  // Get total time worked on a card
  const getCardTotalTime = (cardId) =>
    axiosClient.get(
      `/api/job-management/time-tracking/cards/${cardId}/total-time`
    );

  // Update session duration (for auto-save)
  const updateSessionDuration = (sessionId) =>
    axiosClient.post(
      `/api/job-management/time-tracking/sessions/${sessionId}/update-duration`
    );

  // Get all users time tracking (admin/leader)
  const getAllUsersTimeTracking = (params = {}) =>
    axiosClient.get("/api/job-management/time-tracking/admin/all-users", {
      params,
    });

  // Get team time tracking (leader)
  const getTeamTimeTracking = (params = {}) =>
    axiosClient.get("/api/job-management/time-tracking/leader/team", {
      params,
    });

  // Get board report (board owner only)
  const getBoardReport = (params = {}) =>
    axiosClient.get("/api/job-management/time-tracking/board-report", {
      params,
    });

  return {
    startWorkSession,
    pauseWorkSession,
    resumeWorkSession,
    completeWorkSession,
    switchTask,
    getActiveSession,
    getSessions,
    getTodaySummary,
    getWeekSummary,
    getMonthSummary,
    getRangeSummary,
    getCardTotalTime,
    updateSessionDuration,
    getAllUsersTimeTracking,
    getTeamTimeTracking,
    getBoardReport,
  };
}

