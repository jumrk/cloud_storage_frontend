"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-hot-toast";
import useSlastHomePage from "../hooks/useSlastHomePage";
import Dashboard from "./Dashboard";

export default function HomePage() {
  const searchParams = useSearchParams();
  const {
    loading,
    overview,
    activities,
    loadingActivities,
    dashboardStats,
    loadingStats,
    fileTypes,
    storageTrend,
    fileDistributionByMember,
    loadingCharts,
    storagePeriod,
    setStoragePeriod,
  } = useSlastHomePage();

  // Show toast if redirected from mobile blocked page
  useEffect(() => {
    const mobileBlocked = searchParams.get("mobile_blocked");
    if (mobileBlocked === "video") {
      toast.error(
        "Trình xử lý video chỉ hỗ trợ trên máy tính. Vui lòng sử dụng thiết bị có màn hình lớn hơn.",
        { duration: 5000 }
      );
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // Use real stats from API or fallback to defaults
  const stats = dashboardStats || {
    filesChange: 0,
    storageChange: 0,
    membersChange: 0,
  };

  return (
    <div className="w-full h-full bg-gray-50">
      <Dashboard
        overview={overview}
        stats={stats}
        loading={loading}
        activities={activities}
        loadingActivities={loadingActivities}
        fileTypes={fileTypes}
        storageTrend={storageTrend}
        fileDistributionByMember={fileDistributionByMember}
        loadingCharts={loadingCharts}
        storagePeriod={storagePeriod}
        setStoragePeriod={setStoragePeriod}
      />
    </div>
  );
}
