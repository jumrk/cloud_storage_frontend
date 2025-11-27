"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import FileManagementService from "@/features/file-management/services/fileManagementService";

export default function usePermissionModal(onPermissionChange, folder) {
  const t = useTranslations();
  const api = useMemo(() => FileManagementService(), []);
  const tokenRef = useRef(
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  );

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [permMap, setPermMap] = useState(new Map());

  const isFolder = !!(folder && (folder.type === "folder" || folder.name));

  const folderId = useMemo(() => {
    if (!folder) return null;
    return folder._id || folder.id || null;
  }, [folder]);

  const fetchMembers = useCallback(async () => {
    const ac = new AbortController();
    setIsLoadingList(true);
    try {
      const data = await api.getMember(tokenRef.current, ac.signal);
      setMembers(Array.isArray(data?.members) ? data.members : []);
    } catch {
      setMembers([]);
    } finally {
      setIsLoadingList(false);
    }
    return () => ac.abort();
  }, [api]);

  const fetchCurrentPermissions = useCallback(async () => {
    if (!folderId) return;
    const ac = new AbortController();
    setLoading(true);
    try {
      const data = await api.getCurrentPermissions(
        folderId,
        tokenRef.current,
        ac.signal
      );
      const list = Array.isArray(data?.permissions) ? data.permissions : [];
      const map = new Map();
      for (const p of list) {
        if (!p) continue;
        const mid = String(p.memberId._id);
        if (mid) map.set(mid, !!p.locked);
      }
      setPermMap(map);
    } catch {
      setPermMap(new Map());
    } finally {
      setLoading(false);
    }
    return () => ac.abort();
  }, [api, folderId]);

  const getMemberPermission = useCallback(
    (memberId) => {
      if (!memberId) return null;
      const key = String(memberId);
      return permMap.has(key) ? permMap.get(key) : null;
    },
    [permMap]
  );

  const handleGrantPermission = useCallback(
    async (memberId, locked) => {
      if (!folderId || !memberId) return;
      setLoading(true);
      try {
        await api.postPermission(folderId, memberId, locked, tokenRef.current);
        setPermMap((prev) => {
          const next = new Map(prev);
          next.set(String(memberId), !!locked);
          return next;
        });
        onPermissionChange?.();
      } finally {
        setLoading(false);
      }
    },
    [api, folderId, onPermissionChange]
  );

  const handleRevokePermission = useCallback(
    async (memberId) => {
      if (!folderId || !memberId) return;
      setLoading(true);
      try {
        await api.deletePermission(folderId, memberId, tokenRef.current);
        setPermMap((prev) => {
          const next = new Map(prev);
          next.delete(String(memberId));
          return next;
        });
        onPermissionChange?.();
      } finally {
        setLoading(false);
      }
    },
    [api, folderId, onPermissionChange]
  );

  return {
    t,
    members,
    loading,
    isLoadingList,
    isFolder,
    fetchMembers,
    fetchCurrentPermissions,
    handleGrantPermission,
    handleRevokePermission,
    getMemberPermission,
  };
}
