"use client";

import React from "react";
import { IoTimeOutline, IoCheckmarkCircle } from "react-icons/io5";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function WeekSummary({ t, weekSummary, formatMinutes }) {
  if (!weekSummary) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-text-strong mb-4">
        {t("this_week")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <IoTimeOutline size={20} />
            <span className="text-sm font-medium">{t("total_time_label")}</span>
          </div>
          <div className="text-2xl font-bold text-text-strong">
            {formatMinutes(weekSummary.totalMinutes || 0)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="text-sm font-medium text-text-muted mb-2">
            {t("total_tasks_label")}
          </div>
          <div className="text-2xl font-bold text-text-strong">
            {weekSummary.totalTasks || 0}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <IoCheckmarkCircle size={20} />
            <span className="text-sm font-medium">
              {t("total_completed_label")}
            </span>
          </div>
          <div className="text-2xl font-bold text-text-strong">
            {weekSummary.totalCompleted || 0}
          </div>
        </div>
      </div>

      {/* Week Chart */}
      {weekSummary.dailyStats && weekSummary.dailyStats.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-4">
          <h3 className="text-sm font-semibold text-text-strong mb-4">
            Phân bổ thời gian theo ngày
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weekSummary.dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                  });
                }}
              />
              <YAxis
                tickFormatter={(value) => {
                  const hours = Math.floor(value / 60);
                  const mins = value % 60;
                  return hours > 0 ? `${hours}h` : `${mins}m`;
                }}
              />
              <Tooltip
                formatter={(value) => {
                  const hours = Math.floor(value / 60);
                  const mins = value % 60;
                  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                }}
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("vi-VN", {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                  });
                }}
              />
              <Legend />
              <Bar
                dataKey="totalMinutes"
                name="Thời gian (phút)"
                fill="#2563eb"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

