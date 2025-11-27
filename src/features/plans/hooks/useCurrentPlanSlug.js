import { useEffect, useState } from "react";
import axiosClient from "@/shared/lib/axiosClient";
import { decodeTokenGetUser } from "@/shared/lib/jwt";

/**
 * Hook để lấy current plan slug từ user data
 * @returns {string} currentPlanSlug - Slug của plan hiện tại, empty string nếu không có
 */
export function useCurrentPlanSlug() {
  const [currentPlanSlug, setCurrentPlanSlug] = useState("");

  useEffect(() => {
    const fetchUserPlan = async () => {
      // Kiểm tra xem user đã đăng nhập chưa
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setCurrentPlanSlug("");
        return;
      }

      const user = decodeTokenGetUser(token);
      if (!user) {
        setCurrentPlanSlug("");
        return;
      }

      // Fetch user data từ API để lấy plan slug
      try {
        const res = await axiosClient.get("/api/user");
        const userData = res.data;
        setCurrentPlanSlug(userData?.plan?.slug || "");
      } catch (err) {
        // Nếu có lỗi (ví dụ: không có quyền), set về empty
        setCurrentPlanSlug("");
      }
    };

    fetchUserPlan();
  }, []);

  return currentPlanSlug;
}

