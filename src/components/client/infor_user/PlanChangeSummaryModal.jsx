import React, { useState, useEffect, useMemo } from "react";
import axiosClient from "@/lib/axiosClient";
import { calcPlanChange, getCustomPlanPrice } from "@/utils/planUtils";

const bankIdMap = {
  MBbank: "mbbank",
  Vietcombank: "vietcombank",
  Techcombank: "techcombank",
  BIDV: "bidv",
  Agribank: "agribank",
  ACB: "acb",
  Sacombank: "sacombank",
  VPBank: "vpbank",
};

export default function PlanChangeSummaryModal({
  open,
  onClose,
  user,
  currentPlan,
  targetPlan,
  actionType, // "renew" | "upgrade" | "downgrade"
  onConfirm,
}) {
  const [discountCode, setDiscountCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState(null); // {valid, percent}
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [billingType, setBillingType] = useState("month"); // "month" | "year"
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [now, setNow] = useState(new Date());

  // Thêm state cho custom plan
  const [custom, setCustom] = useState({ storage: 20, users: 20 });
  const [customError, setCustomError] = useState("");

  // Thêm state cho ngày hết hạn và ngày còn lại dạng string để tránh hydration error
  const [formattedPlanEndDate, setFormattedPlanEndDate] = useState("");
  const [clientDaysLeft, setClientDaysLeft] = useState(null);

  useEffect(() => {
    if (open) {
      setPaymentLoading(true);
      setPaymentMethod(null);
      axiosClient
        .get("/api/admin/payment-methods", { params: { limit: 1 } })
        .then((res) => {
          if (res.data.success && res.data.data.length > 0) {
            setPaymentMethod(res.data.data[0]);
          }
        })
        .finally(() => setPaymentLoading(false));
    }
  }, [open]);

  useEffect(() => {
    if (open) setNow(new Date());
  }, [open]);

  // Nếu là custom plan, reset input khi mở modal
  useEffect(() => {
    if (open && targetPlan?.isCustom) {
      setCustom({ storage: 20, users: 20 });
      setCustomError("");
    }
  }, [open, targetPlan]);

  // Validate custom input
  const validateCustom = () => {
    if (!Number.isInteger(Number(custom.storage)) || custom.storage < 20) {
      setCustomError("Dung lượng tối thiểu 20TB, số nguyên");
      return false;
    }
    if (!Number.isInteger(Number(custom.users)) || custom.users < 20) {
      setCustomError("Số người dùng tối thiểu 20, số nguyên");
      return false;
    }
    setCustomError("");
    return true;
  };

  // Xác định chu kỳ đang chọn (tháng/năm) chỉ dựa vào billingType
  const selectedCycle = billingType;
  const oldType = user?.planType || "month";

  // Tính ngày còn lại và tổng số ngày
  let end = user?.planEndDate ? new Date(user.planEndDate) : null;
  let start = user?.planStartDate ? new Date(user.planStartDate) : null;
  let daysLeft = 0;
  let totalDays = 30;
  if (end && start) {
    daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (isNaN(totalDays) || totalDays <= 0)
      totalDays = oldType === "year" ? 365 : 30;
    if (isNaN(daysLeft) || daysLeft < 0) daysLeft = 0;
  }

  // Tính giá động cho custom plan hiện tại (user)
  const userCustomPlanPrice = useMemo(() => {
    if (
      user?.plan?.name?.toLowerCase().includes("tùy chọn") ||
      user?.plan?.isCustom ||
      user?.maxStorage
    ) {
      // maxStorage là byte, convert về TB
      return getCustomPlanPrice(
        (user.maxStorage || 0) / 1024 ** 4,
        user.maxUser || 0
      );
    }
    return {
      month: Number(user?.plan?.priceMonth || 0),
      year: Number(user?.plan?.priceYear || 0),
    };
  }, [user]);
  // Khi là custom plan, truyền giá động vào calcPlanChange để tính toán đúng số tiền, ngày cộng thêm, v.v.
  const currentCustomPlanPrice = useMemo(() => {
    if (currentPlan?.isCustom) {
      return getCustomPlanPrice(currentPlan.storage, currentPlan.users);
    }
    return {
      month: Number(currentPlan?.priceMonth || 0),
      year: Number(currentPlan?.priceYear || 0),
    };
  }, [currentPlan]);
  const targetCustomPlanPrice = useMemo(() => {
    if (targetPlan?.isCustom) {
      return getCustomPlanPrice(custom.storage, custom.users);
    }
    return {
      month: Number(targetPlan?.priceMonth || 0),
      year: Number(targetPlan?.priceYear || 0),
    };
  }, [targetPlan, custom.storage, custom.users]);

  const {
    amount: calcAmount,
    extraDays: calcExtraDays,
    allowChange,
  } = calcPlanChange({
    oldType,
    newType: selectedCycle,
    oldPriceMonth:
      user?.plan?.name?.toLowerCase().includes("tùy chọn") ||
      user?.plan?.isCustom
        ? userCustomPlanPrice.month
        : Number(currentPlan?.priceMonth || 0),
    oldPriceYear:
      user?.plan?.name?.toLowerCase().includes("tùy chọn") ||
      user?.plan?.isCustom
        ? userCustomPlanPrice.year
        : Number(currentPlan?.priceYear || 0),
    newPriceMonth: targetPlan?.isCustom
      ? targetCustomPlanPrice.month
      : Number(targetPlan?.priceMonth || 0),
    newPriceYear: targetPlan?.isCustom
      ? targetCustomPlanPrice.year
      : Number(targetPlan?.priceYear || 0),
    daysLeft,
    orderType: actionType,
  });
  let amount = calcAmount;
  let extraDays = calcExtraDays;

  // Ghi chú hiển thị cho user
  let note = "";
  if (!allowChange) {
    note =
      "Bạn không thể hạ cấp gói khi gói hiện tại còn thời hạn. Vui lòng đợi hết hạn để đổi sang gói thấp hơn.";
  } else if (oldType === selectedCycle) {
    note = `Nâng cấp gói cùng loại. Số tiền thanh toán = (giá trị gói mới cho số ngày còn lại) trừ đi giá trị còn lại của gói cũ.`;
  } else if (oldType === "month" && selectedCycle === "year") {
    note = `Nâng cấp từ tháng lên năm. Số tiền thanh toán = giá gói năm trừ đi giá trị còn lại của gói tháng.`;
  } else if (oldType === "year" && selectedCycle === "month") {
    note = `Chuyển từ năm sang tháng. Số ngày còn lại của gói năm sẽ được quy đổi thành ${extraDays} ngày sử dụng gói tháng mới.`;
  } else {
    note = "Đổi gói dịch vụ.";
  }

  // Áp dụng giảm giá nếu có mã hợp lệ
  let finalAmount = amount;
  if (discountInfo && discountInfo.valid && discountInfo.percent > 0) {
    finalAmount = Math.round(amount * (1 - discountInfo.percent / 100));
  }

  // Kiểm tra mã giảm giá
  const handleCheckDiscount = async () => {
    setDiscountLoading(true);
    setDiscountError("");
    setDiscountInfo(null);
    if (!discountCode.trim()) {
      setDiscountError("");
      setDiscountInfo(null);
      setDiscountLoading(false);
      return;
    }
    try {
      const res = await axiosClient.post("/api/admin/discount-codes/validate", {
        code: discountCode.trim(),
      });
      if (res.data.valid) {
        setDiscountInfo({ valid: true, percent: res.data.percent });
      } else {
        setDiscountInfo({ valid: false, percent: 0 });
        setDiscountError(res.data.message || "Mã giảm giá không hợp lệ");
      }
    } catch (err) {
      setDiscountInfo({ valid: false, percent: 0 });
      setDiscountError(
        err?.response?.data?.message || "Mã giảm giá không hợp lệ"
      );
    } finally {
      setDiscountLoading(false);
    }
  };

  // Khi xác nhận, chỉ gửi order không cần phone
  const handleConfirm = async () => {
    if (targetPlan?.isCustom && !validateCustom()) return;
    if (!allowChange) {
      setSubmitError("Không thể đổi gói khi gói hiện tại còn thời hạn.");
      return;
    }
    setSubmitLoading(true);
    setSubmitError("");
    try {
      // 1. Đánh dấu mã giảm giá đã dùng nếu hợp lệ
      if (discountCode.trim() && discountInfo && discountInfo.valid) {
        await axiosClient.post("/api/admin/discount-codes/use", {
          code: discountCode.trim(),
          email: user.email,
        });
      }
      // 2. Tạo order mới
      const orderBody = {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        slast: user.slast,
        type: actionType, // "renew" | "upgrade" | "downgrade"
        plan: {
          _id: targetPlan._id,
          name: targetPlan.name,
          price: finalAmount,
          duration: selectedCycle,
        },
        amount: finalAmount,
        paymentMethod: paymentMethod && {
          _id: paymentMethod._id,
          bankName: paymentMethod.bankName,
          accountNumber: paymentMethod.accountNumber,
          accountName: paymentMethod.accountName,
        },
        transferContent: paymentContent,
        discountCode:
          discountInfo && discountInfo.valid ? discountCode.trim() : null,
      };
      if (targetPlan?.isCustom) {
        orderBody.customStorage = Number(custom.storage);
        orderBody.customUsers = Number(custom.users);
        orderBody.customPriceMonth = targetCustomPlanPrice.month;
        orderBody.customPriceYear = targetCustomPlanPrice.year;
      }
      const orderRes = await axiosClient.post("/api/orders", orderBody);
      if (orderRes.data && orderRes.data.success) {
        setSubmitSuccess(true);
        onConfirm &&
          onConfirm({
            amount: finalAmount,
            type: actionType, // Đổi actionType thành type để đồng bộ
            targetPlan,
            billingType,
            extraDays,
            discountCode:
              discountInfo && discountInfo.valid ? discountCode.trim() : null,
            discountPercent:
              discountInfo && discountInfo.valid ? discountInfo.percent : 0,
          });
      } else {
        setSubmitError(orderRes.data?.error || "Tạo đơn hàng thất bại");
      }
    } catch (err) {
      setSubmitError("Có lỗi khi gửi đơn hàng hoặc mã giảm giá");
    } finally {
      setSubmitLoading(false);
    }
  };

  useEffect(() => {
    // Chỉ tính trên client để tránh hydration error
    if (typeof window !== "undefined" && user?.planEndDate) {
      setFormattedPlanEndDate(
        new Date(user.planEndDate).toLocaleDateString("vi-VN")
      );
      if (user.planEndDate) {
        const end = new Date(user.planEndDate);
        const now = new Date();
        setClientDaysLeft(
          Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
        );
      }
    }
  }, [user?.planEndDate]);

  if (!open) return null;

  // Thông tin thanh toán mẫu (có thể lấy từ config hoặc props sau)
  const paymentContent = `Thanh toan goi ${targetPlan?.name || "-"} cho ${
    user.email
  }`;
  const paymentAmount = finalAmount;
  // Thông tin thanh toán lấy từ paymentMethod
  const paymentBankId = bankIdMap[paymentMethod?.bankName] || "mbbank";
  const paymentAccountNumber = paymentMethod?.accountNumber || "";
  const paymentAccountName = paymentMethod?.accountName || "";
  const paymentBankName = paymentMethod?.bankName || "";
  const qrUrl = `https://img.vietqr.io/image/${paymentBankId}-${paymentAccountNumber}-compact2.png?amount=${finalAmount}&addInfo=${encodeURIComponent(
    paymentContent
  )}&accountName=${encodeURIComponent(paymentAccountName)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-[6px]">
      <div className="bg-white rounded-3xl shadow-2xl p-0 w-full max-w-5xl min-h-[520px] relative flex flex-col md:flex-row overflow-hidden border border-gray-200">
        <button
          className="absolute top-4 right-6 text-gray-400 hover:text-gray-700 text-2xl z-10"
          onClick={onClose}
          title="Đóng"
        >
          ×
        </button>
        {/* Bên trái: Thông tin user + mã giảm giá + chọn loại gói */}
        <div className="md:w-1/2 w-full p-10 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-between gap-8">
          <div>
            <div className="text-2xl font-bold mb-4">
              Thông tin người sở hữu
            </div>
            <div className="mb-3 text-lg font-semibold">
              {user.fullName} ({user.email})
            </div>
            <div className="mb-2 text-base text-gray-600">
              Gói hiện tại: <b>{currentPlan?.name || "-"}</b> (
              {oldType === "year" ? "Năm" : "Tháng"})
            </div>
            <div className="mb-2 text-base text-gray-600">
              Gói mới: <b>{targetPlan?.name || "-"}</b>
            </div>
            {/* Nếu là custom plan thì cho nhập input ở đây */}
            {targetPlan?.isCustom && (
              <div className="mb-2 text-base text-gray-600">
                <div className="flex gap-2 mb-2">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Dung lượng (TB):
                    </label>
                    <input
                      type="number"
                      min={20}
                      step={1}
                      name="storage"
                      value={custom.storage}
                      onChange={(e) =>
                        setCustom({
                          ...custom,
                          storage: e.target.value.replace(/[^0-9]/g, ""),
                        })
                      }
                      className="w-24 border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-[#1cadd9] text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Số người dùng:
                    </label>
                    <input
                      type="number"
                      min={20}
                      step={1}
                      name="users"
                      value={custom.users}
                      onChange={(e) =>
                        setCustom({
                          ...custom,
                          users: e.target.value.replace(/[^0-9]/g, ""),
                        })
                      }
                      className="w-24 border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-[#1cadd9] text-gray-900"
                    />
                  </div>
                </div>
                {customError && (
                  <div className="text-red-500 text-sm mb-2">{customError}</div>
                )}
                {/* Hiển thị giá custom plan: nếu là custom thì dùng amount đã tính toán, không dùng customPlanPriceSelected trực tiếp */}
                <div className="mb-2 text-lg font-bold text-primary">
                  {amount.toLocaleString("vi-VN")}₫/
                  {selectedCycle === "year" ? "năm" : "tháng"}
                </div>
              </div>
            )}
            <div className="mb-2 text-base text-gray-600 flex items-center gap-3">
              <span>Chọn loại:</span>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="billingType"
                  value="month"
                  checked={billingType === "month"}
                  onChange={() => setBillingType("month")}
                  className="accent-primary"
                />
                <span>Tháng</span>
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="billingType"
                  value="year"
                  checked={billingType === "year"}
                  onChange={() => setBillingType("year")}
                  className="accent-primary"
                />
                <span>Năm</span>
              </label>
            </div>
            <div className="mb-2 text-base text-gray-600">
              Ngày hết hạn hiện tại: <b>{formattedPlanEndDate || "-"}</b>
            </div>
            <div className="mb-2 text-base text-gray-600">
              Số ngày còn lại:{" "}
              <b>{clientDaysLeft !== null ? clientDaysLeft : daysLeft}</b>
            </div>
            {extraDays > 0 && (
              <div className="mb-2 text-base text-green-700 font-semibold flex items-center gap-2">
                Số ngày được cộng thêm vào gói mới: <b>{extraDays}</b>
                <span className="relative group cursor-pointer">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="inline-block text-gray-400 hover:text-primary"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <text
                      x="12"
                      y="16"
                      textAnchor="middle"
                      fontSize="12"
                      fill="currentColor"
                      fontWeight="bold"
                    >
                      ?
                    </text>
                  </svg>
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 z-20 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg w-[260px]">
                    Số ngày được cộng thêm = (Số ngày còn lại của gói cũ ×
                    giá/ngày gói cũ) chia cho giá/ngày gói mới.\n\nNếu gói mới
                    đắt hơn, số ngày quy đổi sẽ ít hơn. Nếu gói mới rẻ hơn, số
                    ngày quy đổi sẽ nhiều hơn.
                  </span>
                </span>
              </div>
            )}
            {actionType === "upgrade" && oldType === selectedCycle && (
              <div className="mb-2 text-base text-blue-700 font-semibold flex items-center gap-2">
                <span>
                  Số tiền thanh toán đã được tính theo tỉ lệ ngày còn lại
                  (pro-rata)
                </span>
                <span className="relative group cursor-pointer">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="inline-block text-gray-400 hover:text-primary"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <text
                      x="12"
                      y="16"
                      textAnchor="middle"
                      fontSize="12"
                      fill="currentColor"
                      fontWeight="bold"
                    >
                      ?
                    </text>
                  </svg>
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 z-20 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg w-[260px]">
                    Khi chuyển gói cùng loại (tháng → tháng hoặc năm → năm), số
                    tiền thanh toán = (giá trị gói mới cho số ngày còn lại) trừ
                    đi giá trị còn lại của gói cũ.\n\nBạn chỉ trả phần chênh
                    lệch khi nâng cấp.
                  </span>
                </span>
              </div>
            )}
            {/* Hiển thị logic tính toán theo từng case */}
            {!allowChange && actionType === "downgrade" && daysLeft > 0 && (
              <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4">
                <b>Không thể hạ cấp khi gói hiện tại còn ngày sử dụng.</b>
                <br />
                Vui lòng đợi hết hạn để đổi sang gói thấp hơn hoặc hết hạn mới
                được đổi.
              </div>
            )}
            {allowChange &&
              actionType === "downgrade" &&
              oldType === "year" &&
              selectedCycle === "month" &&
              (extraDays > 0 ? (
                <div className="bg-blue-100 text-blue-800 p-3 rounded mb-4">
                  <b>Hạ cấp từ gói năm sang gói tháng:</b>
                  <br />
                  Số ngày còn lại của gói năm sẽ được quy đổi thành{" "}
                  <b>{extraDays}</b> ngày sử dụng gói tháng mới.
                </div>
              ) : (
                <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4">
                  <b>
                    Giá trị còn lại của gói cũ không đủ để quy đổi thành ngày sử
                    dụng gói mới.
                  </b>
                  <br />
                  Bạn sẽ bắt đầu gói mới mà không được cộng thêm ngày.
                </div>
              ))}
            {allowChange &&
              (actionType === "upgrade" || actionType === "renew") &&
              oldType === selectedCycle && (
                <div className="bg-green-100 text-green-800 p-3 rounded mb-4">
                  <b>Nâng cấp/gia hạn cùng loại:</b>
                  <br />
                  Số tiền thanh toán = Giá gói mới - Giá trị còn lại của gói cũ.
                  <br />
                  <b>Giá trị còn lại:</b> {amount.toLocaleString("vi-VN")}₫
                  <br />
                  <b>Giá gói mới:</b>{" "}
                  {targetCustomPlanPrice.year.toLocaleString("vi-VN")}₫
                </div>
              )}
            {allowChange &&
              actionType === "upgrade" &&
              oldType === "month" &&
              selectedCycle === "year" && (
                <div className="bg-green-100 text-green-800 p-3 rounded mb-4">
                  <b>Nâng cấp từ tháng lên năm:</b>
                  <br />
                  Số tiền thanh toán = Giá gói năm - Giá trị còn lại của gói
                  tháng.
                  <br />
                  <b>Giá trị còn lại:</b> {amount.toLocaleString("vi-VN")}₫
                  <br />
                  <b>Giá gói năm:</b>{" "}
                  {targetCustomPlanPrice.year.toLocaleString("vi-VN")}₫
                </div>
              )}
            {allowChange && actionType === "register" && (
              <div className="bg-green-100 text-green-800 p-3 rounded mb-4">
                <b>Đăng ký mới:</b> Trả đủ giá gói mới.
              </div>
            )}
            {/* Hiển thị cảnh báo nếu không cho đổi gói */}
            {!allowChange && (
              <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4">
                Bạn không thể hạ cấp hoặc đổi gói khi gói hiện tại còn thời hạn.
                Vui lòng đợi hết hạn để đổi sang gói thấp hơn hoặc hết hạn mới
                được đổi.
              </div>
            )}
          </div>
          <div className="mt-8">
            <label className="block text-base font-medium text-gray-700 mb-2">
              Mã giảm giá (nếu có):
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                className="border border-gray-300 rounded-lg px-4 py-3 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg"
                placeholder="Nhập mã giảm giá..."
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value);
                  setDiscountInfo(null);
                  setDiscountError("");
                }}
                disabled={discountLoading}
              />
              <button
                className="px-5 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 text-lg"
                type="button"
                onClick={handleCheckDiscount}
                disabled={discountLoading || !discountCode.trim()}
              >
                {discountLoading ? "Đang kiểm tra..." : "Áp dụng"}
              </button>
            </div>
            {discountError && (
              <div className="text-xs text-red-500 mt-1">{discountError}</div>
            )}
            {discountInfo && discountInfo.valid && (
              <div className="text-xs text-green-600 mt-1">
                Áp dụng giảm {discountInfo.percent}%
              </div>
            )}
          </div>
        </div>
        {/* Bên phải: Thông tin thanh toán + QR */}
        <div className="md:w-1/2 w-full p-10 flex flex-col justify-between gap-8">
          {allowChange && (
            <>
              <div>
                <div className="text-2xl font-bold mb-4">
                  Thông tin thanh toán
                </div>
                <div className="mb-3 text-lg text-gray-700">
                  Số tiền cần thanh toán:{" "}
                  <b className="text-2xl text-primary">
                    {finalAmount.toLocaleString("vi-VN")}₫
                  </b>
                </div>
                <div className="mb-3 text-base text-gray-500 italic">
                  {note}
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-3 text-base font-medium text-gray-700">
                  Quét mã QR để thanh toán:
                </div>
                <div className="flex justify-center">
                  {paymentLoading ? (
                    <div className="mb-2 border rounded-xl w-[260px] h-[260px] bg-gray-200 animate-pulse object-contain" />
                  ) : (
                    <img
                      src={qrUrl}
                      alt="QR chuyển khoản VietQR"
                      className="mb-2 border rounded-xl w-[260px] h-[260px] object-contain shadow-lg"
                    />
                  )}
                </div>
                <div className="mt-4">
                  <div className="mb-1">
                    <span className="font-semibold">Ngân hàng:</span>{" "}
                    {paymentLoading
                      ? "Đang tải..."
                      : paymentBankName || (
                          <span className="text-gray-400">-</span>
                        )}
                  </div>
                  <div className="mb-1">
                    <span className="font-semibold">Số tài khoản:</span>{" "}
                    {paymentLoading
                      ? "Đang tải..."
                      : paymentAccountNumber || (
                          <span className="text-gray-400">-</span>
                        )}
                  </div>
                  <div className="mb-1">
                    <span className="font-semibold">Chủ tài khoản:</span>{" "}
                    {paymentLoading
                      ? "Đang tải..."
                      : paymentAccountName || (
                          <span className="text-gray-400">-</span>
                        )}
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="flex gap-4 justify-end mt-8">
            <button
              className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 text-lg"
              onClick={onClose}
              type="button"
            >
              Hủy
            </button>
            <button
              className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 text-lg"
              onClick={handleConfirm}
              type="button"
              disabled={
                !allowChange ||
                discountLoading ||
                (discountCode.trim() &&
                  (!discountInfo || !discountInfo.valid)) ||
                submitLoading
              }
            >
              {submitLoading ? "Đang gửi..." : "Xác nhận"}
            </button>
          </div>
          {submitError && (
            <div className="text-red-500 text-sm mt-2">{submitError}</div>
          )}
          {submitSuccess && (
            <div className="text-green-600 text-base mt-2 font-semibold">
              Đã gửi đơn hàng thành công! Vui lòng chờ admin duyệt.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
