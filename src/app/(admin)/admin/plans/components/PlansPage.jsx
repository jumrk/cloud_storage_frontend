"use client";
import { FiPlus, FiSearch } from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import EmptyState from "@/shared/ui/EmptyState";
import usePlansPage from "../hooks/usePlansPage";
import PlanCard from "./PlanCard";
import PlanModal from "./PlanModal";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import { formatPrice, STATUS_FILTERS } from "../utils";

export default function PlansPage() {
  const {
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
    editingPlan,
    confirmOpen,
    setConfirmOpen,
    handleDeletePlan,
    handleConfirmDelete,
    handleEditPlan,
    handleAddPlan,
    handleCloseModal,
    handleSubmitPlan,
  } = usePlansPage();

  const stats = [
    {
      label: "Tổng gói dịch vụ",
      value: total,
      gradient: "from-sky-50 to-white",
      accent: "text-sky-600",
    },
    {
      label: "Đang hoạt động",
      value: totalActive,
      gradient: "from-emerald-50 to-white",
      accent: "text-emerald-600",
    },
    {
      label: "Người đăng ký",
      value: totalSubscribers.toLocaleString(),
      gradient: "from-amber-50 to-white",
      accent: "text-amber-600",
    },
    {
      label: "Doanh thu tháng",
      value: formatPrice(totalRevenue),
      gradient: "from-indigo-50 to-white",
      accent: "text-indigo-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Pricing & Plans
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                Quản lý gói dịch vụ
              </h1>
              <p className="text-sm text-slate-500">
                Theo dõi và cấu hình bảng giá chỉ trong vài bước.
              </p>
            </div>
            <button
              onClick={handleAddPlan}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-slate-200 hover:bg-slate-800 transition"
            >
              <FiPlus /> Thêm gói mới
            </button>
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-slate-200 p-4"
                >
                  <Skeleton height={18} width={100} />
                  <Skeleton height={32} width={80} className="mt-3" />
                </div>
              ))
            : stats.map((card) => (
                <article
                  key={card.label}
                  className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${card.gradient} p-4`}
                >
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {card.label}
                  </p>
                  <p className={`text-2xl font-semibold mt-2 ${card.accent}`}>
                    {card.value}
                  </p>
                </article>
              ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                  statusFilter === option.value
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Tìm kiếm tên gói..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </section>

        <section>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <Skeleton height={18} width={160} />
                  <Skeleton height={28} width={180} className="mt-3" />
                  <Skeleton height={16} width="100%" className="mt-4" count={3} />
                </div>
              ))}
            </div>
          ) : pagedPlans.length === 0 ? (
            <EmptyState message="Chưa có gói dịch vụ nào" height={220} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {pagedPlans.map((plan, idx) => (
                <PlanCard
                  key={plan._id}
                  plan={plan}
                  index={idx}
                  onEdit={handleEditPlan}
                  onDelete={handleDeletePlan}
                />
              ))}
            </div>
          )}
        </section>

        {totalPages > 1 && (
          <div className="flex justify-center">
            <nav className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition ${
                    p === page
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </nav>
          </div>
        )}

        <PlanModal
          open={modalOpen}
          onClose={handleCloseModal}
          plan={editingPlan}
          onSubmit={handleSubmitPlan}
          loading={actionLoading}
        />

        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Xác nhận xoá"
          message="Bạn có chắc chắn muốn xoá gói dịch vụ này?"
          confirmText="Xoá"
          cancelText="Huỷ"
          loading={actionLoading}
        />
      </div>
    </div>
  );
}

