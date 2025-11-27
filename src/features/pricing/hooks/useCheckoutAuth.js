import { useEffect, useState } from "react";
import { decodeTokenGetUser } from "@/shared/lib/jwt";

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
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && decodeTokenGetUser(token)) {
        return "upgrade";
      }
    }
    return "register";
  });

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      const user = decodeTokenGetUser(token);
      if (user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
        if (!orderTypeParam) {
          setOrderType("upgrade");
        }
      }
    }
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

