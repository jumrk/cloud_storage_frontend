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

  useEffect(() => {
    // ✅ Fetch user role from API (cookie sent automatically)
    axiosClient.get("/api/user")
      .then((res) => {
        if (!res.data) {
          setUserRole(null);
          return;
        }
        setUserRole(res.data.role || null);
      })
      .catch(() => {
        setUserRole(null);
      });
  }, []);

  return (
    <PlanList
      {...props}
      currentPlanSlug={currentPlanSlug}
      userRole={userRole}
    />
  );
}

