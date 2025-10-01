"use client";
import { useEffect, useState, useMemo } from "react";
import {
  FiPlus,
  FiFilter,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
} from "react-icons/fi";
import PlanModal from "@/components/admin/PlanModal";
import planService from "@/lib/planService";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { PLAN_ICONS } from "@/components/admin/planIcons";
import { formatSize } from "@/utils/driveUtils";
import EmptyState from "@/components/ui/EmptyState";
import { FaUser, FaHdd } from "react-icons/fa";

const PLAN_COLORS = [
  "#4abad9",
  "#fbbf24",
  "#a78bfa",
  "#f87171",
  "#34d399",
  "#f472b6",
];

const STATUS_LABEL = {
  active: "Hoạt động",
  inactive: "Tạm ngưng",
  draft: "Nháp",
};

const STATUS_FILTERS = [
  { label: "Tất cả", value: "all" },
  { label: "Hoạt động", value: "active" },
  { label: "Tạm ngưng", value: "inactive" },
  { label: "Nháp", value: "draft" },
];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
}

function formatPrice(price) {
  if (price === 0) return "Miễn phí";
  return price.toLocaleString("vi-VN") + "₫";
}

export default function AdminPlansPage() {
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
          p.features.some((f) => f.toLowerCase().includes(s))
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

  const handleViewPlan = (plan) => {
    toast.info(`Xem chi tiết gói: ${plan.name}`);
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

  return (
    <div className="w-full max-w-6xl mx-auto px-2 py-4">
      {/* Header + mô tả */}
      <div className="mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          Quản lý gói dịch vụ
        </h1>
        <p className="text-gray-500 text-sm">
          Quản lý các gói dịch vụ và cấu hình giá cả tại đây.
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
                Tổng gói dịch vụ
              </div>
              <div className="text-2xl font-extrabold text-blue-700 drop-shadow">
                {total}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 shadow-lg px-4 py-5 flex flex-col items-center rounded-xl transition-all">
              <div className="text-xs text-gray-600 mb-1 font-semibold">
                Gói đang hoạt động
              </div>
              <div className="text-2xl font-extrabold text-green-600 drop-shadow">
                {totalActive}
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 shadow-lg px-4 py-5 flex flex-col items-center rounded-xl transition-all">
              <div className="text-xs text-gray-600 mb-1 font-semibold">
                Tổng người đăng ký
              </div>
              <div className="text-2xl font-extrabold text-yellow-600 drop-shadow">
                {totalSubscribers.toLocaleString()}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 shadow-lg px-4 py-5 flex flex-col items-center rounded-xl transition-all">
              <div className="text-xs text-gray-600 mb-1 font-semibold">
                Doanh thu tháng
              </div>
              <div className="text-2xl font-extrabold text-purple-600 drop-shadow">
                {formatPrice(totalRevenue)}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-6">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm">
            <FiFilter className="text-lg" /> Bộ lọc
          </button>
          <select
            className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_FILTERS.map((opt) => (
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
            placeholder="Tìm kiếm theo tên gói..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black hover:bg-gray-800 text-white font-semibold text-sm ml-auto"
          onClick={handleAddPlan}
        >
          <FiPlus className="text-lg" /> Thêm gói mới
        </button>
      </div>

      {/* Cards plans */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-[#1cadd9] rounded-xl shadow-lg p-4 md:p-6 flex flex-col h-full relative"
            >
              <Skeleton width={48} height={48} circle className="mb-3" />
              <Skeleton width={100} height={22} />
              <Skeleton width={80} height={16} className="mt-2" />
              <Skeleton width={120} height={18} className="mt-2" />
              <Skeleton width={100} height={16} className="mt-2" />
              <Skeleton width={120} height={18} className="mt-2" />
              <Skeleton width={80} height={16} className="mt-2" />
            </div>
          ))}
        </div>
      ) : pagedPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center w-full py-12">
          <EmptyState message="Không có gói dịch vụ nào." height={180} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-6">
          {pagedPlans.map((plan, idx) => {
            const color = PLAN_COLORS[idx % PLAN_COLORS.length];
            const Icon =
              PLAN_ICONS[plan.icon] || PLAN_ICONS[Object.keys(PLAN_ICONS)[0]];
            const priceMonthDiscounted =
              plan.sale > 0
                ? Math.round(plan.priceMonth * (1 - plan.sale / 100))
                : plan.priceMonth;
            const priceYearDiscounted =
              plan.sale > 0
                ? Math.round(plan.priceYear * (1 - plan.sale / 100))
                : plan.priceYear;
            return (
              <div
                key={plan._id}
                className={`relative bg-white rounded-2xl shadow p-7 flex flex-col h-full transition group hover:shadow-xl
                  ${
                    plan.featured
                      ? "border-l-2 border-r-2 border-b-2 border-[#1cadd9] border-t-0 rounded-b-2xl"
                      : "border-2 border-gray-200"
                  }`}
                style={{ boxShadow: `0 4px 24px 0 ${color}22` }}
              >
                {/* Top border effect */}
                <div
                  className="absolute left-0 top-0 w-full h-2 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{ background: color, zIndex: 10 }}
                />
                {/* Ribbon Ưu chuộng nhất */}
                {plan.featured && (
                  <div className="absolute left-0 right-0 top-0 z-20">
                    <div className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs py-2 rounded-t-2xl font-semibold shadow-lg border-b-2 border-blue-300 flex items-center justify-center">
                      Ưu chuộng nhất
                    </div>
                  </div>
                )}
                {/* Badge Tiết kiệm ở góc trên bên trái */}
                {plan.sale > 0 && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                      Tiết kiệm {plan.sale}%
                    </span>
                  </div>
                )}
                {/* Icon edit/xóa góc phải trên */}
                <div className="absolute top-2 right-2 flex gap-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                    title="Chỉnh sửa"
                  >
                    <FiEdit2 className="text-sm" />
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Xóa"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
                {/* Icon + tên */}
                <div className="flex flex-col items-center mb-4 mt-2">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-2 border-4"
                    style={{ borderColor: color, background: `${color}10` }}
                  >
                    <Icon className="w-8 h-8" style={{ color }} />
                  </div>
                  <span className="font-bold text-xl text-gray-900 mb-1">
                    {plan.name}
                  </span>
                </div>
                {/* Giá tháng */}
                <div className="mb-2 text-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {plan.isCustom
                      ? "Tùy chọn"
                      : plan.priceMonth === 0
                      ? "Miễn phí"
                      : plan.priceMonth?.toLocaleString("vi-VN") + "₫"}
                  </span>
                  <span className="text-base font-normal text-gray-500">
                    /tháng
                  </span>
                </div>
                {/* Giá năm + sale */}
                <div className="mb-2 text-center flex items-center justify-center gap-2">
                  <span className="text-sm text-gray-700">Năm:</span>
                  <span className="font-semibold text-gray-900">
                    {plan.isCustom
                      ? "Tùy chọn"
                      : plan.priceYear === 0
                      ? "Miễn phí"
                      : plan.priceYear?.toLocaleString("vi-VN") + "₫"}
                  </span>
                  {plan.sale > 0 && !plan.isCustom && (
                    <span className="bg-[#1cadd9] text-white text-xs px-2 py-0.5 rounded ml-1">
                      Tiết kiệm {plan.sale}%
                    </span>
                  )}
                </div>
                {/* Số user + dung lượng */}
                <div className="flex justify-center gap-4 mb-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <FaUser className="inline-block text-base align-middle" />{" "}
                    {plan.isCustom ? "Tùy chọn" : plan.users + " người dùng"}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaHdd className="inline-block text-base align-middle" />{" "}
                    {plan.isCustom
                      ? "Tùy chọn"
                      : plan.storage
                      ? formatSize(plan.storage)
                      : "-"}
                  </span>
                </div>
                {/* Description list */}
                <ul className="flex-1 space-y-2 mb-6 text-gray-700 text-sm mt-2">
                  {Array.isArray(plan.description) &&
                    plan.description.map((desc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5" style={{ color }}>
                          {"✔️"}
                        </span>
                        <span>{desc}</span>
                      </li>
                    ))}
                </ul>
                {/* Footer với status và ngày tạo */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      plan.status === "active"
                        ? "bg-green-100 text-green-700"
                        : plan.status === "inactive"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {STATUS_LABEL[plan.status]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(plan.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
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
      )}

      {/* Modal */}
      <PlanModal
        open={modalOpen}
        onClose={handleCloseModal}
        plan={editingPlan}
        onSubmit={handleSubmitPlan}
        loading={actionLoading}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xoá"
        message="Bạn có chắc chắn muốn xoá gói dịch vụ này?"
        confirmText="Xoá"
        cancelText="Hủy"
      />
    </div>
  );
}
