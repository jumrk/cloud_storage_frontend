import { useState, useEffect } from "react";
import axiosClient from "@/shared/lib/axiosClient";

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
      // ✅ Fetch pending orders from API (cookie sent automatically)
      const res = await axiosClient.get("/api/orders", {
        params: { status: "pending" }
      });
      
      if (!res.data || !res.data.data) {
        setHasPendingOrder(false);
        setPendingOrder(null);
        setLoading(false);
        return;
      }
      
      // Get first pending order
      const orders = res.data.data || [];
      const pendingOrder = orders.find(o => o.status === "pending") || orders[0];
      
      setHasPendingOrder(!!pendingOrder);
      setPendingOrder(pendingOrder || null);
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
