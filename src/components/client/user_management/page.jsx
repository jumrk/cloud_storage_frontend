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

function User_Management_Page() {
  const [showPassword, setShowPassword] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: "", fullName: "", password: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
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
      toast.error("Lỗi khi tải danh sách thành viên");
      setMembers([]);
    }
    setLoading(false);
  };

  const handleTogglePassword = (id) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyPassword = (id, password) => {
    if (showPassword[id]) {
      navigator.clipboard.writeText(password);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    }
  };

  const handleOpenModal = () => {
    setForm({ email: "", fullName: "", password: "" });
    setFormError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError("");
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      const res = await axiosClient.post("/api/user/members", form);
      const data = res.data;
      if (data.success) {
        toast.success("Tạo thành viên thành công!");
        setShowModal(false);
        fetchMembers();
      } else {
        setFormError(data.error || "Tạo thành viên thất bại");
        toast.error(data.error || "Tạo thành viên thất bại");
      }
    } catch (e) {
      setFormError("Lỗi kết nối");
      toast.error("Lỗi kết nối");
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
        toast.success("Cập nhật thành viên thành công!");
        setEditModal({ open: false, user: null });
        fetchMembers();
      } else {
        setEditError(data.error || "Cập nhật thất bại");
        toast.error(data.error || "Cập nhật thất bại");
      }
    } catch (e) {
      setEditError("Lỗi kết nối");
      toast.error("Lỗi kết nối");
    }
    setEditLoading(false);
  };
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Bạn có chắc muốn xóa thành viên ${user.fullName}?`))
      return;
    try {
      const res = await axiosClient.delete(`/api/user/members/${user._id}`);
      const data = res.data;
      if (data.success) {
        toast.success("Đã xóa thành viên!");
        fetchMembers();
      } else {
        toast.error(data.error || "Xóa thất bại");
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  };

  // Handle select all
  // Remove selectedIds state and all multi-select logic

  // Handle select one
  // Remove selectedIds state and all multi-select logic

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
          Quản lý người dùng
        </h1>
        <p className="text-gray-500 text-sm">
          Quản lý thành viên và phân quyền tài khoản tại đây.
        </p>
      </div>
      {/* Thanh công cụ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div></div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FiSearch />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          {/* Remove filter dropdown from toolbar */}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black hover:bg-gray-800 text-white font-semibold text-sm shadow-sm"
            onClick={handleOpenModal}
          >
            <FiPlus className="text-lg" /> Thêm người dùng
          </button>
        </div>
      </div>
      {/* Modal tạo member */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <h2 className="text-lg font-bold mb-4">Thêm thành viên mới</h2>
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="border rounded px-3 py-2"
                value={form.email}
                onChange={handleFormChange}
                required
              />
              <input
                type="text"
                name="fullName"
                placeholder="Họ và tên"
                className="border rounded px-3 py-2"
                value={form.fullName}
                onChange={handleFormChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Mật khẩu"
                className="border rounded px-3 py-2"
                value={form.password}
                onChange={handleFormChange}
                required
              />
              {formError && (
                <div className="text-red-500 text-sm">{formError}</div>
              )}
              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200"
                  onClick={handleCloseModal}
                  disabled={formLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-primary text-white disabled:bg-gray-300"
                  disabled={formLoading}
                >
                  {formLoading ? "Đang tạo..." : "Tạo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal chỉnh sửa member */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <h2 className="text-lg font-bold mb-4">Chỉnh sửa thành viên</h2>
            <form
              onSubmit={handleEditFormSubmit}
              className="flex flex-col gap-3"
            >
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="border rounded px-3 py-2"
                value={editForm.email}
                onChange={handleEditFormChange}
                required
              />
              <input
                type="text"
                name="fullName"
                placeholder="Họ và tên"
                className="border rounded px-3 py-2"
                value={editForm.fullName}
                onChange={handleEditFormChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Mật khẩu mới (bỏ trống nếu không đổi)"
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
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-primary text-white disabled:bg-gray-300"
                  disabled={editLoading}
                >
                  {editLoading ? "Đang lưu..." : "Lưu"}
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
                Tên người dùng
              </th>
              <th className="px-4 py-3 text-left font-semibold">Ngày thêm</th>
              <th
                className="px-4 py-2 cursor-pointer select-none"
                onClick={() =>
                  setSortFolderCount(sortFolderCount === "asc" ? "desc" : "asc")
                }
              >
                Số folder đang quản lý
                {sortFolderCount === "asc" && <span> ▲</span>}
                {sortFolderCount === "desc" && <span> ▼</span>}
              </th>
              <th className="px-4 py-2">Dung lượng đã dùng</th>
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
                  <td className="px-4 py-3 text-right">
                    <Skeleton width={60} height={28} />
                  </td>
                </tr>
              ))
            ) : sortedMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  Không có thành viên nào phù hợp
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
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-gray-400 hover:text-blue-600 p-2 rounded-full"
                      onClick={() => handleOpenEditModal(user)}
                      title="Sửa"
                    >
                      <FiEdit2 className="text-lg" />
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-600 p-2 rounded-full"
                      onClick={() => handleDeleteUser(user)}
                      title="Xóa"
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
    </div>
  );
}

export default User_Management_Page;
