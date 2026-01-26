import { useEffect, useState } from "react";
import axiosClient from "@/shared/lib/axiosClient";

/**
 * Hook để lấy current plan slug từ user data
 * @returns {string} currentPlanSlug - Slug của plan hiện tại, empty string nếu không có
 */
export function useCurrentPlanSlug() {
  const [currentPlanSlug, setCurrentPlanSlug] = useState("");

  useEffect(() => {
    const fetchUserPlan = async () => {
      // ✅ Fetch user plan from API (cookie sent automatically)
      try {
        const res = await axiosClient.get("/api/user");
        if (!res.data) {
          setCurrentPlanSlug("");
          return;
        }
        setCurrentPlanSlug(res.data.plan?.slug || res.data.planSlug || "");
      } catch {
        setCurrentPlanSlug("");
      }
    };

    fetchUserPlan();
  }, []);

  return currentPlanSlug;
}
