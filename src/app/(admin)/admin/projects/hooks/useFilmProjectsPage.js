"use client";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import filmProjectService from "../services/filmProjectService";

const CATEGORIES = [
  "Phim truyền hình",
  "Phim điện ảnh",
  "Web series",
];

const SERVICES = [
  "Chế tác phụ đề",
  "Lồng tiếng",
  "Biên dịch",
  "Thuyết minh",
];

export default function useFilmProjectsPage() {
  const api = filmProjectService();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.getProjects({
        page,
        limit: pageSize,
        category: categoryFilter || undefined,
        service: serviceFilter || undefined,
        search: search.trim() || undefined,
      });
      if (res.success) {
        setProjects(res.data?.projects || []);
        setTotal(res.data?.total || 0);
        setTotalPages(res.data?.totalPages || 1);
      } else {
        toast.error(res.error?.message || "Lỗi khi tải danh sách dự án");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, categoryFilter, serviceFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchProjects();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleCreate = async (data) => {
    try {
      const res = await api.createProject(data);
      if (res.success) {
        toast.success("Tạo dự án thành công!");
        setShowCreateModal(false);
        setEditingProject(null);
        fetchProjects();
        return;
      }
      // Nếu res.success === false
      const errorMsg = res.error?.message || "Tạo dự án thất bại";
      toast.error(errorMsg);
    } catch (error) {
      // Chỉ show toast nếu đây là network error hoặc axios error (không phải từ res.success === false)
      const errorMsg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Lỗi khi tạo dự án";
      toast.error(errorMsg);
      throw error;
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const res = await api.updateProject(id, data);
      if (res.success) {
        toast.success("Cập nhật dự án thành công!");
        setShowCreateModal(false);
        setEditingProject(null);
        fetchProjects();
        return;
      }
      // Nếu res.success === false
      const errorMsg = res.error?.message || "Cập nhật dự án thất bại";
      toast.error(errorMsg);
    } catch (error) {
      // Chỉ show toast nếu đây là network error hoặc axios error (không phải từ res.success === false)
      const errorMsg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Lỗi khi cập nhật dự án";
      toast.error(errorMsg);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa dự án này?")) return;

    setDeleteLoading(id);
    try {
      const res = await api.deleteProject(id);
      if (res.success) {
        toast.success("Xóa dự án thành công!");
        fetchProjects();
      } else {
        const errorMsg = res.error?.message || "Xóa dự án thất bại";
        toast.error(errorMsg);
      }
    } catch (error) {
      // Chỉ show toast nếu response không có success field (network error hoặc axios error)
      if (!error?.response?.data?.success && !error?.response?.data?.error) {
        const errorMsg =
          error?.response?.data?.error?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Lỗi khi xóa dự án";
        toast.error(errorMsg);
      }
    } finally {
      setDeleteLoading("");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  return {
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
  };
}

