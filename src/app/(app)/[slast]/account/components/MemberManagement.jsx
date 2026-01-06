"use client";
import React, { useEffect } from "react";
import { FiSearch, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import EmptyState from "@/shared/ui/EmptyState";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import ModalAdd from "./ModalAdd";
import ModalEdit from "./ModalEdit";
import useMemberManagement from "../hooks/useMemberManagement";
import { postMemberStats } from "../services/memberManagementService";

function User_Management_Page() {
  const {
    t,
    members,
    loading,
    showModal,
    form,
    emailExists,
    slastExists,
    checkingEmail,
    checkingSlast,
    memberStats,
    loadingStats,
    editModal,
    editForm,
    editError,
    searchText,
    sortFolderCount,
    confirmDialog,
    sortedMembers,
    setMemberStats,
    setLoadingStats,
    setSearchText,
    setSortFolderCount,
    setConfirmDialog,
    fetchMembers,
    handleOpenModal,
    handleCloseModal,
    handleFormChange,
    handleFormSubmit,
    handleOpenEditModal,
    handleCloseEditModal,
    handleEditFormChange,
    handleEditFormSubmit,
    handleDeleteUser,
    handleConfirmDelete,
  } = useMemberManagement();

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (!members.length) return;
    setLoadingStats(true);
    postMemberStats(members)
      .then((res) => {
        setMemberStats(res.data.stats || {});
        setLoadingStats(false);
      })
      .catch(() => setLoadingStats(false));
  }, [members]);

  return (
    <div className="w-full mx-auto bg-white">
      <div className="mb-6">
        <h1 className="text-base font-semibold text-gray-900 mb-1">
          {t("user_management.page_title")}
        </h1>
        <p className="text-gray-600 text-xs">{t("user_management.title")}</p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="grid md:flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
              <FiSearch size={16} />
            </span>
            <input
              type="text"
              placeholder={t("user_management.search_placeholder")}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand hover:opacity-95 text-white font-medium text-sm shadow-sm transition-colors"
            onClick={handleOpenModal}
          >
            <FiPlus size={16} /> {t("user_management.add_user")}
          </button>
        </div>
      </div>
      {showModal && (
        <ModalAdd
          t={t}
          checkingEmail={checkingEmail}
          checkingSlast={checkingSlast}
          emailExists={emailExists}
          form={form}
          loading={loading}
          slastExists={slastExists}
          handleCloseModal={handleCloseModal}
          handleFormChange={handleFormChange}
          handleFormSubmit={handleFormSubmit}
        />
      )}
      {editModal.open && (
        <ModalEdit
          t={t}
          editForm={editForm}
          editError={editError}
          loading={loading}
          handleEditFormSubmit={handleEditFormSubmit}
          handleCloseEditModal={handleCloseEditModal}
          handleEditFormChange={handleEditFormChange}
        />
      )}
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold">
                {t("user_management.user_name")}
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                {t("user_management.added_date")}
              </th>
              <th
                className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:text-gray-900 transition-colors"
                onClick={() =>
                  setSortFolderCount(sortFolderCount === "asc" ? "desc" : "asc")
                }
              >
                <div className="flex items-center gap-1">
                  {t("user_management.folders_managed")}
                  {sortFolderCount === "asc" && <span className="text-xs">▲</span>}
                  {sortFolderCount === "desc" && <span className="text-xs">▼</span>}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold">{t("user_management.storage_used")}</th>
              <th className="px-4 py-3 text-left font-semibold">
                {t("user_management.max_users")}
              </th>
              <th className="px-4 py-3 text-right font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-gray-900 leading-tight">
                          <Skeleton width={100} height={18} />
                        </div>
                        <div className="text-gray-600 text-xs">
                          <Skeleton width={120} height={14} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <Skeleton width={80} height={16} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <Skeleton width={40} height={16} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <Skeleton width={60} height={16} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <Skeleton width={60} height={16} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Skeleton width={60} height={28} />
                  </td>
                </tr>
              ))
            ) : sortedMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-600">
                  <EmptyState message={t("user_management.no_members_found")} />
                </td>
              </tr>
            ) : (
              sortedMembers.map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-gray-900 leading-tight">
                          {user.fullName || "-"}
                        </div>
                        <div className="text-gray-600 text-xs">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {memberStats[user._id]?.folderCount != null ? (
                      memberStats[user._id].folderCount
                    ) : loadingStats ? (
                      <span className="text-gray-400">...</span>
                    ) : (
                      0
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {memberStats[user._id]?.usedStorage != null ? (
                      (
                        memberStats[user._id].usedStorage /
                        (1024 * 1024)
                      ).toFixed(2) + " MB"
                    ) : loadingStats ? (
                      <span className="text-gray-400">...</span>
                    ) : (
                      "0 MB"
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {user.maxUser || user.plan?.users || "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="text-gray-500 hover:text-brand p-2 rounded-lg hover:bg-brand/10 transition-colors"
                        onClick={() => handleOpenEditModal(user)}
                        title={t("user_management.edit")}
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        className="text-gray-500 hover:text-danger p-2 rounded-lg hover:bg-danger/10 transition-colors"
                        onClick={() => handleDeleteUser(user)}
                        title={t("user_management.delete")}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, user: null })}
        onConfirm={handleConfirmDelete}
        title={t("user_management.confirm_delete_title")}
        message={t("user_management.confirm_delete_message", {
          name: confirmDialog.user?.fullName || "",
        })}
        confirmText={t("user_management.delete")}
        cancelText={t("user_management.cancel")}
        loading={loading}
      />
    </div>
  );
}

export default User_Management_Page;
