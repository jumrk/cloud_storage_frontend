"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  getMembers,
  getUploads,
  getUser,
  getNotifications,
  getStorageTrend,
  getFileDistributionByMember,
  getDashboardStats,
} from "../services/homeService";
import useSocket from "@/shared/lib/useSocket";

export default function useSlastHomePage() {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const itemsPerPage = 5;

  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [storageTrend, setStorageTrend] = useState([]);
  const [fileDistributionByMember, setFileDistributionByMember] = useState([]);
  const [storagePeriod, setStoragePeriod] = useState("month");
  const [dashboardStats, setDashboardStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  // Setup WebSocket for real-time stats updates
  const tokenRef = useRef(
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  );
  const socketRef = useSocket(tokenRef.current);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const ac = new AbortController();
    try {
      const [userRes, membersRes, uploadsRes] = await Promise.all([
        getUser(ac.signal),
        getMembers(ac.signal),
        getUploads({ page: 1, limit: 1000 }, ac.signal),
      ]);
      setUser(userRes || {});
      setMembers(membersRes?.members || []);
      setFolders(uploadsRes?.folders || []);
      setFiles(uploadsRes?.files || []);
    } catch (e) {
      setUser({});
      setMembers([]);
      setFolders([]);
      setFiles([]);
    } finally {
      setLoading(false);
    }
    return () => ac.abort();
  }, []);

  useEffect(() => {
    const cancel = fetchAll();
    return () => {
      if (typeof cancel === "function") cancel();
    };
  }, [fetchAll]);

  // Fetch recent activities
  useEffect(() => {
    const ac = new AbortController();
    setLoadingActivities(true);
    getNotifications({ page: 1, limit: 10 }, ac.signal)
      .then((res) => {
        const notifications = res?.notifications || [];
        setActivities(
          notifications.map((notif) => ({
            type: notif.type === "info" ? "upload" : notif.type,
            title: notif.title,
            content: notif.content,
            createdAt: notif.createdAt,
          }))
        );
      })
      .catch(() => {
        setActivities([]);
      })
      .finally(() => {
        setLoadingActivities(false);
      });
    return () => ac.abort();
  }, []);

  // Fetch chart data
  useEffect(() => {
    const ac = new AbortController();
    setLoadingCharts(true);
    Promise.all([
      getStorageTrend(storagePeriod, ac.signal),
      getFileDistributionByMember(ac.signal),
    ])
      .then(([trendRes, memberRes]) => {
        setStorageTrend(trendRes?.data || []);
        setFileDistributionByMember(memberRes?.data || []);
      })
      .catch(() => {
        setStorageTrend([]);
        setFileDistributionByMember([]);
      })
      .finally(() => {
        setLoadingCharts(false);
      });
    return () => ac.abort();
  }, [storagePeriod]);

  // Fetch dashboard stats
  useEffect(() => {
    const ac = new AbortController();
    setLoadingStats(true);
    getDashboardStats(ac.signal)
      .then((res) => {
        setDashboardStats(res?.stats || null);
      })
      .catch(() => {
        setDashboardStats(null);
      })
      .finally(() => {
        setLoadingStats(false);
      });
    return () => ac.abort();
  }, []);

  // Real-time stats updates via WebSocket
  useEffect(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    const handleStatsUpdate = (data) => {
      // Update user state with new stats
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          totalFiles: data.totalFiles ?? prev.totalFiles,
          usedStorage: data.usedStorage ?? prev.usedStorage,
        };
      });
    };

    socket.on("stats:updated", handleStatsUpdate);

    return () => {
      socket.off("stats:updated", handleStatsUpdate);
    };
  }, [socketRef.current]);

  const tableRows = useMemo(() => {
    if (!members.length) return [];

    const sizeByFolder = new Map();
    for (const f of files) {
      const fid = String(f.folderId);
      sizeByFolder.set(fid, (sizeByFolder.get(fid) || 0) + (f.size || 0));
    }

    const rows = [];
    for (const m of members) {
      const managed = folders.filter((folder) =>
        (folder.permissions || []).some(
          (p) => p.memberId === m._id || p.memberId === m.id
        )
      );
      if (!managed.length) {
        rows.push({
          account: m.fullName || m.email,
          file: "-",
          dateIso: null,
          sizeBytes: null,
        });
      } else {
        for (const folder of managed) {
          rows.push({
            account: m.fullName || m.email,
            file: folder.name,
            dateIso: folder.createdAt || null,
            sizeBytes: sizeByFolder.get(String(folder._id)) || 0,
          });
        }
      }
    }
    return rows;
  }, [members, folders, files]);
  const sortedRows = useMemo(() => {
    if (!sortColumn) return tableRows;
    const dir = sortOrder === "asc" ? 1 : -1;
    return [...tableRows].sort((a, b) => {
      if (sortColumn === "date") {
        const v1 = a.dateIso ? new Date(a.dateIso).getTime() : 0;
        const v2 = b.dateIso ? new Date(b.dateIso).getTime() : 0;
        return (v1 - v2) * dir;
      }
      if (sortColumn === "size") {
        const v1 = a.sizeBytes ?? 0;
        const v2 = b.sizeBytes ?? 0;
        return (v1 - v2) * dir;
      }
      const s1 = a[sortColumn] ?? "";
      const s2 = b[sortColumn] ?? "";
      return s1.localeCompare(s2, undefined, { sensitivity: "base" }) * dir;
    });
  }, [tableRows, sortColumn, sortOrder]);

  const overview = useMemo(() => {
    const used = user?.usedStorage || 0;
    const total = user?.maxStorage || 1;
    return {
      totalFiles: user?.totalFiles || 0,
      usedNum: used,
      totalNum: total,
      plan: user?.plan?.name || "-",
      subAccounts: members.length || 0,
    };
  }, [user, members.length]);

  const fileTypes = useMemo(() => {
    const count = {};
    for (const f of files) {
      const filename = f.name || f.originalName || "";
      let ext = filename.split(".").pop()?.toLowerCase();

      if (!ext && f.mimeType) {
        const mime = String(f.mimeType).toLowerCase();
        if (mime.startsWith("image/")) ext = "image";
        else if (mime.startsWith("video/")) ext = "video";
        else if (mime.startsWith("audio/")) ext = "audio";
        else if (mime === "application/pdf") ext = "pdf";
        else if (mime.includes("excel") || mime.includes("spreadsheet"))
          ext = "xls";
        else if (mime.includes("word")) ext = "doc";
        else if (mime.includes("powerpoint") || mime.includes("presentation"))
          ext = "ppt";
        else ext = "other";
      }

      if (ext) count[ext] = (count[ext] || 0) + 1;
    }
    return Object.entries(count).map(([ext, c]) => ({ ext, count: c }));
  }, [files]);

  const handleSort = useCallback((col) => {
    if (sortColumn === col) {
      // Toggle sort order if clicking the same column
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      // Set new column and default to ascending
      setSortColumn(col);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  }, [sortColumn]);

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  // Row selection handlers
  const handleSelectRow = useCallback((index) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      const actualIndex = startIndex + index;
      if (newSet.has(actualIndex)) {
        newSet.delete(actualIndex);
      } else {
        newSet.add(actualIndex);
      }
      return newSet;
    });
  }, [startIndex]);

  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === paginatedRows.length) {
      setSelectedRows(new Set());
    } else {
      const newSet = new Set();
      paginatedRows.forEach((_, index) => {
        newSet.add(startIndex + index);
      });
      setSelectedRows(newSet);
    }
  }, [selectedRows.size, paginatedRows.length, startIndex]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    setSelectedRows(new Set()); // Clear selection when changing page
  }, []);

  const isAllSelected = selectedRows.size === paginatedRows.length && paginatedRows.length > 0;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < paginatedRows.length;

  // Calculate file distribution by member for chart
  const fileDistributionByMemberData = useMemo(() => {
    if (!members.length || !folders.length) return [];
    const memberFileCount = new Map();
    members.forEach((m) => {
      const managed = folders.filter((folder) =>
        (folder.permissions || []).some(
          (p) => p.memberId === m._id || p.memberId === m.id
        )
      );
      memberFileCount.set(m.fullName || m.email, managed.length);
    });
    return Array.from(memberFileCount.entries())
      .map(([member, count]) => ({ member, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
  }, [members, folders]);

  return {
    loading,
    rows: paginatedRows,
    allRows: sortedRows,
    sortColumn,
    sortOrder,
    handleSort,
    overview,
    fileTypes,
    refetch: fetchAll,
    // Pagination
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems: sortedRows.length,
    handlePageChange,
    // Row selection
    selectedRows,
    handleSelectRow,
    handleSelectAll,
    isAllSelected,
    isIndeterminate,
    // Charts and activities
    activities,
    loadingActivities,
    storageTrend,
    fileDistributionByMember: fileDistributionByMemberData,
    loadingCharts,
    storagePeriod,
    setStoragePeriod,
    dashboardStats,
    loadingStats,
  };
}
