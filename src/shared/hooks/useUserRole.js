import { useEffect, useState } from "react";
import axiosClient from "@/shared/lib/axiosClient";

/**
 * Hook để lấy thông tin role của user
 * @param {Object} userProp - User object được truyền vào (optional)
 * @returns {Object} { isLeader, isMember, user, isLoading }
 */
export function useUserRole(userProp = null) {
  const [user, setUser] = useState(userProp);
  const [isLeader, setIsLeader] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isLoading, setIsLoading] = useState(!userProp);

  useEffect(() => {
    // If user is already provided, use it
    if (userProp) {
      setUser(userProp);
      const role = userProp.role || null;
      const parent = userProp.parent?.email || userProp.leaderEmail || null;
      setIsLeader(role === "leader");
      setIsMember(role === "member" && !!parent);
      setIsLoading(false);
      return;
    }

    // Otherwise, fetch from API
    const fetchUser = async () => {
      try {
        // ✅ Fetch user from API (cookie sent automatically)
        const res = await axiosClient.get("/api/user");
        
        if (!res.data) {
          setIsLoading(false);
          return;
        }

        const role = res.data.role || null;
        const parent = res.data.parent?.email || res.data.leaderEmail || null;

        setUser(res.data);
        setIsLeader(role === "leader");
        setIsMember(role === "member" && !!parent);
        setIsLoading(false);
      } catch (error) {
        // Only log non-404 errors (404 might be expected in some cases)
        if (error?.response?.status !== 404) {
          console.error("Failed to fetch user:", error);
        }
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userProp]);

  return { isLeader, isMember, user, isLoading };
}
