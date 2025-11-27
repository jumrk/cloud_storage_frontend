"use client";
import React, { useEffect, useState } from "react";
import PlanList from "./PlanList";
import { useCurrentPlanSlug } from "../hooks";
import { decodeTokenGetUser } from "@/shared/lib/jwt";

/**
 * Client component wrapper cho PlanList để lấy currentPlanSlug từ user data
 */
export default function PlanListWithUser(props) {
  const currentPlanSlug = useCurrentPlanSlug();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setUserRole(null);
      return;
    }
    const info = decodeTokenGetUser(token);
    setUserRole(info?.role || null);
  }, []);

  return (
    <PlanList
      {...props}
      currentPlanSlug={currentPlanSlug}
      userRole={userRole}
    />
  );
}

