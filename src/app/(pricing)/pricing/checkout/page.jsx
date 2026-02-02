"use client";
import { Suspense, useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import toast from "react-hot-toast";
import {
  useCheckoutAuth,
  useCheckoutPlan,
  useCheckoutForm,
  useSlastCheck,
  useCheckoutSummary,
  useCheckoutOrder,
} from "@/features/pricing/hooks";
import { usePendingOrder } from "@/features/plans/hooks";
import { formatMoney } from "@/features/pricing/utils";

import publicPaymentService from "@/features/pricing/services/publicPaymentService";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planSlug = searchParams.get("plan");
  const cycleParam = searchParams.get("cycle");
  const orderTypeParam = searchParams.get("type");
  const storageParam =
    searchParams.get("customStorage") || searchParams.get("storage");
  const usersParam =
    searchParams.get("customUsers") || searchParams.get("users");
  const credisParam = searchParams.get("credis");
  const [cycle, setCycle] = useState(cycleParam === "year" ? "year" : "month");
  const [paymentOption, setPaymentOption] = useState("bank_transfer");
  const [vnpayEnabled, setVnpayEnabled] = useState(false);

  // Check VNPay status
  useEffect(() => {
    const checkPaymentSettings = async () => {
      try {
        const response = await publicPaymentService.getPublicSettings();
        if (response.success && response.data) {
          setVnpayEnabled(response.data.vnpayEnabled);
        }
      } catch (error) {
        console.error("Failed to load payment settings", error);
      }
    };
    checkPaymentSettings();
  }, []);

  // Hooks
  const { isAuthenticated, currentUser, orderType } =
    useCheckoutAuth(orderTypeParam);
  const { plan, loading: planLoading } = useCheckoutPlan(planSlug);
  const {
    form,
    setForm,
    custom,
    setCustom,
    errors,
    setErrors,
    handleInputChange: handleFormInputChange,
    handleCustomInput: handleFormCustomInput,
    validateForm,
    buildPayload: buildFormPayload,
  } = useCheckoutForm(
    {},
    {
      storage: storageParam ? Number(storageParam) : 20,
      users: usersParam ? Number(usersParam) : 20,
      credis: credisParam ? Number(credisParam) : 0,
    },
    isAuthenticated,
    orderType,
    currentUser,
    planSlug,
    plan,
  );

  const handleInputChange = (e) => {
    handleFormInputChange(e);
    setSuccess(false);
  };

  const handleCustomInput = (e) => {
    handleFormCustomInput(e, () => setSummary(null));
  };

  const { slastExists, slastChecking } = useSlastCheck(form.slast);

  const buildPayload = () => buildFormPayload(cycle, orderType, paymentOption);

  const {
    summary,
    loading: loadingSummary,
    generateSummary,
    setSummary,
  } = useCheckoutSummary({
    plan,
    isAuthenticated,
    orderType,
    cycle,
    planSlug,
    buildPayload,
    formEmail: form.email,
    onError: (errorMessage) => {
      // Hiển thị toast và quay về khi có lỗi từ auto-load
      toast.error(errorMessage || "Có lỗi xảy ra khi tính toán giá.");
      setTimeout(() => {
        router.back();
      }, 2000);
    },
  });

  const { submitting, success, submitOrder, setSuccess } =
    useCheckoutOrder(buildPayload);
  const {
    hasPendingOrder,
    pendingOrder,
    loading: pendingLoading,
  } = usePendingOrder();

  // Handlers
  const handleGenerateSummary = async (e) => {
    e.preventDefault();
    if (hasPendingOrder) {
      toast.error(
        "Bạn đang có đơn hàng chờ duyệt. Vui lòng đợi admin xử lý trước khi tạo đơn mới.",
      );
      return;
    }
    if (!validateForm(slastExists)) return;
    const result = await generateSummary();
    if (!result.success) {
      const errorMessage =
        result.error || "Có lỗi xảy ra khi tạo hướng dẫn thanh toán.";
      toast.error(errorMessage);
      setErrors((prev) => ({ ...prev, form: errorMessage }));
      // Quay về trang trước sau 2 giây
      setTimeout(() => {
        router.back();
      }, 2000);
    } else {
      setSuccess(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (hasPendingOrder) {
      toast.error(
        "Bạn đang có đơn hàng chờ duyệt. Vui lòng đợi admin xử lý trước khi tạo đơn mới.",
      );
      return;
    }
    if (!summary) {
      const errorMessage = "Vui lòng tạo hướng dẫn thanh toán trước.";
      toast.error(errorMessage);
      setErrors((prev) => ({ ...prev, form: errorMessage }));
      return;
    }
    const result = await submitOrder();

    if (!result.success) {
      const errorMessage = result.error || "Có lỗi xảy ra khi tạo đơn hàng.";
      toast.error(errorMessage);
      setErrors((prev) => ({ ...prev, form: errorMessage }));
    } else {
      // Handle VNPay redirect logic (2-step)
      if (paymentOption === 'vnpay') {
         // Step 1: Order created, now get the payment URL
         // Note: result.data usually contains the full order object. 
         // Adjust based on your API response structure. 
         // Assuming result.data.data._id based on docs.
         const orderId = result.data?.data?._id || result.data?._id; 
         
         if (orderId) {
             try {
                 const urlResponse = await publicPaymentService.createVnpayUrl(orderId);
                 if (urlResponse.success && urlResponse.data?.paymentUrl) {
                     window.location.href = urlResponse.data.paymentUrl;
                     return;
                 } else {
                     toast.error("Không thể tạo link thanh toán VNPay.");
                 }
             } catch (err) {
                 console.error("Error creating VNPay URL:", err);
                 toast.error("Lỗi kết nối khi tạo link thanh toán.");
             }
         } else {
             toast.error("Không tìm thấy mã đơn hàng để thanh toán.");
         }
      }
    }
  };

  const handleCycleChange = (newCycle) => {
    setCycle(newCycle);
    setSummary(null);
  };

  const planFeatures = useMemo(() => {
    if (summary?.plan?.description?.length) return summary.plan.description;
    if (plan?.description?.length) return plan.description;
    return [];
  }, [plan, summary]);

  const amountDisplay = summary
    ? formatMoney(summary.pricing.finalAmount)
    : "—";

  return (
    <div className="min-h-screen bg-[var(--color-surface-soft)] py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-[var(--color-text-muted)] uppercase tracking-wide">
              Quy trình thanh toán
            </p>
            <h1 className="text-3xl font-bold text-[var(--color-text-strong)]">
              {isAuthenticated && orderType !== "register"
                ? "Nâng cấp / Gia hạn gói dịch vụ"
                : "Hoàn tất đăng ký gói dịch vụ"}
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-full border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-strong)] hover:bg-white transition"
            >
              ← Quay lại bảng giá
            </button>
          </div>
        </div>
        {hasPendingOrder && !pendingLoading && (
          <div className="bg-brand-50 border border-brand-300 rounded-xl p-4 text-brand-800 mb-6">
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
                <p className="text-brand-700 text-sm">
                  Bạn đã gửi yêu cầu nâng cấp/gia hạn gói{" "}
                  <span className="font-medium">
                    {pendingOrder?.plan?.name || ""}
                  </span>
                  . Vui lòng đợi admin duyệt đơn hàng trước khi thực hiện giao
                  dịch mới. Bạn có thể quay lại trang quản lý gói để xem trạng
                  thái đơn hàng.
                </p>
              </div>
            </div>
          </div>
        )}
        {!planSlug && (
          <div className="bg-white border border-[var(--color-border)] rounded-xl p-4 text-[var(--color-danger)]">
            Không tìm thấy gói hợp lệ. Vui lòng quay lại bảng giá để chọn gói
            cần mua.
          </div>
        )}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-card border border-[var(--color-border)] p-6 space-y-6">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Gói bạn đã chọn
                  </p>
                  <h2 className="text-xl font-semibold text-[var(--color-text-strong)]">
                    {planLoading ? (
                      <Skeleton width={160} />
                    ) : plan ? (
                      plan.name
                    ) : (
                      "Chưa xác định"
                    )}
                  </h2>
                </div>
                <div className="inline-flex rounded-full bg-[var(--color-surface-soft)] p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => handleCycleChange("month")}
                    className={`px-3 py-1 rounded-full ${
                      cycle === "month"
                        ? "bg-[var(--color-brand-500)] text-white"
                        : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    Theo tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCycleChange("year")}
                    className={`px-3 py-1 rounded-full ${
                      cycle === "year"
                        ? "bg-[var(--color-brand-500)] text-white"
                        : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    Theo năm
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] p-4 bg-[var(--color-surface-50)]">
                <p className="text-sm text-[var(--color-text-muted)]">
                  Thành tiền dự kiến
                </p>
                <p className="text-4xl font-bold text-[var(--color-brand-600)]">
                  {loadingSummary ||
                  (isAuthenticated &&
                    orderType !== "register" &&
                    !summary &&
                    plan) ? (
                    <Skeleton width={120} height={36} />
                  ) : summary ? (
                    amountDisplay
                  ) : planLoading ? (
                    <Skeleton width={120} height={36} />
                  ) : (
                    "—"
                  )}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {loadingSummary ||
                  (isAuthenticated &&
                    orderType !== "register" &&
                    !summary &&
                    plan)
                    ? "Đang tính toán số tiền cần thanh toán..."
                    : summary
                      ? `Đã tính tất cả ưu đãi & mã giảm giá.`
                      : isAuthenticated && orderType !== "register"
                        ? "Đang tính toán số tiền cần thanh toán..."
                        : "Điền thông tin để hệ thống tạo hướng dẫn thanh toán."}
                </p>
              </div>
            </section>
            {isAuthenticated && orderType !== "register" ? (
              // Hiển thị thông tin user khi đã đăng nhập
              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--color-border)] p-4 bg-[var(--color-surface-50)]">
                  <p className="text-sm font-semibold text-[var(--color-text-strong)] mb-3">
                    Thông tin tài khoản
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-[var(--color-text-muted)]">
                        Họ và tên:
                      </span>
                      <span className="font-medium text-[var(--color-text-strong)]">
                        {form.fullName || "Chưa cập nhật"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">
                        Email:
                      </span>
                      <span className="font-medium text-[var(--color-text-strong)]">
                        {form.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">
                        Số điện thoại:
                      </span>
                      <span className="font-medium text-[var(--color-text-strong)]">
                        {form.phone || "Chưa cập nhật"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)]">
                        Định danh:
                      </span>
                      <span className="font-medium text-[var(--color-text-strong)]">
                        {form.slast}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Form nhập thông tin khi chưa đăng nhập
              <form className="space-y-4" onSubmit={handleGenerateSummary}>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-strong)]">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-4 py-3 rounded-2xl border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-200)]"
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.fullName && (
                    <p className="text-xs text-[var(--color-danger)] mt-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-strong)]">
                    Email liên hệ
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-4 py-3 rounded-2xl border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-200)]"
                    placeholder="you@email.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-[var(--color-danger)] mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-strong)]">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-4 py-3 rounded-2xl border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-200)]"
                    placeholder="0981 234 567"
                  />
                  {errors.phone && (
                    <p className="text-xs text-[var(--color-danger)] mt-1">
                      {errors.phone}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-strong)] flex items-center gap-2">
                    Định danh (Slast)
                    {slastChecking && (
                      <span className="text-xs text-[var(--color-brand-500)]">
                        Đang kiểm tra...
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="slast"
                    value={form.slast}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-4 py-3 rounded-2xl border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-200)]"
                    placeholder="company-name"
                  />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Định danh dùng để tạo workspace cho doanh nghiệp.
                  </p>
                  {errors.slast && (
                    <p className="text-xs text-[var(--color-danger)] mt-1">
                      {errors.slast}
                    </p>
                  )}
                  {slastExists && !errors.slast && (
                    <p className="text-xs text-[var(--color-danger)] mt-1">
                      Định danh đã tồn tại, hãy chọn tên khác.
                    </p>
                  )}
                </div>
                {plan?.isCustom && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[var(--color-text-strong)]">
                        Dung lượng (TB)
                      </label>
                      <input
                        type="number"
                        min={20}
                        name="storage"
                        value={custom.storage}
                        onChange={handleCustomInput}
                        className="w-full mt-1 px-4 py-3 rounded-2xl border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-200)]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[var(--color-text-strong)]">
                        Người dùng
                      </label>
                      <input
                        type="number"
                        min={20}
                        name="users"
                        value={custom.users}
                        onChange={handleCustomInput}
                        className="w-full mt-1 px-4 py-3 rounded-2xl border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-200)]"
                      />
                    </div>
                    {errors.custom && (
                      <p className="text-xs text-[var(--color-danger)] mt-1 md:col-span-2">
                        {errors.custom}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-strong)]">
                    Mã giảm giá (nếu có)
                  </label>
                  <input
                    type="text"
                    name="discountCode"
                    value={form.discountCode}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-4 py-3 rounded-2xl border border-[var(--color-border)] uppercase focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-200)]"
                    placeholder="D2M2025"
                  />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Mã giảm giá chỉ áp dụng cho lần đầu mua gói.
                  </p>
                </div>
                {errors.form && (
                  <div className="text-sm text-[var(--color-danger)] bg-[var(--color-danger-50)] border border-[var(--color-danger-200)] rounded-xl px-3 py-2">
                    {errors.form}
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-brand-500)] text-white font-semibold px-4 py-3 shadow hover:bg-[var(--color-brand-600)] transition disabled:opacity-60"
                    disabled={loadingSummary || hasPendingOrder}
                  >
                    {hasPendingOrder
                      ? "Đang chờ duyệt đơn"
                      : loadingSummary
                        ? "Đang xử lý..."
                        : "Tạo hướng dẫn thanh toán"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-3 rounded-2xl border border-[var(--color-border)] text-[var(--color-text-strong)] font-semibold"
                  >
                    Chọn gói khác
                  </button>
                </div>
              </form>
            )}
            {/* Custom plan và discount code cho user đã đăng nhập */}
            {isAuthenticated && orderType !== "register" && (
              <div className="space-y-4">
                {plan?.isCustom && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[var(--color-text-strong)]">
                        Dung lượng (TB)
                      </label>
                      <input
                        type="number"
                        min={20}
                        name="storage"
                        value={custom.storage}
                        onChange={handleCustomInput}
                        className="w-full mt-1 px-4 py-3 rounded-2xl border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-200)]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[var(--color-text-strong)]">
                        Người dùng
                      </label>
                      <input
                        type="number"
                        min={20}
                        name="users"
                        value={custom.users}
                        onChange={handleCustomInput}
                        className="w-full mt-1 px-4 py-3 rounded-2xl border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-200)]"
                      />
                    </div>
                    {errors.custom && (
                      <p className="text-xs text-[var(--color-danger)] mt-1 md:col-span-2">
                        {errors.custom}
                      </p>
                    )}
                  </div>
                )}
                {orderType === "register" ? (
                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-strong)]">
                      Mã giảm giá (nếu có)
                    </label>
                    <input
                      type="text"
                      name="discountCode"
                      value={form.discountCode}
                      onChange={handleInputChange}
                      className="w-full mt-1 px-4 py-3 rounded-2xl border border-[var(--color-border)] uppercase focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-200)]"
                      placeholder="D2M2025"
                    />
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      Mã giảm giá chỉ áp dụng cho lần đầu mua gói.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-50)] p-4">
                    <p className="text-sm text-[var(--color-text-muted)]">
                      <strong className="text-[var(--color-text-strong)]">
                        Mã giảm giá:
                      </strong>{" "}
                      Chỉ áp dụng cho lần đầu mua gói. Không thể sử dụng cho
                      nâng cấp hoặc gia hạn.
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleGenerateSummary}
                    className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-brand-500)] text-white font-semibold px-4 py-3 shadow hover:bg-[var(--color-brand-600)] transition disabled:opacity-60"
                    disabled={loadingSummary || hasPendingOrder}
                  >
                    {hasPendingOrder
                      ? "Đang chờ duyệt đơn"
                      : loadingSummary
                        ? "Đang tính toán..."
                        : "Tính lại giá"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-3 rounded-2xl border border-[var(--color-border)] text-[var(--color-text-strong)] font-semibold"
                  >
                    Chọn gói khác
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="bg-white rounded-3xl shadow-card border border-[var(--color-border)] p-6 space-y-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--color-text-strong)]">
                  Phương thức thanh toán
                </h3>
                <span className="text-xs text-[var(--color-text-muted)]">
                  Tổng thanh toán: <strong>{amountDisplay}</strong>
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!vnpayEnabled}
                  onClick={() => vnpayEnabled && setPaymentOption("vnpay")}
                  className={`rounded-2xl px-4 py-4 text-left space-y-1 border transition ${
                      !vnpayEnabled
                        ? "border-dashed border-[var(--color-border)] opacity-60 cursor-not-allowed"
                        : paymentOption === "vnpay"
                          ? "border-[var(--color-brand-400)] bg-[var(--color-accent-50)]"
                          : "border-[var(--color-border)] hover:border-[var(--color-brand-200)]"
                  }`}
                >
                  <p className="text-sm font-semibold">VNPay QR</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {vnpayEnabled ? "Thanh toán nhanh qua ví VNPay" : "Đang bảo trì"}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentOption("bank_transfer")}
                  className={`rounded-2xl px-4 py-4 text-left space-y-1 border transition ${
                    paymentOption === "bank_transfer"
                      ? "border-[var(--color-brand-400)] bg-[var(--color-accent-50)]"
                      : "border-[var(--color-border)]"
                  }`}
                >
                  <p className="text-sm font-semibold">
                    Chuyển khoản ngân hàng
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Tạo QR và nội dung chuyển khoản tự động
                  </p>
                </button>
              </div>
            </section>
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--color-text-strong)]">
                Chi tiết thanh toán
              </h3>
              {loadingSummary ||
              (isAuthenticated &&
                orderType !== "register" &&
                !summary &&
                plan) ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[var(--color-border)] p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <Skeleton width={100} height={20} />
                      <Skeleton width={80} height={20} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <Skeleton width={120} height={20} />
                      <Skeleton width={80} height={20} />
                    </div>
                    <hr />
                    <div className="flex justify-between text-base">
                      <Skeleton width={150} height={24} />
                      <Skeleton width={100} height={24} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] p-4 space-y-2 bg-[var(--color-surface-50)]">
                    <Skeleton width="100%" height={100} />
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <Skeleton width={220} height={220} />
                    <Skeleton width={200} height={16} />
                  </div>
                </div>
              ) : summary ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[var(--color-border)] p-4 space-y-2">
                    <div className="flex justify-between text-sm text-[var(--color-text-muted)]">
                      <span>Giá niêm yết</span>
                      <span>{formatMoney(summary.pricing.baseAmount)}</span>
                    </div>
                    {summary.pricing.saleAmount > 0 && (
                      <div className="flex justify-between text-sm text-[var(--color-text-muted)]">
                        <span>Khuyến mãi trả trước</span>
                        <span>-{formatMoney(summary.pricing.saleAmount)}</span>
                      </div>
                    )}
                    {summary.discount?.amount ? (
                      <div className="flex justify-between text-sm text-[var(--color-success)] font-semibold">
                        <span>Mã giảm giá ({summary.discount.code})</span>
                        <span>-{formatMoney(summary.discount.amount)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm text-[var(--color-text-muted)]">
                        <span>Mã giảm giá</span> <span>Không áp dụng</span>
                      </div>
                    )}
                    <hr />
                    <div className="flex justify-between text-base font-semibold text-[var(--color-text-strong)]">
                      <span>Số tiền cần thanh toán</span>
                      <span>{amountDisplay}</span>
                    </div>
                  </div>

                  {/* Bank Transfer Details - Only show if Bank Transfer is selected */}
                  {paymentOption === "bank_transfer" && (
                    <>
                      <div className="rounded-2xl border border-[var(--color-border)] p-4 space-y-2 bg-[var(--color-surface-50)]">
                        <div className="text-sm text-[var(--color-text-muted)]">
                          <p>
                            Ngân hàng:
                            <strong>{summary.payment.bankTransfer.bankName}</strong>
                          </p>
                          <p>
                            Số tài khoản:
                            <strong>
                              {summary.payment.bankTransfer.accountNumber}
                            </strong>
                          </p>
                          <p>
                            Chủ TK:
                            <strong>
                              {summary.payment.bankTransfer.accountName}
                            </strong>
                          </p>
                          <p>
                            Nội dung chuyển khoản: <br />
                            <span className="text-sm font-semibold">
                              {summary.payment.bankTransfer.transferContent}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-3">
                        {summary.payment.bankTransfer.qrImageUrl ? (
                          <Image
                            src={summary.payment.bankTransfer.qrImageUrl}
                            alt="QR chuyển khoản"
                            width={220}
                            height={220}
                            className="rounded-3xl border border-[var(--color-border)] shadow"
                          />
                        ) : (
                          <Skeleton width={220} height={220} />
                        )}
                        <p className="text-xs text-[var(--color-text-muted)] text-center">
                          Quét QR để điền sẵn số tiền và nội dung chuyển khoản.
                        </p>
                      </div>
                    </>
                  )}

                  {/* VNPay Helper Message */}
                  {paymentOption === "vnpay" && (
                     <div className="rounded-2xl border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] p-4 text-sm text-[var(--color-brand-800)] text-center">
                        Nhấn nút <strong>"Thanh toán ngay"</strong> bên dưới để chuyển đến cổng thanh toán VNPay.
                     </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
                  {loadingSummary
                    ? "Đang tính toán số tiền cần thanh toán..."
                    : 'Điền thông tin bên trái và nhấn"Tạo hướng dẫn thanh toán" để nhận QR cùng nội dung chuyển khoản.'}
                </div>
              )}
            </section>
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--color-text-strong)]">
                Quyền lợi của gói
              </h3>
              <ul className="space-y-2">
                {planFeatures.length ? (
                  planFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-brand-400)]" />
                      <span className="text-[var(--color-text-strong)]">
                        {feature}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-[var(--color-text-muted)]">
                    Đang cập nhật thông tin gói.
                  </li>
                )}
              </ul>
            </section>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={!summary || submitting || hasPendingOrder}
                className="w-full rounded-2xl bg-[var(--color-brand-500)] text-white font-semibold py-3 shadow hover:bg-[var(--color-brand-600)] disabled:opacity-60"
              >
                {hasPendingOrder
                  ? "Đang chờ duyệt đơn"
                  : submitting
                    ? "Đang xử lý..."
                    : paymentOption === "vnpay"
                      ? "Thanh toán ngay"
                      : "Xác nhận đã chuyển khoản"}
              </button>
              {success && (
                <div className="rounded-2xl border border-[var(--color-success-300)] bg-[var(--color-success-50)] text-[var(--color-success-700)] text-sm px-4 py-3">
                  Cảm ơn bạn! Đơn hàng đã được ghi nhận, đội ngũ D2MBox sẽ liên
                  hệ để kích hoạt gói trong thời gian sớm nhất.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-soft)] py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Skeleton width={150} height={16} />
            <Skeleton width={300} height={32} className="mt-2" />
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-card border border-[var(--color-border)] p-6">
            <Skeleton height={400} />
          </div>
          <div className="bg-white rounded-3xl shadow-card border border-[var(--color-border)] p-6">
            <Skeleton height={400} />
          </div>
        </div>
      </div>
    </div>
  );
}
export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}
