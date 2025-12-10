"use client";
import { useState } from "react";
import {
  FiFolderPlus,
  FiFilter,
  FiSearch,
} from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import toast, { Toaster } from "react-hot-toast";
import EmptyState from "@/shared/ui/EmptyState";
import useFilmProjectsPage from "../hooks/useFilmProjectsPage";
import FilmProjectModal from "./FilmProjectModal";
import ProjectMenu from "./ProjectMenu";

export default function ProjectsPage() {
  const {
    projects,
    loading,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    serviceFilter,
    setServiceFilter,
    page,
    setPage,
    totalPages,
    total,
    showCreateModal,
    setShowCreateModal,
    editingProject,
    setEditingProject,
    deleteLoading,
    handleCreate,
    handleUpdate,
    handleDelete,
    formatDate,
    CATEGORIES,
    SERVICES,
  } = useFilmProjectsPage();

  const [submitLoading, setSubmitLoading] = useState(false);

  const handleSubmit = async (data) => {
    setSubmitLoading(true);
    try {
      if (editingProject) {
        await handleUpdate(editingProject.id || editingProject._id, data);
      } else {
        await handleCreate(data);
      }
      // Modal sẽ được đóng trong hook khi thành công
    } catch (error) {
      // Error đã được xử lý trong hook, không cần làm gì thêm
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 py-4">
      <Toaster position="top-right" />
      {/* Header + mô tả */}
      <div className="mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          Quản lý dự án
        </h1>
        <p className="text-gray-500 text-sm">
          Quản lý và theo dõi các dự án tại đây.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả loại phim</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={serviceFilter}
            onChange={(e) => {
              setServiceFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả dịch vụ</option>
            {SERVICES.map((srv) => (
              <option key={srv} value={srv}>
                {srv}
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
            placeholder="Tìm kiếm dự án..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black hover:bg-gray-800 text-white font-semibold text-sm ml-auto"
          onClick={() => {
            setEditingProject(null);
            setShowCreateModal(true);
          }}
        >
          <FiFolderPlus className="text-lg" /> Thêm dự án
        </button>
      </div>

      {/* Thống kê */}
      {!loading && (
        <div className="mb-4 text-sm text-gray-600">
          Tổng cộng: <span className="font-semibold">{total}</span> dự án
        </div>
      )}

      {/* Bảng dự án */}
      <div className="overflow-x-auto border border-gray-100 bg-white rounded-lg relative">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
              <th className="px-4 py-3 text-left font-semibold">Tên dự án</th>
              <th className="px-4 py-3 text-left font-semibold">Mô tả</th>
              <th className="px-4 py-3 text-center font-semibold">Loại phim</th>
              <th className="px-4 py-3 text-center font-semibold">Dịch vụ</th>
              <th className="px-4 py-3 text-center font-semibold">Ngày tạo</th>
              <th className="px-4 py-3 text-right font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <td className="px-4 py-3 text-gray-700">
                    <Skeleton width={150} height={18} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <Skeleton width={200} height={18} />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    <Skeleton width={100} height={18} />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    <Skeleton width={120} height={18} />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    <Skeleton width={100} height={18} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Skeleton width={32} height={18} />
                  </td>
                </tr>
              ))
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-12">
                  <div className="flex flex-col items-center justify-center w-full">
                    <EmptyState
                      message="Chưa có dự án nào."
                      height={180}
                    />
                  </div>
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr
                  key={project._id || project.id}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition group"
                >
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {project.title}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <span className="line-clamp-1 max-w-xs">
                      {project.description || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700">
                      {project.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {project.services?.slice(0, 2).map((srv, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700"
                        >
                          {srv}
                        </span>
                      ))}
                      {project.services?.length > 2 && (
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                          +{project.services.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {formatDate(project.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right relative">
                    <ProjectMenu
                      project={project}
                      onEdit={(p) => {
                        setEditingProject(p);
                        setShowCreateModal(true);
                      }}
                      onDelete={handleDelete}
                      deleteLoading={deleteLoading}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex justify-end mt-6">
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition border border-transparent hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              // Chỉ hiển thị một số trang xung quanh trang hiện tại
              if (
                p === 1 ||
                p === totalPages ||
                (p >= page - 1 && p <= page + 1)
              ) {
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition border border-transparent hover:bg-gray-100 ${
                      p === page
                        ? "bg-gray-900 text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {p}
                  </button>
                );
              } else if (p === page - 2 || p === page + 2) {
                return (
                  <span key={p} className="text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition border border-transparent hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
            >
              ›
            </button>
          </nav>
        </div>
      )}

      {/* Modal */}
      <FilmProjectModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingProject(null);
        }}
        project={editingProject}
        onSubmit={handleSubmit}
        loading={submitLoading}
      />
    </div>
  );
}

