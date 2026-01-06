"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  FiX,
  FiSearch,
  FiCheck,
  FiCamera,
  FiUserPlus,
  FiUserMinus,
  FiLogOut,
  FiTrash2,
  FiShield,
  FiEdit2,
  FiSave,
} from "react-icons/fi";
import { useTranslations } from "next-intl";
import Image from "next/image";
import axiosClient from "@/shared/lib/axiosClient";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";

export default function GroupSettingsModal({
  open,
  onClose,
  group,
  myId,
  onGroupUpdated = () => {},
  onLeaveGroup = () => {},
  onDeleteGroup = () => {},
}) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = React.useRef(null);

  // Add members
  const [searchUsers, setSearchUsers] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Confirm dialogs
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  const isOwner = String(group?.owner) === String(myId);
  const memberDetail = group?.memberDetails?.find(
    (m) => String(m.user) === String(myId)
  );
  const isAdmin = memberDetail?.role === "admin" || isOwner;

  useEffect(() => {
    if (group) {
      setNameInput(group.name || "");
      setDescriptionInput(group.description || "");
    }
  }, [group]);

  // Search users to add
  useEffect(() => {
    if (!searchUsers.trim() || !open) {
      setAvailableUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingUsers(true);
      try {
        const res = await axiosClient.get(
          `/api/user/search?query=${encodeURIComponent(searchUsers)}`
        );
        const existingIds =
          group?.members?.map((m) => String(m.id || m._id)) || [];
        const filteredUsers = (res.data.users || []).filter(
          (u) => !existingIds.includes(String(u._id))
        );
        setAvailableUsers(filteredUsers);
      } catch {
        setAvailableUsers([]);
      }
      setLoadingUsers(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchUsers, open, group]);

  const handleUpdateName = async () => {
    if (!nameInput.trim() || !group?.id) return;
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.patch(`/api/message/group/${group.id}`, {
        name: nameInput.trim(),
        description: descriptionInput.trim(),
      });
      if (res.data.group) {
        onGroupUpdated(res.data.group);
      }
      setEditingName(false);
    } catch (err) {
      setError(err?.response?.data?.error || "Không thể cập nhật nhóm");
    }
    setLoading(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !group?.id) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh không được vượt quá 5MB");
      return;
    }

    setUploadingAvatar(true);
    setError("");
    try {
      // Use FormData to upload file
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await axiosClient.post(
        `/api/message/group/${group.id}/avatar`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (res.data.group) {
        onGroupUpdated(res.data.group);
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Không thể cập nhật ảnh nhóm");
    }
    setUploadingAvatar(false);

    // Reset input
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleAddMembers = async () => {
    if (!selectedNewMembers.length || !group?.id) return;
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.post(
        `/api/message/group/${group.id}/members`,
        { memberIds: selectedNewMembers }
      );
      if (res.data.group) {
        onGroupUpdated(res.data.group);
      }
      setSelectedNewMembers([]);
      setSearchUsers("");
    } catch (err) {
      setError(err?.response?.data?.error || "Không thể thêm thành viên");
    }
    setLoading(false);
  };

  const handleRemoveMember = async (memberId) => {
    if (!memberId || !group?.id) return;
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.delete(
        `/api/message/group/${group.id}/members`,
        { data: { memberIds: [memberId] } }
      );
      if (res.data.group) {
        onGroupUpdated(res.data.group);
      }
      setMemberToRemove(null);
    } catch (err) {
      setError(err?.response?.data?.error || "Không thể xóa thành viên");
    }
    setLoading(false);
  };

  const handleUpdateRole = async (memberId, role) => {
    if (!memberId || !group?.id) return;
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.patch(
        `/api/message/group/${group.id}/members/${memberId}/role`,
        { role }
      );
      if (res.data.group) {
        onGroupUpdated(res.data.group);
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Không thể thay đổi vai trò");
    }
    setLoading(false);
  };

  const handleLeaveGroup = async () => {
    if (!group?.id) return;
    setLoading(true);
    setError("");
    try {
      await axiosClient.post(`/api/message/group/${group.id}/leave`);
      onLeaveGroup(group.id);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || "Không thể rời nhóm");
    }
    setLoading(false);
  };

  const handleDeleteGroup = async () => {
    if (!group?.id) return;
    setLoading(true);
    setError("");
    try {
      await axiosClient.delete(`/api/message/group/${group.id}`);
      onDeleteGroup(group.id);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || "Không thể xóa nhóm");
    }
    setLoading(false);
  };

  const getMemberRole = (memberId) => {
    if (String(memberId) === String(group?.owner)) return "owner";
    const detail = group?.memberDetails?.find(
      (m) => String(m.user) === String(memberId)
    );
    return detail?.role || "member";
  };

  if (!open || !group) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-lg font-semibold text-gray-900">Cài đặt nhóm</h3>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-[var(--color-surface-50)] transition"
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border)]">
          {[
            { key: "info", label: "Thông tin" },
            {
              key: "members",
              label: `Thành viên (${group.members?.length || 0})`,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`flex-1 py-3 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "text-brand border-b-2 border-brand"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[var(--color-danger-50)] text-[var(--color-danger-500)] text-sm">
              {error}
            </div>
          )}
          {activeTab === "info" && (
            <div className="space-y-5">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="relative">
                  <Image
                    src={getAvatarUrl(group.avatar)}
                    alt="Group avatar"
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-[var(--color-border)]"
                    width={96}
                    height={96}
                  />
                  {isAdmin && (
                    <>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <button
                        type="button"
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center shadow-lg hover:opacity-90 transition disabled:opacity-50"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FiCamera size={14} />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase mb-1 block">
                  Tên nhóm
                </label>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-brand/30"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="p-2 rounded-xl bg-brand text-white"
                      onClick={handleUpdateName}
                      disabled={loading}
                    >
                      <FiSave size={16} />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-xl bg-[var(--color-surface-50)]"
                      onClick={() => {
                        setEditingName(false);
                        setNameInput(group.name || "");
                      }}
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{group.name}</p>
                    {isAdmin && (
                      <button
                        type="button"
                        className="p-2 rounded-xl hover:bg-[var(--color-surface-50)] text-gray-600"
                        onClick={() => setEditingName(true)}
                      >
                        <FiEdit2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {/* Description */}
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase mb-1 block">
                  Mô tả
                </label>
                {isAdmin ? (
                  <textarea
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
                    rows={3}
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    placeholder="Thêm mô tả cho nhóm..."
                  />
                ) : (
                  <p className="text-gray-600">
                    {group.description || "Chưa có mô tả"}
                  </p>
                )}
              </div>
              {/* Actions */}
              <div className="pt-4 border-t border-[var(--color-border)] space-y-2">
                {!isOwner && (
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)] transition"
                    onClick={() => setConfirmLeave(true)}
                  >
                    <FiLogOut size={18} /> Rời khỏi nhóm
                  </button>
                )}
                {isOwner && (
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)] transition"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <FiTrash2 size={18} /> Xóa nhóm
                  </button>
                )}
              </div>
            </div>
          )}
          {activeTab === "members" && (
            <div className="space-y-4">
              {/* Add members */}
              {isAdmin && (
                <div className="space-y-3">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-50)] focus:outline-none focus:ring-2 focus:ring-brand/30"
                      placeholder="Tìm kiếm người dùng để thêm..."
                      value={searchUsers}
                      onChange={(e) => setSearchUsers(e.target.value)}
                    />
                  </div>
                  {loadingUsers && (
                    <p className="text-sm text-gray-600 text-center py-2">
                      Đang tìm kiếm...
                    </p>
                  )}
                  {availableUsers.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableUsers.map((user) => (
                        <button
                          key={user._id}
                          type="button"
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                            selectedNewMembers.includes(user._id)
                              ? "bg-brand/10 border border-brand"
                              : "bg-[var(--color-surface-50)] hover:bg-[var(--color-surface-100)]"
                          }`}
                          onClick={() => {
                            setSelectedNewMembers((prev) =>
                              prev.includes(user._id)
                                ? prev.filter((id) => id !== user._id)
                                : [...prev, user._id]
                            );
                          }}
                        >
                          <Image
                            src={getAvatarUrl(user.avatar)}
                            alt="avatar"
                            className="w-10 h-10 rounded-full object-cover"
                            width={40}
                            height={40}
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <p className="font-medium text-gray-900 truncate">
                              {user.fullName || user.email}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {user.email}
                            </p>
                          </div>
                          {selectedNewMembers.includes(user._id) && (
                            <FiCheck className="text-brand" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedNewMembers.length > 0 && (
                    <button
                      type="button"
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand text-white font-medium hover:opacity-90 transition disabled:opacity-50"
                      onClick={handleAddMembers}
                      disabled={loading}
                    >
                      <FiUserPlus size={16} /> Thêm {selectedNewMembers.length}
                      thành viên
                    </button>
                  )}
                </div>
              )}
              {/* Member list */}
              <div className="space-y-2">
                {group.members?.map((member) => {
                  const memberId = member.id || member._id;
                  const role = getMemberRole(memberId);
                  const isCurrentUser = String(memberId) === String(myId);
                  return (
                    <div
                      key={memberId}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-50)]"
                    >
                      <Image
                        src={getAvatarUrl(member.avatar)}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover"
                        width={40}
                        height={40}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">
                            {member.fullName || member.name || member.email}
                          </p>
                          {isCurrentUser && (
                            <span className="text-xs text-gray-600">(Bạn)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              role === "owner"
                                ? "bg-yellow-100 text-yellow-700"
                                : role === "admin"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {role === "owner"
                              ? "Chủ nhóm"
                              : role === "admin"
                              ? "Quản trị viên"
                              : "Thành viên"}
                          </span>
                        </div>
                      </div>
                      {/* Actions */}
                      {isOwner && !isCurrentUser && role !== "owner" && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="p-2 rounded-lg hover:bg-white text-gray-600 hover:text-gray-900 transition"
                            title={
                              role === "admin" ? "Hạ cấp" : "Thăng cấp Admin"
                            }
                            onClick={() =>
                              handleUpdateRole(
                                memberId,
                                role === "admin" ? "member" : "admin"
                              )
                            }
                          >
                            <FiShield size={14} />
                          </button>
                          <button
                            type="button"
                            className="p-2 rounded-lg hover:bg-white text-[var(--color-danger-500)] transition"
                            title="Xóa khỏi nhóm"
                            onClick={() => setMemberToRemove(member)}
                          >
                            <FiUserMinus size={14} />
                          </button>
                        </div>
                      )}
                      {isAdmin &&
                        !isOwner &&
                        !isCurrentUser &&
                        role === "member" && (
                          <button
                            type="button"
                            className="p-2 rounded-lg hover:bg-white text-[var(--color-danger-500)] transition"
                            title="Xóa khỏi nhóm"
                            onClick={() => setMemberToRemove(member)}
                          >
                            <FiUserMinus size={14} />
                          </button>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Confirm Leave Modal */}
      {confirmLeave && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={() => setConfirmLeave(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Rời khỏi nhóm?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn sẽ không còn nhận được tin nhắn từ nhóm này.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-900 hover:bg-[var(--color-surface-50)] transition"
                onClick={() => setConfirmLeave(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-danger-500)] text-white hover:opacity-90 transition"
                onClick={handleLeaveGroup}
                disabled={loading}
              >
                Rời nhóm
              </button>
            </div>
          </div>
        </>
      )}
      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={() => setConfirmDelete(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Xóa nhóm?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Tất cả tin nhắn và dữ liệu nhóm sẽ bị xóa vĩnh viễn. Hành động này
              không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-900 hover:bg-[var(--color-surface-50)] transition"
                onClick={() => setConfirmDelete(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-danger-500)] text-white hover:opacity-90 transition"
                onClick={handleDeleteGroup}
                disabled={loading}
              >
                Xóa nhóm
              </button>
            </div>
          </div>
        </>
      )}
      {/* Confirm Remove Member Modal */}
      {memberToRemove && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={() => setMemberToRemove(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Xóa thành viên?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {memberToRemove.fullName ||
                memberToRemove.name ||
                memberToRemove.email}
              {""} sẽ bị xóa khỏi nhóm.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-900 hover:bg-[var(--color-surface-50)] transition"
                onClick={() => setMemberToRemove(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-danger-500)] text-white hover:opacity-90 transition"
                onClick={() =>
                  handleRemoveMember(memberToRemove.id || memberToRemove._id)
                }
                disabled={loading}
              >
                Xóa
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
