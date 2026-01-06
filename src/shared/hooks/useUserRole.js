"use client";

import { useState, useEffect, useMemo } from "react";
import { decodeTokenGetUser } from "@/shared/lib/jwt";
import axiosClient from "@/shared/lib/axiosClient";
import { getUserRole, isLeader, isMember } from "@/shared/utils/userRole";

/**
 * Hook to get user role and related information
 * Automatically fetches user data if not provided
 * @param {Object} initialUser - Optional initial user object
 * @returns {Object} - { role, isLeader, isMember, user, isLoading }
 */
export function useUserRole(initialUser = null) {
  const [user, setUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);

  useEffect(() => {
    // If initial user is provided, use it
    if (initialUser) {
      setUser(initialUser);
      setIsLoading(false);
      return;
    }

    // Otherwise, fetch from API
    const fetchUser = async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Try to get user from token first (fast)
        const tokenUser = decodeTokenGetUser(token);
        if (tokenUser) {
          setUser(tokenUser);
        }

        // Then fetch full user data from API
        const res = await axiosClient.get("/api/user");
        if (res?.data) {
          setUser(res.data);
        }
      } catch (error) {
        // Only log non-404 errors (404 might be expected in some cases)
        if (error?.response?.status !== 404) {
          console.error("Failed to fetch user:", error);
        }
        // Keep token user if API fails
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [initialUser]);

  // Memoize role calculations
  const role = useMemo(() => getUserRole(user), [user]);
  const isLeaderUser = useMemo(() => isLeader(user), [user]);
  const isMemberUser = useMemo(() => isMember(user), [user]);

  return {
    role,
    isLeader: isLeaderUser,
    isMember: isMemberUser,
    user,
    isLoading,
  };
}

