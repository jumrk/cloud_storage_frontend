import { useState } from "react";
import axiosClient from "@/shared/lib/axiosClient";

/**
 * Hook để xử lý submit order
 * @param {Function} buildPayload - Function để build payload
 * @returns {Object} { submitting, success, submitOrder }
 */
export function useCheckoutOrder(buildPayload) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const submitOrder = async () => {
    setSubmitting(true);
    try {
      const response = await axiosClient.post("/api/orders", buildPayload());
      setSuccess(true);
      // Return response data to handle redirect if needed
      return { success: true, data: response?.data };
    } catch (err) {
      setSuccess(false);
      return {
        success: false,
        error:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Tạo đơn hàng thất bại.",
      };
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    success,
    submitOrder,
    setSuccess,
  };
}

