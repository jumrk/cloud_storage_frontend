"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import EmptyState from "@/shared/ui/EmptyState";
import Modal from "@/shared/ui/Modal";
import useGoogleAccountsPage from "../hooks/useGoogleAccountsPage";
import TotalStorageBar from "./TotalStorageBar";
import DriveAccountCard from "./DriveAccountCard";

const oauthUrl = process.env.NEXT_PUBLIC_API_BASE
  ? `${process.env.NEXT_PUBLIC_API_BASE}/api/auth/oauth`
  : "/api/auth/oauth";

export default function GoogleAccountsPage() {
  const {
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
    deleteLoading,
    deleteError,
    handleDeleteRequest,
    handleConfirmDelete,
    handleRelink,
  } = useGoogleAccountsPage();

  return (
    <div className="w-full max-w-6xl mx-auto px-2 py-4">
      <div className="mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          Quản lý tài khoản Google
        </h1>
        <p className="text-gray-500 text-sm">
          Quản lý các tài khoản Google Drive đã liên kết tại đây.
        </p>
      </div>

      <div className="mb-6 flex justify-center">
        <div className="w-full md:w-2/3">
          {loading ? (
            <Skeleton height={32} borderRadius={12} />
          ) : (
            <TotalStorageBar used={used || 0} total={total || 0} />
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-6">
        <input
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-full md:w-64"
          placeholder="Tìm kiếm email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-full md:w-40"
          placeholder="Min used (MB)"
          type="number"
          value={minUsed}
          onChange={(e) => setMinUsed(e.target.value)}
        />
        <input
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-full md:w-40"
          placeholder="Max used (MB)"
          type="number"
          value={maxUsed}
          onChange={(e) => setMaxUsed(e.target.value)}
        />
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm md:ml-2"
          onClick={fetchAccounts}
        >
          Lọc
        </button>
        <a
          href={oauthUrl}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black hover:bg-gray-800 text-white font-semibold text-sm md:ml-auto"
        >
          + Liên kết tài khoản
        </a>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow p-6 flex flex-col items-center border border-gray-200"
            >
              <Skeleton circle width={48} height={48} className="mb-3" />
              <Skeleton width={120} height={18} />
              <Skeleton width={80} height={14} className="mt-2" />
              <Skeleton width={100} height={16} className="mt-2" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center w-full py-12">
          <EmptyState message="Không có tài khoản nào." height={180} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {accounts.map((account) => (
            <DriveAccountCard
              key={account._id}
              account={account}
              onDelete={handleDeleteRequest}
              onRelink={handleRelink}
            />
          ))}
        </div>
      )}

      {showDeleteModal && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <div className="p-6 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">
              Bạn có chắc chắn muốn xóa tài khoản này? Tất cả file sẽ được tự
              động chuyển sang các tài khoản còn lại.
            </h2>
            {deleteError && (
              <div className="text-red-500 text-sm mb-2">{deleteError}</div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 rounded bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
              >
                {deleteLoading ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


