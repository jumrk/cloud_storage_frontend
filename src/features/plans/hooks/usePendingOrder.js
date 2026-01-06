import { useState, useEffect } from "react";
import { decodeTokenGetUser } from "@/shared/lib/jwt";
import orderService from "@/shared/services/orderService";

/**
 * Hook để kiểm tra xem user có order pending không
 * @returns {Object} { hasPendingOrder, pendingOrder, loading, refresh }
 */
export function usePendingOrder() {
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkPendingOrder = async () => {
    try {
      setLoading(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setHasPendingOrder(false);
        setPendingOrder(null);
        return;
      }

      const user = decodeTokenGetUser(token);
      if (!user) {
        setHasPendingOrder(false);
        setPendingOrder(null);
        return;
      }

      // Lấy orders với status pending
      const res = await orderService.getOrders({ status: "pending" });
      const orders = res?.data || [];

      // Tìm order pending gần nhất
      const pending = orders.find((order) => order.status === "pending");

      setHasPendingOrder(!!pending);
      setPendingOrder(pending || null);
    } catch (error) {
      console.error("Error checking pending order:", error);
      setHasPendingOrder(false);
      setPendingOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPendingOrder();
  }, []);

  return {
    hasPendingOrder,
    pendingOrder,
    loading,
    refresh: checkPendingOrder,
  };
}
