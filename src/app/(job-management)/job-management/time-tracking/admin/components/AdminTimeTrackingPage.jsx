"use client";

import React from "react";
import { IoDownload } from "react-icons/io5";
import useAdminTimeTracking from "../hooks/useAdminTimeTracking";

export default function AdminTimeTrackingPage() {
  const {
    users,
    loading,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    formatMinutes,
    handleExport,
    resetDateFilter,
  } = useAdminTimeTracking();

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8">
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
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-strong">
            Báo cáo chấm công
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Xem báo cáo chấm công của tất cả CTV
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium"
        >
          <IoDownload size={18} />
          Export
        </button>
      </div>

      {/* Date Filter */}
      <div className="mb-6 flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-text-strong mb-1">
            Từ ngày
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 px-3 rounded-lg border border-border bg-white text-text-strong outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-strong mb-1">
            Đến ngày
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 px-3 rounded-lg border border-border bg-white text-text-strong outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={resetDateFilter}
            className="h-10 px-4 rounded-lg border border-border bg-white hover:bg-surface-50 text-text-strong text-sm font-medium"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text-strong">
                  Tên
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text-strong">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text-strong">
                  Vai trò
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-text-strong">
                  Tổng thời gian
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-text-strong">
                  Số task
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-text-strong">
                  Task hoàn thành
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-text-strong">
                  Số phiên
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.userId} className="hover:bg-surface-50">
                    <td className="px-4 py-3 text-sm text-text-strong">
                      {user.fullName || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {user.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {user.role === "admin"
                        ? "Admin"
                        : user.role === "leader"
                        ? "Leader"
                        : "Member"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-text-strong text-right">
                      {formatMinutes(user.totalMinutes || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-strong text-right">
                      {user.totalTasks || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-strong text-right">
                      {user.totalCompleted || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-strong text-right">
                      {user.totalSessions || 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-text-muted"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
