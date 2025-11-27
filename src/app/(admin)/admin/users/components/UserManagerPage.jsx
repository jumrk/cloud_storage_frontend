"use client";
import {
  FiUserPlus,
  FiFilter,
  FiSearch,
} from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import toast, { Toaster } from "react-hot-toast";
import EmptyState from "@/shared/ui/EmptyState";
import useUserManagerPage from "../hooks/useUserManagerPage";
import UserCreateModal from "./UserCreateModal";
import RoleMenu from "./RoleMenu";

export default function UserManagerPage() {
  const {
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
  } = useUserManagerPage();

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

