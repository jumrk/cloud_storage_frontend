"use client";

import React from "react";
import { IoTimeOutline, IoCheckmarkCircle } from "react-icons/io5";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function MonthSummary({ t, monthSummary, formatMinutes }) {
  if (!monthSummary) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-text-strong mb-4">
        {t("this_month")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <IoTimeOutline size={20} />
            <span className="text-sm font-medium">{t("total_time_label")}</span>
          </div>
          <div className="text-2xl font-bold text-text-strong">
            {formatMinutes(monthSummary.totalMinutes || 0)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="text-sm font-medium text-text-muted mb-2">
            {t("total_tasks_label")}
          </div>
          <div className="text-2xl font-bold text-text-strong">
            {monthSummary.totalTasks || 0}
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
            {monthSummary.totalCompleted || 0}
          </div>
        </div>
      </div>

      {/* Month Chart */}
      {monthSummary.weeklyStats && monthSummary.weeklyStats.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-4">
          <h3 className="text-sm font-semibold text-text-strong mb-4">
            Phân bổ thời gian theo tuần
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthSummary.weeklyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="weekStart"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `Tuần ${date.getDate()}/${date.getMonth() + 1}`;
                }}
              />
              <YAxis
                tickFormatter={(value) => {
                  const hours = Math.floor(value / 60);
                  return `${hours}h`;
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
                  return `Tuần ${date.getDate()}/${date.getMonth() + 1}`;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalMinutes"
                name="Thời gian (phút)"
                stroke="#2563eb"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

