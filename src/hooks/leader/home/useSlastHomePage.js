"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getMembers, getUploads, getUser } from "@/lib/services/homeService";

export default function useSlastHomePage() {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState(true);

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
      totalFiles: files.length || 0,
      usedNum: used,
      totalNum: total,
      plan: user?.plan?.name || "-",
      subAccounts: members.length || 0,
    };
  }, [user, files.length, members.length]);

  const fileTypes = useMemo(() => {
    const count = {};
    for (const f of files) {
      const ext = (f.originalName || "").split(".").pop()?.toLowerCase();
      if (ext) count[ext] = (count[ext] || 0) + 1;
    }
    return Object.entries(count).map(([ext, c]) => ({ ext, count: c }));
  }, [files]);

  function handleSort(col) {
    if (sortColumn === col) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortOrder("asc");
    }
  }

  return {
    loading,
    rows: sortedRows,
    sortColumn,
    sortOrder,
    handleSort,
    overview,
    fileTypes,
    refetch: fetchAll,
  };
}
