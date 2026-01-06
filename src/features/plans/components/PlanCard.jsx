"use client";
import React from "react";
import { FiCheck } from "react-icons/fi";
import { formatSize } from "@/shared/utils/driveUtils";

function formatMoney(n, currency = "VND", locale = "vi-VN") {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "VND" ? 0 : 2,
    }).format(n || 0);
  } catch {
    return `${Number(n || 0).toLocaleString(locale)} ${currency}`;
  }
}

export default function PlanCard({
  plan,
  billing = "annual",
  currency = "VND",
  locale = "vi-VN",
  currentPlanSlug,
  daysUntilExpiry = null, // Số ngày còn lại trước khi hết hạn
  onSelect,
  selectionLockedReason = "",
  hasPendingOrder = false, // Có order pending không
}) {
  const isAnnual = billing === "annual";
  const isFreePlan = plan.slug?.toLowerCase() === "free";
  // Free plan luôn có giá 0
  const pricePerMonthRaw = isFreePlan
    ? 0
    : isAnnual
      ? plan.priceYear / 12
      : plan.priceMonth;
  const hasSale = !isFreePlan && isAnnual && plan.sale > 0;
  const pricePerMonth = hasSale
    ? pricePerMonthRaw * (1 - plan.sale / 100)
    : pricePerMonthRaw;
  const billedTotal = isFreePlan
    ? 0
    : isAnnual
      ? pricePerMonth * 12
      : pricePerMonth;

  // Normalize currentPlanSlug: nếu empty/null thì coi như đang dùng Free plan
  const normalizedCurrentSlug = (currentPlanSlug || "").toLowerCase() || "free";
  const normalizedPlanSlug = (plan.slug || "").toLowerCase();

  // Kiểm tra xem đây có phải là plan hiện tại không
  const isCurrent = normalizedCurrentSlug === normalizedPlanSlug;

  // Kiểm tra xem user có đang dùng gói khác (không phải Free) không
  const hasOtherPlan =
    normalizedCurrentSlug &&
    normalizedCurrentSlug !== "free" &&
    normalizedCurrentSlug !== normalizedPlanSlug;

  // Disabled logic:
  // 1. Nếu đây là plan hiện tại → disabled
  // 2. Nếu đây là Free plan và user đang dùng gói khác → disabled
  // 3. Nếu có order pending → disabled (trừ khi đang renew plan hiện tại)
  const baseDisabled = isCurrent || (isFreePlan && hasOtherPlan);
  const allowRenew =
    isCurrent && daysUntilExpiry !== null && daysUntilExpiry <= 3;
  const lockedByRole = Boolean(selectionLockedReason);
  const isDisabled =
    lockedByRole || hasPendingOrder || (baseDisabled && !allowRenew);

  const formatStorage = (storage) => {
    if (!storage && storage !== 0) return "0 GB";
    if (storage > 1073741824) {
      return formatSize(storage);
    }
    return formatSize(storage * 1024 * 1024 * 1024);
  };

  return (
    <div
      className={`relative w-[300px] h-[405px] rounded-xl border bg-white shadow-sm p-4 flex flex-col hover:shadow-card transition ${
        plan.featured
          ? "border-brand-300 ring-1 ring-brand-200"
          : "border-[var(--color-border)]"
      }`}
    >
      {(plan.featured || lockedByRole) && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent text-[var(--color-surface-50)] shadow">
          {lockedByRole ? "Dành cho leader" : "Phổ biến nhất"}
        </div>
      )}
      <div className="mb-2">
        <h3 className="text-base font-bold text-gray-900 truncate">
          {plan.name}
        </h3>
        <p className="text-[11px] text-gray-600 mt-0.5 truncate">
          {plan.users > 1 ? `${plan.users} người dùng` : "1 người dùng"} ·{" "}
          {formatStorage(plan.storage)} dung lượng
        </p>
      </div>
      <div className="mb-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-gray-900">
            {formatMoney(pricePerMonth, currency, locale)}
          </span>
          <span className="text-gray-600 text-xs">/tháng</span>
        </div>
        {hasSale && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="line-through text-xs text-gray-600">
              {formatMoney(pricePerMonthRaw, currency, locale)}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-success/10 text-success">
              Tiết kiệm {plan.sale}%
            </span>
          </div>
        )}
        <div className="text-[11px] text-gray-600 mt-0.5">
          {isAnnual ? (
            <>
              Thanh toán năm:{" "}
              <span className="font-medium text-gray-900">
                {formatMoney(billedTotal, currency, locale)}
              </span>
            </>
          ) : (
            <>Thanh toán tháng</>
          )}
        </div>
      </div>
      <ul className="mt-2 space-y-1.5 text-[13px] flex-1 overflow-y-auto min-h-0">
        {plan.description.map((line, idx) => (
          <li key={idx} className="flex items-start gap-1.5 text-gray-900">
            <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-success/10 text-success shrink-0">
              <FiCheck className="text-[10px]" />
            </span>
            <span className="flex-1 break-words">{line}</span>
          </li>
        ))}
      </ul>
      <button
        className={`w-full mt-4 py-2 rounded-lg text-sm font-semibold shadow transition ${
          isDisabled
            ? "bg-gray-100 text-gray-900 cursor-not-allowed opacity-60"
            : "bg-brand text-[var(--color-surface-50)] hover:opacity-90"
        }`}
        onClick={() => {
          if (lockedByRole || hasPendingOrder) return;
          if (allowRenew) {
            onSelect && onSelect(plan, billing);
          } else if (!isDisabled) {
            onSelect && onSelect(plan, billing);
          }
        }}
        disabled={isDisabled}
      >
        {lockedByRole
          ? selectionLockedReason
          : hasPendingOrder
            ? "Đang chờ duyệt đơn"
            : isCurrent
              ? allowRenew
                ? "Gia hạn"
                : "Đang sử dụng"
              : isFreePlan && hasOtherPlan
                ? "Không thể chọn gói Free"
                : `Nâng cấp ${plan.name}`}
      </button>
    </div>
  );
}
