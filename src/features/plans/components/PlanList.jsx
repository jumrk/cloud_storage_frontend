"use client";

import React, { useMemo, useState } from "react";
import PlanCard from "./PlanCard";
import EmptyState from "@/shared/ui/EmptyState";
import CustomPlanModal from "./CustomPlanModal";
import { usePlans, usePlanSelection, usePendingOrder } from "../hooks";
import { getFreePlan } from "../utils/getFreePlan";

export default function PlanList({
  plans: initialPlans = null,
  currency = "VND",
  locale = "vi-VN",
  currentPlanSlug = "",
  daysUntilExpiry = null, // Số ngày còn lại trước khi hết hạn
  onSelect,
  defaultBilling = "annual",
  userRole = null,
  isLoggedIn = false,
  isAuthLoading = false,
}) {
  const [billing, setBilling] = useState(
    defaultBilling === "monthly" ? "monthly" : "annual",
  );
  const [selectedCustomPlan, setSelectedCustomPlan] = useState(null);
  const { plans, loading } = usePlans(initialPlans);
  const handleSelectBase = usePlanSelection(currentPlanSlug, onSelect);
  const {
    hasPendingOrder,
    pendingOrder,
    loading: pendingLoading,
  } = usePendingOrder();
  const isMemberRole = userRole === "member";
  const selectionLockedReason = isMemberRole
    ? "Chỉ leader mới nâng cấp gói"
    : "";

  const handleSelect = (plan, selectedBilling) => {
    // Nếu là custom plan, mở modal thay vì redirect
    if (plan.isCustom) {
      setSelectedCustomPlan(plan);
      return;
    }
    // Nếu không phải custom plan, xử lý bình thường
    handleSelectBase(plan, selectedBilling);
  };

  const visiblePlans = useMemo(() => {
    const activePlans = (plans || []).filter((p) => p.status === "active");
    const freePlan = getFreePlan();

    // Thêm Free plan vào đầu danh sách (order: 0)
    // Kiểm tra xem đã có free plan trong danh sách chưa
    const hasFreePlan = activePlans.some((p) => p.slug === "free");
    if (!hasFreePlan) {
      return [freePlan, ...activePlans];
    }

    // Nếu đã có free plan, đảm bảo nó ở đầu
    const otherPlans = activePlans.filter((p) => p.slug !== "free");
    const existingFreePlan = activePlans.find((p) => p.slug === "free");
    return [existingFreePlan || freePlan, ...otherPlans];
  }, [plans]);

  return (
    <div className="w-full">
      {hasPendingOrder && !pendingLoading && (
        <div className="mb-4 rounded-lg border border-brand-300 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-brand-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-brand-900 mb-1">
                Đang có đơn hàng chờ duyệt
              </h3>
              <p className="text-brand-700">
                Bạn đã gửi yêu cầu nâng cấp/gia hạn gói{" "}
                <span className="font-medium">
                  {pendingOrder?.plan?.name || ""}
                </span>
                . Vui lòng đợi admin duyệt đơn hàng trước khi thực hiện giao
                dịch mới.
              </p>
            </div>
          </div>
        </div>
      )}
      {selectionLockedReason && (
        <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-800">
          Tài khoản member không thể nâng cấp gói. Vui lòng liên hệ leader để
          thay đổi gói dịch vụ.
        </div>
      )}

      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex rounded-full bg-gray-100 p-1 ring-1 ring-gray-200 shadow-sm">
          <button
            aria-pressed={billing === "monthly"}
            onClick={() => setBilling("monthly")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              billing === "monthly"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Theo tháng
          </button>
          <button
            aria-pressed={billing === "annual"}
            onClick={() => setBilling("annual")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              billing === "annual"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Theo năm
          </button>
        </div>
      </div>

      {loading ? (
        <div className="w-full flex justify-center">
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="w-[300px] h-[405px] rounded-xl border bg-white shadow-sm animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : visiblePlans.length > 0 ? (
        <div className="w-full flex justify-center">
          <div className="grid md:grid-cols-3 gap-6">
            {visiblePlans.map((plan, idx) => {
              const key = plan.slug || plan.id || plan._id || `plan-${idx}`;
              return (
                <PlanCard
                  key={key}
                  plan={plan}
                  billing={billing}
                  currency={currency}
                  locale={locale}
                  currentPlanSlug={currentPlanSlug}
                  daysUntilExpiry={daysUntilExpiry}
                  onSelect={handleSelect}
                  selectionLockedReason={selectionLockedReason}
                  hasPendingOrder={hasPendingOrder}
                  isLoggedIn={isLoggedIn}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState message="Hiện chưa có gói nào sẵn sàng." />
      )}

      {selectedCustomPlan && (
        <CustomPlanModal
          plan={selectedCustomPlan}
          billing={billing}
          currentPlanSlug={currentPlanSlug}
          onClose={() => setSelectedCustomPlan(null)}
        />
      )}
    </div>
  );
}
