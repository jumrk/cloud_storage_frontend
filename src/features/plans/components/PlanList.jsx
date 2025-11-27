"use client";
import React, { useMemo, useState } from "react";
import PlanCard from "./PlanCard";
import EmptyState from "@/shared/ui/EmptyState";
import CustomPlanModal from "./CustomPlanModal";
import { usePlans, usePlanSelection } from "../hooks";
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
}) {
  const [billing, setBilling] = useState(
    defaultBilling === "monthly" ? "monthly" : "annual"
  );
  const [selectedCustomPlan, setSelectedCustomPlan] = useState(null);
  const { plans, loading } = usePlans(initialPlans);
  const handleSelectBase = usePlanSelection(currentPlanSlug, onSelect);
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
      {selectionLockedReason && (
        <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-800">
          Tài khoản member không thể nâng cấp gói. Vui lòng liên hệ leader để
          thay đổi gói dịch vụ.
        </div>
      )}
      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex rounded-full bg-[var(--color-surface-100)] p-1 ring-1 ring-[var(--color-border)] shadow-sm">
          <button
            aria-pressed={billing === "monthly"}
            onClick={() => setBilling("monthly")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition
        ${
          billing === "monthly"
            ? "bg-white text-text-strong shadow"
            : "text-text-muted hover:text-text-strong"
        }`}
          >
            Theo tháng
          </button>

          <button
            aria-pressed={billing === "annual"}
            onClick={() => setBilling("annual")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition
        ${
          billing === "annual"
            ? "bg-white text-text-strong shadow"
            : "text-text-muted hover:text-text-strong"
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
