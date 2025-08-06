"use client";
import React, { useState } from "react";
import {
  FiSearch,
  FiFilter,
  FiMoreHorizontal,
  FiPlus,
  FiEye,
  FiEyeOff,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import axiosClient from "@/lib/axiosClient";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useTranslations } from "next-intl";

function User_Management_Page() {
  const t = useTranslations();
  const [showPassword, setShowPassword] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    password: "",
    slast: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [emailExists, setEmailExists] = useState(false);
  const [slastExists, setSlastExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingSlast, setCheckingSlast] = useState(false);
  const [memberStats, setMemberStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, user: null });
  const [editForm, setEditForm] = useState({
    email: "",
    fullName: "",
    password: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [searchText, setSearchText] = useState("");
  // Remove filterRole state and dropdown
  const [sortFolderCount, setSortFolderCount] = useState(null); // null, 'asc', 'desc'
  // Remove selectedIds state and all multi-select logic
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    user: null,
  });

  // Fetch members on mount
  React.useEffect(() => {
    fetchMembers();
  }, []);

  // After fetching members, fetch stats for all members:
  React.useEffect(() => {
    if (!members.length) return;
    setLoadingStats(true);
    axiosClient
      .post("/api/user/members/stats", { memberIds: members.map((m) => m._id) })
      .then((res) => {
        setMemberStats(res.data.stats || {});
        setLoadingStats(false);
      })
      .catch(() => setLoadingStats(false));
  }, [members]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/api/user/members");
      const data = res.data;
      if (data.members) setMembers(data.members);
      else setMembers([]);
    } catch (e) {
      toast.error(t("user_management.load_members_error"));
      setMembers([]);
    }
    setLoading(false);
  };

  const handleOpenModal = () => {
    setForm({ email: "", fullName: "", password: "", slast: "" });
    setFormError("");
    setEmailExists(false);
    setSlastExists(false);
    setCheckingEmail(false);
    setCheckingSlast(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError("");
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
    if (e.target.name === "email") {
      setEmailExists(false);
      setCheckingEmail(true);
      if (e.target.value && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.target.value)) {
        axiosClient
          .get("/api/user/check-email", { params: { email: e.target.value } })
          .then((res) => setEmailExists(res.data.exists))
          .catch(() => setEmailExists(false))
          .finally(() => setCheckingEmail(false));
      } else {
        setCheckingEmail(false);
      }
    }
    if (e.target.name === "slast") {
      setSlastExists(false);
      setCheckingSlast(true);
      if (e.target.value && /^[a-zA-Z0-9_-]+$/.test(e.target.value)) {
        axiosClient
          .get("/api/user/check-slast", { params: { slast: e.target.value } })
          .then((res) => setSlastExists(res.data.exists))
          .catch(() => setSlastExists(false))
          .finally(() => setCheckingSlast(false));
      } else {
        setCheckingSlast(false);
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    if (emailExists) {
      setFormError(t("user_management.email_exists"));
      setFormLoading(false);
      return;
    }
    if (slastExists) {
      setFormError(t("user_management.slast_exists"));
      setFormLoading(false);
      return;
    }
    try {
      const res = await axiosClient.post("/api/user/members", form);
      const data = res.data;
      if (data.success) {
        toast.success(t("user_management.create_success"));
        setShowModal(false);
        fetchMembers();
      } else {
        setFormError(data.error || t("user_management.create_failed"));
        toast.error(data.error || t("user_management.create_failed"));
      }
    } catch (e) {
      let errorMsg = t("user_management.connection_error");
      if (e.response && e.response.data && e.response.data.error) {
        errorMsg = e.response.data.error;
      }
      setFormError(errorMsg);
      toast.error(errorMsg);
    }
    setFormLoading(false);
  };

  const handleOpenEditModal = (user) => {
    setEditForm({ email: user.email, fullName: user.fullName, password: "" });
    setEditModal({ open: true, user });
    setEditError("");
  };
  const handleCloseEditModal = () => {
    setEditModal({ open: false, user: null });
    setEditError("");
  };
  const handleEditFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    try {
      const res = await axiosClient.patch(
        `/api/user/members/${editModal.user._id}`,
        editForm
      );
      const data = res.data;
      if (data.success) {
        toast.success(t("user_management.update_success"));
        setEditModal({ open: false, user: null });
        fetchMembers();
      } else {
        setEditError(data.error || t("user_management.update_failed"));
        toast.error(data.error || t("user_management.update_failed"));
      }
    } catch (e) {
      setEditError(t("user_management.connection_error"));
      toast.error(t("user_management.connection_error"));
    }
    setEditLoading(false);
  };
  const handleDeleteUser = async (user) => {
    setConfirmDialog({ open: true, user });
  };

  const handleConfirmDelete = async () => {
    const user = confirmDialog.user;
    if (!user) return;
    try {
      const res = await axiosClient.delete(`/api/user/members/${user._id}`);
      const data = res.data;
      if (data.success) {
        toast.success(t("user_management.delete_success"));
        fetchMembers();
      } else {
        toast.error(data.error || t("user_management.delete_failed"));
      }
    } catch (e) {
      toast.error(t("user_management.connection_error"));
    }
    setConfirmDialog({ open: false, user: null });
  };
  // Compute filtered members (search only)
  const filteredMembers = members.filter((user) => {
    return (
      user.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchText.toLowerCase())
    );
  });
  // Sort by folderCount if needed
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const aCount = memberStats[a._id]?.folderCount || 0;
    const bCount = memberStats[b._id]?.folderCount || 0;
    if (!sortFolderCount) return 0;
    if (sortFolderCount === "asc") return aCount - bCount;
    return bCount - aCount;
  });

  return (
    <div className="w-full mx-auto bg-white p-8 mt-8 px-5">
      {/* Tiêu đề & mô tả */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {t("user_management.page_title")}
        </h1>
        <p className="text-gray-500 text-sm">{t("user_management.title")}</p>
      </div>
      {/* Thanh công cụ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="grid md:flex items-center gap-2 w-full sm:w-auto ">
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FiSearch />
            </span>
            <input
              type="text"
              placeholder={t("user_management.search_placeholder")}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          {/* Remove filter dropdown from toolbar */}
          <button
            className="flex items-center gap-2 px-4 py-4 md:py-2 rounded-lg bg-black hover:bg-gray-800 text-white font-semibold text-sm shadow-sm"
            onClick={handleOpenModal}
          >
            <FiPlus className="text-lg" /> {t("user_management.add_user")}
          </button>
        </div>
      </div>
      {/* Modal tạo member */}
      {showModal && (
        <div className="fixed inset-0  z-50 flex items-center px-3 justify-center bg-black/30">
          <div className="bg-white rounded-3xl p-6  shadow-2xl relative border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-center">
              {t("user_management.add_new")}
            </h2>
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                name="email"
                placeholder={t("user_management.email_placeholder")}
                className="border rounded-lg px-4 py-3"
                value={form.email}
                onChange={handleFormChange}
                required
                autoComplete="off"
                disabled={formLoading}
              />
              {checkingEmail && (
                <div className="text-xs text-blue-500">
                  {t("user_management.checking_email")}
                </div>
              )}
              {emailExists && !checkingEmail && (
                <div className="text-xs text-red-500">
                  {t("user_management.email_exists")}
                </div>
              )}
              <input
                type="text"
                name="fullName"
                placeholder={t("user_management.fullname_placeholder")}
                className="border rounded-lg px-4 py-3"
                value={form.fullName}
                onChange={handleFormChange}
                required
                autoComplete="off"
                disabled={formLoading}
              />
              <input
                type="password"
                name="password"
                placeholder={t("user_management.password_placeholder")}
                className="border rounded-lg px-4 py-3"
                value={form.password}
                onChange={handleFormChange}
                required
                autoComplete="off"
                disabled={formLoading}
              />
              <div>
                <input
                  type="text"
                  name="slast"
                  placeholder={t("user_management.slast_placeholder")}
                  className="border rounded-lg px-4 py-3 w-full"
                  value={form.slast}
                  onChange={handleFormChange}
                  required
                  autoComplete="off"
                  disabled={formLoading}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {t("user_management.slast_description")}{" "}
                  {t("user_management.member_example")}{" "}
                  <b>{t("user_management.slast_path")}</b>
                  ). {t("user_management.slast_unique")}
                </div>
                {checkingSlast && (
                  <div className="text-xs text-blue-500">
                    {t("user_management.checking_slast")}
                  </div>
                )}
                {slastExists && !checkingSlast && (
                  <div className="text-xs text-red-500">
                    {t("user_management.slast_exists")}
                  </div>
                )}
              </div>
              {/* XÓA: Không hiển thị lỗi dưới form nữa */}
              {/*
              {formError && (
                <div className="text-red-500 text-sm">{formError}</div>
              )}
              */}
              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200"
                  onClick={handleCloseModal}
                  disabled={formLoading}
                >
                  {t("user_management.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-primary text-white disabled:bg-gray-300 font-semibold"
                  disabled={
                    formLoading ||
                    emailExists ||
                    slastExists ||
                    checkingEmail ||
                    checkingSlast
                  }
                >
                  {formLoading
                    ? t("user_management.creating")
                    : t("user_management.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal chỉnh sửa member */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center px-3 justify-center bg-black/30">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <h2 className="text-lg font-bold mb-4">
              {t("user_management.edit_title")}
            </h2>
            <form
              onSubmit={handleEditFormSubmit}
              className="flex flex-col gap-3"
            >
              <input
                type="email"
                name="email"
                placeholder={t("user_management.email_placeholder")}
                className="border rounded px-3 py-2"
                value={editForm.email}
                onChange={handleEditFormChange}
                required
              />
              <input
                type="text"
                name="fullName"
                placeholder={t("user_management.fullname_placeholder")}
                className="border rounded px-3 py-2"
                value={editForm.fullName}
                onChange={handleEditFormChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder={t("user_management.new_password_placeholder")}
                className="border rounded px-3 py-2"
                value={editForm.password}
                onChange={handleEditFormChange}
              />
              {editError && (
                <div className="text-red-500 text-sm">{editError}</div>
              )}
              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200"
                  onClick={handleCloseEditModal}
                  disabled={editLoading}
                >
                  {t("user_management.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-primary text-white disabled:bg-gray-300"
                  disabled={editLoading}
                >
                  {editLoading
                    ? t("user_management.saving")
                    : t("user_management.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bảng user */}
      <div className="overflow-x-auto mt-10 bg-white px-5">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
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
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-gray-900 leading-tight">
                          <Skeleton width={100} height={18} />
                        </div>
                        <div className="text-gray-500 text-xs">
                          <Skeleton width={120} height={14} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-center">
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
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  <EmptyState message={t("user_management.no_members_found")} />
                </td>
              </tr>
            ) : (
              sortedMembers.map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-gray-900 leading-tight">
                          {user.fullName}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-center">
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
                      className="text-gray-400 hover:text-blue-600 p-2 rounded-full"
                      onClick={() => handleOpenEditModal(user)}
                      title={t("user_management.edit")}
                    >
                      <FiEdit2 className="text-lg" />
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-600 p-2 rounded-full"
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
      {/* ConfirmDialog khi xóa user */}
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
      />
    </div>
  );
}

export default User_Management_Page;
