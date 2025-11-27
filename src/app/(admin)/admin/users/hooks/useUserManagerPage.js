"use client";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import userService from "../services/userService";
import { formatDate, formatStorage, ROLE_LABEL, ROLE_FILTERS } from "../utils";

export default function useUserManagerPage() {
  const api = userService();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roleLoading, setRoleLoading] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .getUsers()
      .then((res) => setUsers(res?.users || []))
      .finally(() => setLoading(false));
  }, [showCreateModal]);

  const handleChangeRole = async (user, newRole) => {
    if (user.role === newRole) return;
    // Không cho phép hạ quyền admin cuối cùng
    if (user.role === "admin" && newRole === "leader") {
      const adminCount = users.filter((u) => u.role === "admin").length;
      if (adminCount <= 1) {
        toast.error("Không thể hạ quyền admin cuối cùng!");
        return;
      }
    }
    setRoleLoading(user._id);
    try {
      const res = await api.updateUserRole(user._id, newRole);
      if (!res.success) {
        toast.error(res.error || "Đổi quyền thất bại");
      } else {
        toast.success("Đổi quyền thành công!");
      }
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u))
      );
    } catch (e) {
      toast.error("Lỗi kết nối server");
    }
    setRoleLoading("");
  };

  // Thống kê
  const total = users.length;
  const totalAdmin = users.filter((u) => u.role === "admin").length;
  const totalLeader = users.filter((u) => u.role === "leader").length;
  const totalMember = users.filter((u) => u.role === "member").length;

  // Lọc và sắp xếp user
  const filteredUsers = useMemo(() => {
    let result = users;
    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      result = result.filter(
        (u) =>
          (u.fullName || "").toLowerCase().includes(s) ||
          (u.email || "").toLowerCase().includes(s)
      );
    }
    // Sắp xếp mặc định theo ngày tạo mới nhất
    result = [...result].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    return result;
  }, [users, search, roleFilter]);

  // Phân trang
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const pagedUsers = filteredUsers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return {
    users,
    loading,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    page,
    setPage,
    totalPages,
    pagedUsers,
    showCreateModal,
    setShowCreateModal,
    roleLoading,
    handleChangeRole,
    total,
    totalAdmin,
    totalLeader,
    totalMember,
    formatDate,
    formatStorage,
    ROLE_LABEL,
    ROLE_FILTERS,
  };
}

