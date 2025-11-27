"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import timeTrackingService from "../../../services/timeTrackingService";

export default function useAdminTimeTracking() {
  const t = useTranslations("job_management.time_tracking");
  const service = timeTrackingService();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      // Try admin endpoint first, fallback to team endpoint
      let response;
      try {
        response = await service.getAllUsersTimeTracking(params);
      } catch (error) {
        if (error.response?.status === 403) {
          // If not admin, try team endpoint
          response = await service.getTeamTimeTracking(params);
        } else {
          throw error;
        }
      }

      if (response.data?.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error("Error fetching time tracking data:", error);
    } finally {
      setLoading(false);
    }
  }, [service, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const formatMinutes = useCallback((minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  const handleExport = useCallback(() => {
    if (users.length === 0) {
      toast.error("Không có dữ liệu để export");
      return;
    }

    // Create CSV content
    const headers = [
      "Tên",
      "Email",
      "Vai trò",
      "Tổng thời gian (phút)",
      "Tổng thời gian",
      "Số task",
      "Task hoàn thành",
      "Số phiên",
    ];

    const rows = users.map((user) => {
      const hours = Math.floor((user.totalMinutes || 0) / 60);
      const mins = (user.totalMinutes || 0) % 60;
      const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      return [
        user.fullName || "",
        user.email || "",
        user.role === "admin"
          ? "Admin"
          : user.role === "leader"
          ? "Leader"
          : "Member",
        user.totalMinutes || 0,
        timeStr,
        user.totalTasks || 0,
        user.totalCompleted || 0,
        user.totalSessions || 0,
      ];
    });

    // Convert to CSV
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);

    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `bao-cao-cham-cong-${dateStr}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Đã export thành công!");
  }, [users]);

  const resetDateFilter = useCallback(() => {
    setStartDate("");
    setEndDate("");
  }, []);

  return {
    t,
    users,
    loading,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    formatMinutes,
    handleExport,
    resetDateFilter,
  };
}

