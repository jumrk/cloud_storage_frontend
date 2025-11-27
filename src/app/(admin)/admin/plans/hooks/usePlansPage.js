"use client";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import planService from "@/shared/services/planService";

export default function usePlansPage() {
  const [plansData, setPlansData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    draft: 0,
    recent: 0,
    priceStats: {},
    topStoragePlans: [],
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Load plans data
  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      try {
        const response = await planService.getPlans({
          page: 1,
          limit: 100,
        });
        if (response.success) {
          setPlansData(response.data);
        }
      } catch (error) {
        console.error("Error loading plans:", error);
        toast.error("Có lỗi xảy ra khi tải danh sách gói dịch vụ!");
      } finally {
        setLoading(false);
      }
    };

    const loadStats = async () => {
      try {
        const response = await planService.getPlanStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };

    loadPlans();
    loadStats();
  }, []);

  // Thống kê
  const total = stats.total;
  const totalActive = stats.active;
  const totalSubscribers = 0; // Sẽ tính từ User model sau
  const totalRevenue = stats.priceStats.totalRevenue || 0;

  // Lọc và sắp xếp plans
  const filteredPlans = useMemo(() => {
    let result = plansData;
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (Array.isArray(p.description) &&
            p.description.some((f) => f.toLowerCase().includes(s)))
      );
    }
    // Sắp xếp theo giá tháng tăng dần
    result = [...result].sort((a, b) => a.priceMonth - b.priceMonth);
    return result;
  }, [plansData, search, statusFilter]);

  // Phân trang
  const totalPages = Math.ceil(filteredPlans.length / pageSize) || 1;
  const pagedPlans = filteredPlans.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleDeletePlan = (planId) => {
    setPendingDeleteId(planId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    setActionLoading(true);
    try {
      const response = await planService.deletePlan(pendingDeleteId);
      if (response.success) {
        setPlansData((prev) => prev.filter((p) => p._id !== pendingDeleteId));
        toast.success("Xóa gói dịch vụ thành công!");
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Có lỗi xảy ra khi xóa gói dịch vụ!");
    } finally {
      setActionLoading(false);
      setPendingDeleteId(null);
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setModalOpen(true);
  };

  const handleAddPlan = () => {
    setEditingPlan(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPlan(null);
  };

  const handleSubmitPlan = async (planData) => {
    setActionLoading(true);
    try {
      if (planData._id) {
        // Cập nhật gói hiện có
        const response = await planService.updatePlan(planData._id, planData);
        if (response.success) {
          setPlansData((prev) =>
            prev.map((p) => (p._id === planData._id ? response.data : p))
          );
          toast.success("Cập nhật gói dịch vụ thành công!");
        }
      } else {
        // Thêm gói mới
        const response = await planService.createPlan(planData);
        if (response.success) {
          setPlansData((prev) => [...prev, response.data]);
          toast.success("Thêm gói dịch vụ thành công!");
        }
      }
      setModalOpen(false);
      setEditingPlan(null);
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Có lỗi xảy ra khi lưu gói dịch vụ!");
    } finally {
      setActionLoading(false);
    }
  };

  return {
    plansData,
    loading,
    actionLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    totalPages,
    pagedPlans,
    total,
    totalActive,
    totalSubscribers,
    totalRevenue,
    modalOpen,
    setModalOpen,
    editingPlan,
    setEditingPlan,
    confirmOpen,
    setConfirmOpen,
    pendingDeleteId,
    handleDeletePlan,
    handleConfirmDelete,
    handleEditPlan,
    handleAddPlan,
    handleCloseModal,
    handleSubmitPlan,
  };
}

