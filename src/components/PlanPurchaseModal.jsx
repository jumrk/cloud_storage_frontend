import React, { useState, useEffect } from "react";
import paymentMethodService from "@/lib/paymentMethodService";
import axiosClient from "@/lib/axiosClient";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

let slastCheckTimeout = null;

export default function PlanPurchaseModal({
  open,
  onClose,
  selectedPlan,
  onSubmit,
}) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    discountCode: "",
    slast: "", // Thêm trường slast
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cycle, setCycle] = useState("month"); // "month" or "year"
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [discountInfo, setDiscountInfo] = useState(null); // {valid, percent}
  const [slastChecking, setSlastChecking] = useState(false);
  const [slastExists, setSlastExists] = useState(false);

  // Reset toàn bộ state mỗi khi modal được mở lại
  useEffect(() => {
    if (open) {
      setForm({
        fullName: "",
        email: "",
        phone: "",
        discountCode: "",
        slast: "",
      });
      setErrors({});
      setShowSuccess(false);
      setCycle("month");
      setEmailExists(false);
      setPaymentMethod(null);
      setShowPayment(false);
      setEmailChecked(false);
      setSubmitting(false);
      setDiscountInfo(null);
      paymentMethodService.getPaymentMethods({ limit: 1 }).then((payRes) => {
        const method =
          payRes.data && payRes.data.length > 0 ? payRes.data[0] : null;
        setPaymentMethod(method);
      });
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
    setShowPayment(false);
    setEmailChecked(false);
    setDiscountInfo(null); // Reset discount info when input changes

    // Kiểm tra slast realtime
    if (e.target.name === "slast") {
      const value = e.target.value.trim();
      setSlastExists(false);
      setSlastChecking(false);
      if (slastCheckTimeout) clearTimeout(slastCheckTimeout);
      if (!value || !/^[a-zA-Z0-9_-]+$/.test(value)) return;
      setSlastChecking(true);
      slastCheckTimeout = setTimeout(async () => {
        try {
          const res = await axiosClient.get("/api/user/check-slast", {
            params: { slast: value },
          });
          setSlastExists(res.data.exists);
        } catch (err) {
          setSlastExists(false);
        } finally {
          setSlastChecking(false);
        }
      }, 500);
    }
  };

  const getPrice = () => {
    if (!selectedPlan) return 0;
    let price = 0;
    if (cycle === "year") {
      price = selectedPlan.priceYear || 0;
      if (selectedPlan.sale > 0) {
        price = price * (1 - selectedPlan.sale / 100);
      }
    } else {
      price = selectedPlan.priceMonth || 0;
    }
    // Áp dụng giảm giá nếu có
    if (discountInfo && discountInfo.valid && discountInfo.percent > 0) {
      price = Math.round(price * (1 - discountInfo.percent / 100));
    }
    return price;
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ và tên";
    if (!form.email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      newErrors.email = "Email không hợp lệ";
    if (!form.phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại";
    if (!form.slast.trim()) newErrors.slast = "Vui lòng nhập định danh cá nhân";
    else if (!/^[a-zA-Z0-9_-]+$/.test(form.slast))
      newErrors.slast = "Chỉ dùng chữ, số, dấu gạch ngang hoặc gạch dưới";
    else if (slastExists)
      newErrors.slast =
        "Định danh này đã được sử dụng, hãy chọn định danh khác.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Build nội dung chuyển khoản: email - goi - Thang/Nam
  const content = `${form.email} - ${selectedPlan?.name} - ${
    cycle === "year" ? "Nam" : "Thang"
  }`;
  // Số tiền: lấy theo gói và chu kỳ
  const amount = getPrice();
  // Map tên ngân hàng sang mã BIN nếu thiếu bankCode
  const bankBinMap = {
    MBbank: "970422",
    Vietcombank: "970432",
    Techcombank: "970407",
    BIDV: "970418",
    Agribank: "970405",
    ACB: "970416",
    Sacombank: "970403",
    VPBank: "970432",
  };
  const bin =
    paymentMethod?.bankCode || bankBinMap[paymentMethod?.bankName] || "970432"; // fallback VCB

  // Map tên ngân hàng sang bankId vietqr.io
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
  const bankId = bankIdMap[paymentMethod?.bankName] || "vietcombank";
  const qrImgUrl =
    paymentMethod &&
    showPayment &&
    !checkingEmail &&
    !loading &&
    !errors.email &&
    !emailExists &&
    emailChecked
      ? `https://img.vietqr.io/image/${bankId}-${
          paymentMethod.accountNumber
        }-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
          content
        )}&accountName=${encodeURIComponent(paymentMethod.accountName)}`
      : null;

  // Kiểm tra email và mã giảm giá
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setCheckingEmail(true);
    setErrors({});
    setDiscountInfo(null);
    try {
      // 1. Kiểm tra email
      const emailRes = await axiosClient.get("/api/user/check-email", {
        params: { email: form.email },
      });
      if (emailRes.data.exists) {
        setErrors((prev) => ({
          ...prev,
          email: "Email đã tồn tại trên hệ thống",
        }));
        setEmailExists(true);
        setShowPayment(false);
        setEmailChecked(true);
        setDiscountInfo(null);
        return;
      } else {
        setEmailExists(false);
      }
      // 1.5. Kiểm tra slast (gọi API check slast nếu có, hoặc kiểm tra khi submit)
      // 2. Nếu có mã giảm giá thì kiểm tra mã
      if (form.discountCode.trim()) {
        try {
          const res = await axiosClient.post("/admin/discount-codes/validate", {
            code: form.discountCode.trim(),
          });
          if (res.data.valid) {
            setDiscountInfo({ valid: true, percent: res.data.percent });
          } else {
            setDiscountInfo({ valid: false, percent: 0 });
            setErrors((prev) => ({
              ...prev,
              discountCode: res.data.message || "Mã giảm giá không hợp lệ",
            }));
            setShowPayment(false);
            setEmailChecked(true);
            return;
          }
        } catch (err) {
          setDiscountInfo({ valid: false, percent: 0 });
          setErrors((prev) => ({
            ...prev,
            discountCode:
              err?.response?.data?.message || "Mã giảm giá không hợp lệ",
          }));
          setShowPayment(false);
          setEmailChecked(true);
          return;
        }
      } else {
        setDiscountInfo(null);
      }
      setShowPayment(true);
      setEmailChecked(true);
    } catch (err) {
      setErrors({ ...errors, payment: "Lỗi kiểm tra email" });
      setShowPayment(false);
      setEmailChecked(false);
      setDiscountInfo(null);
    } finally {
      setCheckingEmail(false);
    }
  };

  // Đăng ký
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!showPayment || !emailChecked || emailExists) return;
    setSubmitting(true);
    try {
      await axiosClient.post("/api/orders", {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        slast: form.slast, // Truyền slast lên backend
        plan: {
          _id: selectedPlan._id,
          name: selectedPlan.name,
          price: getPrice(),
          duration: cycle,
        },
        amount: getPrice(),
        paymentMethod: {
          _id: paymentMethod._id,
          bankName: paymentMethod.bankName,
          accountNumber: paymentMethod.accountNumber,
          accountName: paymentMethod.accountName,
        },
        transferContent: content,
        type: "register",
        discountCode: form.discountCode,
      });
      // Nếu có mã giảm giá, đánh dấu đã dùng
      if (form.discountCode.trim() && discountInfo && discountInfo.valid) {
        await axiosClient.post("/admin/discount-codes/use", {
          code: form.discountCode.trim(),
          email: form.email,
        });
      }
      setShowSuccess(true);
    } catch (err) {
      // Nếu backend trả về lỗi slast đã tồn tại
      if (err?.response?.data?.error?.includes("Slast")) {
        setErrors((prev) => ({ ...prev, slast: err.response.data.error }));
      } else {
        setErrors({
          ...errors,
          payment: "Lỗi đặt hàng hoặc lấy phương thức thanh toán",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Responsive: flex-col trên mobile, padding nhỏ lại
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-[6px]">
      <div
        className="bg-white rounded-3xl shadow-2xl p-0 w-full max-w-4xl min-h-[600px] md:min-h-[600px] relative flex flex-col md:flex-row overflow-hidden border border-gray-200 max-h-screen overflow-y-auto"
        style={{ boxSizing: "border-box" }}
      >
        <button
          className="absolute top-4 right-6 text-gray-400 hover:text-gray-700 text-2xl z-10"
          onClick={onClose}
          title="Đóng"
        >
          ×
        </button>
        {/* Bên trái: Form nhập thông tin */}
        <div className="md:w-1/2 w-full px-4 py-6 md:px-10 md:py-12 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-between gap-6 md:gap-8">
          <div>
            <div className="text-xl md:text-2xl font-bold mb-4 text-center md:text-left">
              Thông tin đăng ký
            </div>
            <form
              className="flex flex-col gap-3 md:gap-4"
              onSubmit={handleCheckEmail}
            >
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  name="fullName"
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg"
                  placeholder="Nhập họ và tên"
                  value={form.fullName}
                  onChange={handleChange}
                  disabled={checkingEmail || loading || submitting}
                />
                {errors.fullName && (
                  <div className="text-xs text-red-500 mt-1">
                    {errors.fullName}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg"
                  placeholder="Nhập email đăng nhập"
                  value={form.email}
                  onChange={handleChange}
                  disabled={checkingEmail || loading || submitting}
                />
                <div className="text-xs text-yellow-600 mt-1">
                  * Email dùng để đăng nhập, vui lòng nhập email chính chủ
                </div>
                {errors.email && (
                  <div className="text-xs text-red-500 mt-1">
                    {errors.email}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  name="phone"
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg"
                  placeholder="Nhập số điện thoại"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={checkingEmail || loading || submitting}
                />
                {errors.phone && (
                  <div className="text-xs text-red-500 mt-1">
                    {errors.phone}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  Định danh cá nhân (plans)
                </label>
                <input
                  type="text"
                  name="slast"
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg"
                  placeholder="Nhập định danh cá nhân (ví dụ: tên viết liền, nickname, mã riêng...)"
                  value={form.slast}
                  onChange={handleChange}
                  disabled={checkingEmail || loading || submitting}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Định danh này sẽ xuất hiện trên đường dẫn truy cập cá nhân của
                  bạn (ví dụ:{" "}
                  <b>
                    cloudstorage.com/leader/<i>slast</i>/home
                  </b>
                  ). Mỗi người dùng phải có một định danh duy nhất, không trùng
                  với người khác.
                </div>
                {slastChecking && (
                  <div className="text-xs text-blue-500 mt-1">
                    Đang kiểm tra định danh...
                  </div>
                )}
                {slastExists && !slastChecking && (
                  <div className="text-xs text-red-500 mt-1">
                    Định danh này đã được sử dụng, hãy chọn định danh khác.
                  </div>
                )}
                {errors.slast && (
                  <div className="text-xs text-red-500 mt-1">
                    {errors.slast}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  Mã giảm giá (nếu có)
                </label>
                <input
                  type="text"
                  name="discountCode"
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg"
                  placeholder="Nhập mã giảm giá..."
                  value={form.discountCode}
                  onChange={handleChange}
                  disabled={checkingEmail || loading || submitting}
                />
                {errors.discountCode && (
                  <div className="text-xs text-red-500 mt-1">
                    {errors.discountCode}
                  </div>
                )}
                {discountInfo && discountInfo.valid && (
                  <div className="text-xs text-green-600 mt-1">
                    Áp dụng giảm {discountInfo.percent}%
                  </div>
                )}
              </div>
              {errors.payment && (
                <div className="text-xs text-red-500 mt-1">
                  {errors.payment}
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  className="flex-1 px-4 py-3 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 text-lg"
                  onClick={onClose}
                  disabled={checkingEmail || loading || submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 text-lg flex items-center justify-center gap-2"
                  disabled={checkingEmail || loading || submitting}
                >
                  {checkingEmail ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        ></path>
                      </svg>
                      Đang kiểm tra...
                    </>
                  ) : (
                    "Kiểm tra"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        {/* Bên phải: Thông tin thanh toán + QR */}
        <div className="md:w-1/2 w-full px-4 py-6 md:px-10 md:py-12 flex flex-col justify-between gap-6 md:gap-8">
          <div>
            <div className="text-xl md:text-2xl font-bold mb-4 text-center md:text-left">
              Thông tin thanh toán
            </div>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                className={`flex-1 px-4 py-2 rounded-lg border font-semibold text-base transition-all ${
                  cycle === "month"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-primary border-gray-300"
                }`}
                onClick={() => setCycle("month")}
                disabled={checkingEmail || loading || submitting}
              >
                Thanh toán tháng
              </button>
              <button
                type="button"
                className={`flex-1 px-4 py-2 rounded-lg border font-semibold text-base transition-all ${
                  cycle === "year"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-primary border-gray-300"
                }`}
                onClick={() => setCycle("year")}
                disabled={checkingEmail || loading || submitting}
              >
                Thanh toán năm
              </button>
            </div>
            <div className="mb-3 text-lg text-gray-700">
              Số tiền cần thanh toán:{" "}
              <b className="text-2xl text-primary">
                {showPayment &&
                !checkingEmail &&
                !loading &&
                !errors.email &&
                !emailExists &&
                emailChecked ? (
                  amount.toLocaleString("vi-VN")
                ) : (
                  <Skeleton width={80} />
                )}
                ₫
              </b>
            </div>
            <div className="w-full text-sm mb-2">
              <div className="mb-1">
                <span className="font-semibold">Ngân hàng:</span>{" "}
                {showPayment && paymentMethod?.bankName ? (
                  paymentMethod.bankName
                ) : (
                  <Skeleton width={100} />
                )}
              </div>
              <div className="mb-1">
                <span className="font-semibold">Số tài khoản:</span>{" "}
                {showPayment && paymentMethod?.accountNumber ? (
                  paymentMethod.accountNumber
                ) : (
                  <Skeleton width={120} />
                )}
              </div>
              <div className="mb-1">
                <span className="font-semibold">Chủ tài khoản:</span>{" "}
                {showPayment && paymentMethod?.accountName ? (
                  paymentMethod.accountName
                ) : (
                  <Skeleton width={120} />
                )}
              </div>
              <div className="mb-1">
                <span className="font-semibold">Nội dung chuyển khoản:</span>{" "}
                {showPayment &&
                !checkingEmail &&
                !loading &&
                !errors.email &&
                !emailExists &&
                emailChecked ? (
                  content
                ) : (
                  <Skeleton width={180} />
                )}
              </div>
            </div>
            <div className="mb-3 text-base text-gray-500 italic">
              Vui lòng chuyển khoản đúng nội dung để hệ thống tự động xác nhận.
            </div>
            <div className="mb-3 text-base text-gray-700 font-medium">
              Quét mã QR để thanh toán:
            </div>
            <div className="flex justify-center">
              {qrImgUrl ? (
                <img
                  src={qrImgUrl}
                  alt="QR chuyển khoản VietQR"
                  className="mb-2 border rounded-xl w-[220px] h-[220px] object-contain shadow-lg"
                />
              ) : (
                <Skeleton
                  width={220}
                  height={220}
                  className="mb-2 rounded-xl"
                />
              )}
            </div>
            {/* Nút xác nhận đăng ký */}
            <div className="flex justify-end mt-4">
              <button
                className={
                  `min-w-[160px] px-7 py-3 rounded-2xl text-lg font-bold shadow-lg border transition-all duration-200 ` +
                  (!showPayment || !emailChecked || emailExists || submitting
                    ? "bg-white text-primary border-primary opacity-60 cursor-not-allowed hover:bg-white hover:text-primary hover:opacity-80"
                    : "bg-primary text-white border-primary hover:bg-primary/90 cursor-pointer")
                }
                onClick={handleSubmit}
                disabled={
                  !showPayment || !emailChecked || emailExists || submitting
                }
                style={{ userSelect: "none" }}
                tabIndex={
                  !showPayment || !emailChecked || emailExists || submitting
                    ? -1
                    : 0
                }
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-primary inline-block mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      ></path>
                    </svg>
                    Đang đăng ký...
                  </>
                ) : (
                  "Xác nhận thanh toán"
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Modal thành công */}
        {showSuccess && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
            <div className="p-6 w-full max-w-md flex flex-col items-center bg-white rounded-xl shadow-2xl">
              <div className="text-green-500 text-4xl mb-2">✔️</div>
              <h2 className="text-xl font-bold mb-2 text-center text-slate-800">
                Đặt hàng thành công!
              </h2>
              <div className="text-gray-700 text-center mb-4">
                Đơn hàng của bạn đã được ghi nhận và đang chờ duyệt.
                <br />
                Chúng tôi sẽ gửi thông tin tài khoản đến email của bạn trong
                thời gian sớm nhất.
                <br />
                Xin cảm ơn!
              </div>
              <button
                className="mt-2 px-4 py-2 rounded bg-primary text-white shadow hover:bg-primary/90 transition-all text-base font-medium"
                onClick={() => {
                  setShowSuccess(false);
                  if (onClose) onClose();
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
