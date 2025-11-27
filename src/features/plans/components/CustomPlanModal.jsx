"use client";
import React, { useState, useEffect } from "react";
import Modal from "@/shared/ui/Modal";
import pricingService from "@/shared/services/pricingService";
import { formatMoney } from "@/features/pricing/utils/formatMoney";
import { decodeTokenGetUser } from "@/shared/lib/jwt";
import { useRouter } from "next/navigation";

export default function CustomPlanModal({
  plan,
  billing = "annual",
  currentPlanSlug = "",
  onClose,
}) {
  const router = useRouter();
  const [storage, setStorage] = useState(20);
  const [users, setUsers] = useState(20);
  const [credis, setCredis] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [error, setError] = useState("");

  const cycle = billing === "annual" ? "year" : "month";

  useEffect(() => {
    // Chỉ tính giá khi storage và users hợp lệ
    if (
      Number(storage) >= 20 &&
      Number(users) >= 20 &&
      storage !== "" &&
      users !== ""
    ) {
      calculatePrice();
    } else {
      setPricing(null);
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storage, users, credis, billing]);

  const calculatePrice = async () => {
    if (!plan) return;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const user = token ? decodeTokenGetUser(token) : null;
    const isAuthenticated = !!user;

    let orderType = "register";
    if (isAuthenticated) {
      const currentSlug = currentPlanSlug || user?.planSlug || "";
      if (
        currentSlug &&
        currentSlug.toLowerCase() === plan.slug.toLowerCase()
      ) {
        orderType = "renew";
      } else if (currentSlug) {
        orderType = "upgrade";
      } else {
        orderType = "upgrade";
      }
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        planSlug: plan.slug,
        billingCycle: cycle,
        orderType,
        customStorage: Number(storage),
        customUsers: Number(users),
        credis: Number(credis) || 0,
        paymentOptionCode: "bank_transfer",
      };

      if (isAuthenticated && user) {
        payload.email = user.email || "";
        payload.fullName = user.fullName || "";
        payload.phone = user.phone || "";
        payload.slast = user.slast || "";
      }

      const result = await pricingService.previewCheckout(payload);
      setPricing(result?.data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Không thể tính giá. Vui lòng thử lại."
      );
      setPricing(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStorageChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value === "") {
      setStorage("");
      return;
    }
    const numValue = Number(value);
    if (numValue >= 20 && numValue <= 10000) {
      setStorage(numValue);
    } else if (numValue < 20) {
      setStorage(numValue); // Cho phép nhập số nhỏ hơn 20 để hiển thị lỗi
    }
  };

  const handleUsersChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value === "") {
      setUsers("");
      return;
    }
    const numValue = Number(value);
    if (numValue >= 20 && numValue <= 10000) {
      setUsers(numValue);
    } else if (numValue < 20) {
      setUsers(numValue); // Cho phép nhập số nhỏ hơn 20 để hiển thị lỗi
    }
  };

  const handleCredisChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    const numValue = Number(value);
    if (value === "" || numValue >= 0) {
      setCredis(value === "" ? "" : numValue);
    }
  };

  const handleContinue = () => {
    if (!pricing || !isValid) return;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const user = token ? decodeTokenGetUser(token) : null;
    const isAuthenticated = !!user;

    let orderType = "register";
    if (isAuthenticated) {
      const currentSlug = currentPlanSlug || user?.planSlug || "";
      if (
        currentSlug &&
        currentSlug.toLowerCase() === plan.slug.toLowerCase()
      ) {
        orderType = "renew";
      } else if (currentSlug) {
        orderType = "upgrade";
      } else {
        orderType = "upgrade";
      }
    }

    const params = new URLSearchParams({
      plan: plan.slug,
      cycle,
      type: orderType,
      customStorage: Number(storage),
      customUsers: Number(users),
      credis: Number(credis) || 0,
    });

    router.push(`/pricing/checkout?${params.toString()}`);
    onClose();
  };

  const isValid =
    Number(storage) >= 20 &&
    Number(users) >= 20 &&
    pricing &&
    !error;

  return (
    <Modal onClose={onClose}>
      <div className="p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-strong">
            Cấu hình gói {plan?.name}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-strong transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-strong mb-1">
              Dung lượng (TB) <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={storage}
              onChange={handleStorageChange}
              placeholder="Tối thiểu 20 TB"
              className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            {storage !== "" && Number(storage) < 20 && (
              <p className="text-xs text-danger mt-1">
                Dung lượng tối thiểu là 20 TB
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-strong mb-1">
              Số người dùng <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={users}
              onChange={handleUsersChange}
              placeholder="Tối thiểu 20 người"
              className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            {users !== "" && Number(users) < 20 && (
              <p className="text-xs text-danger mt-1">
                Số người dùng tối thiểu là 20
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-strong mb-1">
              Credis <span className="text-text-muted">(100 VND/credis)</span>
            </label>
            <input
              type="text"
              value={credis}
              onChange={handleCredisChange}
              placeholder="0"
              className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <p className="text-xs text-text-muted mt-1">
              Số credis sẽ được cộng vào tài khoản (100 VND/credis)
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="p-4 rounded-lg bg-surface-soft text-center text-sm text-text-muted">
              Đang tính toán giá...
            </div>
          )}

          {pricing && !loading && (
            <div className="p-4 rounded-lg bg-surface-soft space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Giá/tháng:</span>
                <span className="text-sm font-semibold text-text-strong">
                  {formatMoney(
                    cycle === "year"
                      ? pricing.pricing.finalAmount / 12
                      : pricing.pricing.finalAmount
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">
                  Thanh toán {cycle === "year" ? "năm" : "tháng"}:
                </span>
                <span className="text-base font-bold text-text-strong">
                  {formatMoney(pricing.pricing.finalAmount)}
                </span>
              </div>
              {pricing.pricing.credisAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">
                    Credis ({pricing.pricing.credis || 0}):
                  </span>
                  <span className="text-sm font-semibold text-text-strong">
                    +{formatMoney(pricing.pricing.credisAmount)}
                  </span>
                </div>
              )}
              {pricing.pricing.discountAmount > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                  <span className="text-sm text-text-muted">Đã giảm:</span>
                  <span className="text-sm font-semibold text-success">
                    -{formatMoney(pricing.pricing.discountAmount)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border)] text-text-strong hover:bg-surface-soft transition"
            >
              Hủy
            </button>
            <button
              onClick={handleContinue}
              disabled={!isValid || loading}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                isValid && !loading
                  ? "bg-brand text-[var(--color-surface-50)] hover:opacity-90"
                  : "bg-surface-soft text-text-muted cursor-not-allowed"
              }`}
            >
              Tiếp tục
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

