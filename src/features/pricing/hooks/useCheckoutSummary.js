import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import pricingService from "@/shared/services/pricingService";

/**
 * Hook để xử lý preview checkout và summary
 * @param {Object} options - Options
 * @param {Object} options.plan - Plan object
 * @param {boolean} options.isAuthenticated - User đã đăng nhập chưa
 * @param {string} options.orderType - Loại order
 * @param {string} options.cycle - Cycle (month/year)
 * @param {string} options.planSlug - Slug của plan
 * @param {Function} options.buildPayload - Function để build payload
 * @param {string} options.formEmail - Email từ form
 * @returns {Object} { summary, loading, generateSummary, generateSummaryAuto }
 */
export function useCheckoutSummary({
  plan,
  isAuthenticated,
  orderType,
  cycle,
  planSlug,
  buildPayload,
  formEmail,
  onError, // Callback khi có lỗi
}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reset summary khi thay đổi cycle, planSlug, hoặc orderType
  useEffect(() => {
    setSummary(null);
  }, [cycle, planSlug, orderType]);

  // Tự động tính toán summary khi user đã đăng nhập và có plan
  useEffect(() => {
    if (
      isAuthenticated &&
      plan &&
      orderType !== "register" &&
      !loading &&
      formEmail
    ) {
      generateSummaryAuto().catch((err) => {
        const message =
          err?.message ||
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Không thể tính toán giá. Vui lòng thử lại.";
        toast.error(message);
        if (onError) {
          onError(message);
        }
        console.error("Auto load summary error:", err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, plan?.slug, cycle, orderType, formEmail]);

  const generateSummaryAuto = async () => {
    if (!plan || !isAuthenticated) return;
    setLoading(true);
    try {
      // Thêm delay 2.5s để tránh bị giật khi chuyển đổi nhanh và tạo hiệu ứng mượt mà
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const payload = buildPayload();
      const result = await pricingService.previewCheckout(payload);
      setSummary(result?.data);
    } catch (err) {
      // Lấy error message từ response
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Không thể tính toán giá. Vui lòng thử lại.";
      // Trả về error để component có thể xử lý (hiển thị toast và quay về)
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    setLoading(true);
    setSummary(null);
    try {
      // Thêm delay 2.5s để tạo hiệu ứng loading mượt mà
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const payload = buildPayload();
      const result = await pricingService.previewCheckout(payload);
      setSummary(result?.data);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Không tạo được hướng dẫn thanh toán.",
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    summary,
    loading,
    generateSummary,
    generateSummaryAuto,
    setSummary,
  };
}

