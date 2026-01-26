import { useEffect, useState } from "react";
import axiosClient from "@/shared/lib/axiosClient";

/**
 * Hook để xử lý authentication và lấy thông tin user
 * @param {string} orderTypeParam - Order type từ URL params
 * @returns {Object} { isAuthenticated, currentUser, orderType, setOrderType }
 */
export function useCheckoutAuth(orderTypeParam) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [orderType, setOrderType] = useState(() => {
    if (orderTypeParam) return orderTypeParam;
    return "register"; // Default
  });

  useEffect(() => {
    // ✅ Fetch user from API (cookie sent automatically)
    axiosClient.get("/api/user")
      .then((res) => {
        if (res.data) {
          const user = res.data;
          setIsAuthenticated(true);
          setCurrentUser(user);
          if (!orderTypeParam) {
            setOrderType("upgrade");
          }
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setCurrentUser(null);
      });
  }, [orderTypeParam]);

  // Xác định orderType dựa trên user và plan hiện tại
  useEffect(() => {
    if (orderTypeParam) {
      setOrderType(orderTypeParam);
    } else if (isAuthenticated) {
      setOrderType("upgrade");
    } else {
      setOrderType("register");
    }
  }, [orderTypeParam, isAuthenticated]);

  return {
    isAuthenticated,
    currentUser,
    orderType,
    setOrderType,
  };
}
