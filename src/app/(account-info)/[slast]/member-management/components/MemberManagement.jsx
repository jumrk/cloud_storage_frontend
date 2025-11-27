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
    <div className="w-full mx-auto bg-white p-8 px-5">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-strong mb-1">
          {t("user_management.page_title")}
        </h1>
        <p className="text-text-muted text-sm">{t("user_management.title")}</p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="grid md:flex items-center gap-2 w-full sm:w-auto ">
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <FiSearch />
            </span>
            <input
              type="text"
              placeholder={t("user_management.search_placeholder")}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-4 md:py-2 rounded-lg bg-brand hover:opacity-95 text-white font-semibold text-sm shadow-sm"
            onClick={handleOpenModal}
          >
            <FiPlus className="text-lg" /> {t("user_management.add_user")}
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
      <div className="overflow-x-auto mt-10 bg-white px-5">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-surface-50 text-text-muted text-xs uppercase">
              <th className="px-4 py-3 text-left font-semibold">
                {t("user_management.user_name")}
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                {t("user_management.added_date")}
              </th>
              <th
                className="px-4 py-2 cursor-pointer select-none"
                onClick={() =>
                  setSortFolderCount(sortFolderCount === "asc" ? "desc" : "asc")
                }
              >
                {t("user_management.folders_managed")}
                {sortFolderCount === "asc" && <span> ▲</span>}
                {sortFolderCount === "desc" && <span> ▼</span>}
              </th>
              <th className="px-4 py-2">{t("user_management.storage_used")}</th>
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
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-text-strong leading-tight">
                          <Skeleton width={100} height={18} />
                        </div>
                        <div className="text-text-muted text-xs">
                          <Skeleton width={120} height={14} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-strong text-center">
                    <Skeleton width={80} height={16} />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Skeleton width={40} height={16} />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Skeleton width={60} height={16} />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Skeleton width={60} height={16} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Skeleton width={60} height={28} />
                  </td>
                </tr>
              ))
            ) : sortedMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-text-muted">
                  <EmptyState message={t("user_management.no_members_found")} />
                </td>
              </tr>
            ) : (
              sortedMembers.map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-border last:border-b-0 hover:bg-surface-50 transition group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-text-strong leading-tight">
                          {user.fullName}
                        </div>
                        <div className="text-text-muted text-xs">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-strong text-center">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {memberStats[user._id]?.folderCount != null ? (
                      memberStats[user._id].folderCount
                    ) : loadingStats ? (
                      <span>...</span>
                    ) : (
                      0
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {memberStats[user._id]?.usedStorage != null ? (
                      (
                        memberStats[user._id].usedStorage /
                        (1024 * 1024)
                      ).toFixed(2) + " MB"
                    ) : loadingStats ? (
                      <span>...</span>
                    ) : (
                      "0 MB"
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {user.maxUser || user.plan?.users || "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-text-muted hover:text-brand p-2 rounded-full"
                      onClick={() => handleOpenEditModal(user)}
                      title={t("user_management.edit")}
                    >
                      <FiEdit2 className="text-lg" />
                    </button>
                    <button
                      className="text-text-muted hover:text-danger p-2 rounded-full"
                      onClick={() => handleDeleteUser(user)}
                      title={t("user_management.delete")}
                    >
                      <FiTrash2 className="text-lg" />
                    </button>
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

