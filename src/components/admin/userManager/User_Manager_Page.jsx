"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import {
  FiMoreHorizontal,
  FiUserPlus,
  FiFilter,
  FiSearch,
  FiX,
} from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import toast, { Toaster } from "react-hot-toast";
import axiosClient from "@/lib/axiosClient";
import EmptyState from "@/components/ui/EmptyState";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
}
function formatStorage(bytes) {
  if (!bytes && bytes !== 0) return "0B";
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}
const ROLE_LABEL = {
  admin: "Quản trị viên",
  leader: "Trưởng nhóm",
  member: "Thành viên",
};
const ROLE_FILTERS = [
  { label: "Tất cả", value: "all" },
  { label: "Quản trị viên", value: "admin" },
  { label: "Trưởng nhóm", value: "leader" },
  { label: "Thành viên", value: "member" },
];

function UserCreateModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    planId: "",
    planType: "month",
    slast: "",
  });
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [slastChecking, setSlastChecking] = useState(false);
  const [slastExists, setSlastExists] = useState(false);
  let slastCheckTimeout = useRef();

  useEffect(() => {
    if (open) {
      setForm({
        fullName: "",
        email: "",
        phone: "",
        planId: "",
        planType: "month",
        slast: "",
      });
      setError("");
      setSuccess(false);
      axiosClient
        .get("/api/admin/plans")
        .then((res) => setPlans(res.data?.data || []));
    }
  }, [open]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "slast") {
      const value = e.target.value.trim();
      setSlastExists(false);
      setSlastChecking(false);
      if (slastCheckTimeout.current) clearTimeout(slastCheckTimeout.current);
      if (!value || !/^[a-zA-Z0-9_-]+$/.test(value)) return;
      setSlastChecking(true);
      slastCheckTimeout.current = setTimeout(async () => {
        try {
          const res = await axiosClient.get("/api/user/check-slast", {
            params: { slast: value },
          });
          setSlastExists(res.data.exists);
        } catch (err) {
          setSlastExists(false);
        } finally {
          setSlastChecking(false);
        }
      }, 500);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.planId ||
      !form.slast.trim()
    ) {
      setError("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(form.slast)) {
      setError("Định danh chỉ dùng chữ, số, dấu gạch ngang hoặc gạch dưới.");
      return;
    }
    if (slastExists) {
      setError("Định danh này đã được sử dụng, hãy chọn định danh khác.");
      return;
    }
    setLoading(true);
    try {
      const res = await axiosClient.post("/api/admin/users", form);
      if (res.data.success) {
        setSuccess(true);
        onCreated && onCreated();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.data.error || "Tạo user thất bại");
      }
    } catch (e) {
      setError("Lỗi kết nối server");
    }
    setLoading(false);
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative animate-fadeIn">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
          onClick={onClose}
          title="Đóng"
        >
          <FiX />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">
          Thêm người dùng mới
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Họ và tên *
            </label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Số điện thoại
            </label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Gói dịch vụ *
            </label>
            <select
              name="planId"
              value={form.planId}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            >
              <option value="">-- Chọn gói --</option>
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.priceMonth.toLocaleString()}₫/tháng,{" "}
                  {p.priceYear.toLocaleString()}₫/năm)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Loại gói *</label>
            <select
              name="planType"
              value={form.planType}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            >
              <option value="month">Tháng</option>
              <option value="year">Năm</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Định danh cá nhân (slast) *
            </label>
            <input
              type="text"
              name="slast"
              value={form.slast}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
              autoComplete="off"
              disabled={loading}
            />
            <div className="text-xs text-gray-500 mt-1">
              Định danh này sẽ xuất hiện trên đường dẫn truy cập cá nhân của
              user (ví dụ:{" "}
              <b>
                cloudstorage.com/leader/<i>slast</i>/home
              </b>
              ). Mỗi người dùng phải có một định danh duy nhất, không trùng với
              người khác.
            </div>
            {slastChecking && (
              <div className="text-xs text-blue-500 mt-1">
                Đang kiểm tra định danh...
              </div>
            )}
            {slastExists && !slastChecking && (
              <div className="text-xs text-red-500 mt-1">
                Định danh này đã được sử dụng, hãy chọn định danh khác.
              </div>
            )}
          </div>
          {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
          {success && (
            <div className="text-green-600 text-sm mt-1">
              Tạo user thành công!
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-primary text-white font-semibold text-lg mt-2 hover:bg-primary/90 disabled:bg-gray-300"
            disabled={loading}
          >
            {loading ? "Đang tạo..." : "Tạo người dùng"}
          </button>
        </form>
      </div>
    </div>
  );
}

function RoleMenu({ user, onChangeRole }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        className="text-gray-400 hover:text-gray-700 p-2 rounded-full"
        onClick={() => setOpen((v) => !v)}
        title="Tùy chọn"
      >
        <FiMoreHorizontal className="text-lg" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 min-w-[180px] bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-2 animate-fadeIn">
          {user.role === "leader" && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-700 font-medium"
              onClick={() => {
                setOpen(false);
                onChangeRole("admin");
              }}
            >
              Phân quyền: Admin
            </button>
          )}
          {user.role === "admin" && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-yellow-50 text-yellow-700 font-medium"
              onClick={() => {
                setOpen(false);
                onChangeRole("leader");
              }}
            >
              Phân quyền: Leader
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminUserPage() {
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
    axiosClient
      .get("/api/admin/users/list")
      .then((res) => setUsers(res.data?.users || []));
    setLoading(false);
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
      const res = await axiosClient.patch(`/api/admin/users/role/${user._id}`, {
        role: newRole,
      });
      if (!res.data.success) {
        toast.error(res.data.error || "Đổi quyền thất bại");
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
  const totalUsed = users.reduce((sum, u) => sum + (u.usedStorage || 0), 0);

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

  return (
    <div className="w-full max-w-6xl mx-auto px-2 py-4">
      <Toaster position="top-right" />
      {/* Header + mô tả */}
      <div className="mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          Quản lý người dùng
        </h1>
        <p className="text-gray-500 text-sm">
          Quản lý thành viên và phân quyền tài khoản tại đây.
        </p>
      </div>
      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-lg px-4 py-5 flex flex-col items-center rounded-xl transition-all"
            >
              <Skeleton width={60} height={28} />
              <Skeleton width={80} height={18} className="mt-2" />
            </div>
          ))
        ) : (
          <>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-lg px-4 py-5 flex flex-col items-center rounded-xl transition-all">
              <div className="text-xs text-gray-600 mb-1 font-semibold">
                Tổng người dùng
              </div>
              <div className="text-2xl font-extrabold text-blue-700 drop-shadow">
                {total}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 shadow-lg px-4 py-5 flex flex-col items-center rounded-xl transition-all">
              <div className="text-xs text-gray-600 mb-1 font-semibold">
                Quản trị viên
              </div>
              <div className="text-2xl font-extrabold text-green-600 drop-shadow">
                {totalAdmin}
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 shadow-lg px-4 py-5 flex flex-col items-center rounded-xl transition-all">
              <div className="text-xs text-gray-600 mb-1 font-semibold">
                Trưởng nhóm
              </div>
              <div className="text-2xl font-extrabold text-yellow-600 drop-shadow">
                {totalLeader}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-lg px-4 py-5 flex flex-col items-center rounded-xl transition-all">
              <div className="text-xs text-gray-600 mb-1 font-semibold">
                Thành viên
              </div>
              <div className="text-2xl font-extrabold text-blue-500 drop-shadow">
                {totalMember}
              </div>
            </div>
          </>
        )}
      </div>
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm">
            <FiFilter className="text-lg" /> Bộ lọc
          </button>
          <select
            className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {ROLE_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 md:flex-none">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <FiSearch />
          </span>
          <input
            className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black hover:bg-gray-800 text-white font-semibold text-sm ml-auto"
          onClick={() => setShowCreateModal(true)}
        >
          <FiUserPlus className="text-lg" /> Thêm người dùng
        </button>
      </div>
      {/* Bảng user */}
      <div className="overflow-x-auto border border-gray-100 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">
                Số điện thoại
              </th>
              <th className="px-4 py-3 text-center font-semibold">Tổng file</th>
              <th className="px-4 py-3 text-right font-semibold">Đã dùng</th>
              <th className="px-4 py-3 text-right font-semibold">
                Dung lượng tối đa
              </th>
              <th className="px-4 py-3 text-center font-semibold">Vai trò</th>
              <th className="px-4 py-3 text-center font-semibold">Ngày tạo</th>
              <th className="px-4 py-3 text-right font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <td className="px-4 py-3 text-gray-700">
                    <Skeleton width={120} height={18} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <Skeleton width={80} height={18} />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    <Skeleton width={40} height={18} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    <Skeleton width={60} height={18} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    <Skeleton width={60} height={18} />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    <Skeleton width={80} height={18} />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    <Skeleton width={80} height={18} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Skeleton width={32} height={18} />
                  </td>
                </tr>
              ))
            ) : pagedUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-12">
                  <div className="flex flex-col items-center justify-center w-full">
                    <EmptyState
                      message="Không có người dùng nào."
                      height={180}
                    />
                  </div>
                </td>
              </tr>
            ) : (
              pagedUsers.map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition group"
                >
                  <td className="px-4 py-3 text-gray-700">{user.email}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {user.phone || "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {user.totalFiles ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {formatStorage(user.usedStorage)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {formatStorage(user.maxStorage)}
                  </td>
                  <td
                    className={`px-4 py-3 text-center text-gray-700 ${
                      user.role === "admin"
                        ? "bg-blue-50 text-blue-700 font-semibold rounded"
                        : user.role === "leader"
                        ? "bg-yellow-50 text-yellow-700 font-semibold rounded"
                        : ""
                    }`}
                  >
                    {ROLE_LABEL[user.role] || "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {user.createdAt ? formatDate(user.createdAt) : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-block relative">
                      <RoleMenu
                        user={user}
                        onChangeRole={(role) => handleChangeRole(user, role)}
                      />
                      {roleLoading === user._id && (
                        <span className="ml-2 text-xs text-blue-500">
                          Đang đổi...
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Phân trang */}
      <div className="flex justify-end mt-6">
        <nav className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition border border-transparent hover:bg-gray-100 ${
                p === page ? "bg-gray-900 text-white" : "text-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
        </nav>
      </div>
      <UserCreateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {}}
      />
    </div>
  );
}
