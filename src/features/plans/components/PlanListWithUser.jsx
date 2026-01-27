"use client";
import React, { useEffect, useState } from "react";
import PlanList from "./PlanList";
import { useCurrentPlanSlug } from "../hooks";
import axiosClient from "@/shared/lib/axiosClient";

/**
 * Client component wrapper cho PlanList để lấy currentPlanSlug từ user data
 */
export default function PlanListWithUser(props) {
  const currentPlanSlug = useCurrentPlanSlug();
  const [userRole, setUserRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ✅ Fetch user role from API (cookie sent automatically)
    axiosClient.get("/api/user")
      .then((res) => {
        if (!res.data) {
          setUserRole(null);
          setIsLoggedIn(false);
          return;
        }
        setUserRole(res.data.role || null);
        setIsLoggedIn(true);
      })
      .catch(() => {
        setUserRole(null);
        setIsLoggedIn(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <PlanList
      {...props}
      currentPlanSlug={isLoggedIn ? currentPlanSlug : null}
      userRole={userRole}
      isLoggedIn={isLoggedIn}
      isAuthLoading={isLoading}
    />
  );
}

