"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import googleAccountService from "../services/googleAccountService";

export default function useGoogleAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [minUsed, setMinUsed] = useState("");
  const [maxUsed, setMaxUsed] = useState("");
  const [loading, setLoading] = useState(true);
  const [used, setUsed] = useState(0);
  const [total, setTotal] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchStorageSummary = useCallback(async () => {
    try {
      const res = await googleAccountService.getStorageSummary();
      setUsed(res.used || 0);
      setTotal(res.total || 0);
    } catch (err) {
      setUsed(0);
      setTotal(0);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.email = search;
      if (minUsed) params.minUsed = minUsed;
      if (maxUsed) params.maxUsed = maxUsed;
      const res = await googleAccountService.getAccounts(params);
      setAccounts(res.accounts || res.data || []);
    } catch (err) {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [search, minUsed, maxUsed]);

  useEffect(() => {
    fetchStorageSummary();
  }, [fetchStorageSummary]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleDeleteRequest = (account) => {
    setDeletingAccount(account);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAccount) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await googleAccountService.deleteAccount(
        deletingAccount._id
      );
      if (res?.success) {
        setAccounts((prev) =>
          prev.filter((account) => account._id !== deletingAccount._id)
        );
        toast.success("Xóa tài khoản thành công!");
        setShowDeleteModal(false);
        setDeletingAccount(null);
      } else {
        setDeleteError(res?.error || "Xóa tài khoản thất bại");
      }
    } catch (err) {
      setDeleteError("Xóa tài khoản thất bại");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRelink = (account) => {
    toast("Liên kết lại tài khoản: " + (account?.email || ""), {
      icon: "🔄",
    });
  };

  return {
    accounts,
    loading,
    used,
    total,
    search,
    setSearch,
    minUsed,
    setMinUsed,
    maxUsed,
    setMaxUsed,
    fetchAccounts,
    showDeleteModal,
    setShowDeleteModal,
    deletingAccount,
    setDeletingAccount,
    deleteLoading,
    deleteError,
    handleDeleteRequest,
    handleConfirmDelete,
    handleRelink,
    refreshStorage: fetchStorageSummary,
  };
}


