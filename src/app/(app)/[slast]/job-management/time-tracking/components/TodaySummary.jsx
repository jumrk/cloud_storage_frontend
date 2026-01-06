"use client";
import React from "react";
import { IoTimeOutline, IoCheckmarkCircle } from "react-icons/io5";
import { FiChevronRight } from "react-icons/fi";
import StatusBadge from "./StatusBadge";
export default function TodaySummary({
  t,
  todaySummary,
  formatMinutes,
  onViewTaskDetails,
}) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("today")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <IoTimeOutline size={20} />
            <span className="text-sm font-medium">{t("total_time_label")}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {todaySummary?.totalMinutes
              ? formatMinutes(todaySummary.totalMinutes)
              : "0m"}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <span className="text-sm font-medium">
              {t("total_tasks_label")}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {todaySummary?.totalTasks || 0}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <IoCheckmarkCircle size={20} />
            <span className="text-sm font-medium">
              {t("total_completed_label")}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {todaySummary?.totalCompleted || 0}
          </div>
        </div>
      </div>
      {/* Today's Sessions */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          {t("work_sessions_today")}
        </h3>
        {todaySummary?.sessions && todaySummary.sessions.length > 0 ? (
          <div className="space-y-3">
            {todaySummary.sessions.map((session) => {
              const duration = session.duration || 0;
              const startTime = new Date(session.startTime);
              const endTime = session.endTime
                ? new Date(session.endTime)
                : null;
              return (
                <div
                  key={session._id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-white cursor-pointer transition-colors"
                  onClick={() => onViewTaskDetails(session)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {session.cardId?.title || "Unknown Task"}
                      </span>
                      <StatusBadge status={session.status} t={t} />
                    </div>
                    <div className="text-xs text-gray-600">
                      {session.boardId?.title || "Unknown Board"} •{""}
                      {formatMinutes(duration)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {startTime.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {endTime
                        ? ` - ${endTime.toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : " - Đang làm"}
                    </div>
                  </div>
                  <FiChevronRight className="text-gray-600" size={20} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-600 py-8">
            {t("no_sessions")}
          </div>
        )}
      </div>
    </div>
  );
}
