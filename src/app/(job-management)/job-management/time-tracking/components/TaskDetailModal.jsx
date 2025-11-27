"use client";

import React from "react";
import { IoClose } from "react-icons/io5";
import StatusBadge from "./StatusBadge";

export default function TaskDetailModal({
  t,
  selectedTask,
  taskSessions,
  loadingSessions,
  formatMinutes,
  formatDateTime,
  getTotalTaskTime,
  onClose,
}) {
  if (!selectedTask) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-strong">
            {t("view_details")} - {selectedTask.cardTitle}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-surface-50 text-text-muted"
          >
            <IoClose size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-muted mb-1">{t("task")}</p>
              <p className="font-medium text-text-strong">
                {selectedTask.cardTitle}
              </p>
            </div>
            {selectedTask.boardTitle && (
              <div>
                <p className="text-sm text-text-muted mb-1">{t("board")}</p>
                <p className="font-medium text-text-strong">
                  {selectedTask.boardTitle}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-text-muted mb-1">
                {t("total_time_label")}
              </p>
              <p className="text-2xl font-bold text-text-strong">
                {formatMinutes(getTotalTaskTime())}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-text-strong mb-3">
                {t("work_sessions_today")}
              </p>
              {loadingSessions ? (
                <div className="text-center text-text-muted py-8">
                  Đang tải...
                </div>
              ) : taskSessions.length > 0 ? (
                <div className="space-y-2">
                  {taskSessions.map((session) => {
                    const duration = session.duration || 0;
                    const startTime = new Date(session.startTime);
                    const endTime = session.endTime
                      ? new Date(session.endTime)
                      : null;
                    const actualDuration =
                      session.status === "active"
                        ? Math.round((new Date() - startTime) / (1000 * 60))
                        : duration;

                    return (
                      <div
                        key={session._id}
                        className="p-3 rounded-lg border border-border bg-surface-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={session.status} t={t} />
                          </div>
                          <span className="font-semibold text-text-strong">
                            {formatMinutes(actualDuration)}
                          </span>
                        </div>
                        <div className="text-xs text-text-muted space-y-1">
                          <div>
                            <span className="font-medium">{t("start_time")}:</span>{" "}
                            {formatDateTime(session.startTime)}
                          </div>
                          {endTime && (
                            <div>
                              <span className="font-medium">{t("end_time")}:</span>{" "}
                              {formatDateTime(session.endTime)}
                            </div>
                          )}
                        </div>
                        {session.notes && (
                          <div className="mt-2 text-xs text-text-muted italic">
                            {session.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-text-muted py-8">
                  {t("no_sessions")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

