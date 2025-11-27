"use client";

import React from "react";
import useTimeTracking from "../hooks/useTimeTracking";
import TodaySummary from "./TodaySummary";
import WeekSummary from "./WeekSummary";
import MonthSummary from "./MonthSummary";
import TaskDetailModal from "./TaskDetailModal";

export default function TimeTrackingPage() {
  const {
    t,
    todaySummary,
    weekSummary,
    monthSummary,
    loading,
    selectedTask,
    taskSessions,
    loadingSessions,
    formatMinutes,
    formatDateTime,
    handleViewTaskDetails,
    closeTaskDetails,
    getTotalTaskTime,
  } = useTimeTracking();

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 w-full rounded-2xl border border-border bg-surface-50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text-strong">
          {t("page_title")}
        </h1>
      </div>

      {/* Today Summary */}
      <TodaySummary
        t={t}
        todaySummary={todaySummary}
        formatMinutes={formatMinutes}
        onViewTaskDetails={handleViewTaskDetails}
      />

      {/* Week Summary */}
      <WeekSummary
        t={t}
        weekSummary={weekSummary}
        formatMinutes={formatMinutes}
      />

      {/* Month Summary */}
      <MonthSummary
        t={t}
        monthSummary={monthSummary}
        formatMinutes={formatMinutes}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        t={t}
        selectedTask={selectedTask}
        taskSessions={taskSessions}
        loadingSessions={loadingSessions}
        formatMinutes={formatMinutes}
        formatDateTime={formatDateTime}
        getTotalTaskTime={getTotalTaskTime}
        onClose={closeTaskDetails}
      />
    </div>
  );
}
