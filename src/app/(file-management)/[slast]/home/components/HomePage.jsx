"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-hot-toast";
import useSlastHomePage from "../hooks/useSlastHomePage";
import { FilterBar } from "./FilterBar";
import { BasicTable } from "./BasicTable";
import { RightSidebar } from "./RightSidebar";

export default function HomePage() {
  const searchParams = useSearchParams();
  const {
    loading,
    rows,
    sortColumn,
    sortOrder,
    overview,
    fileTypes,
    handleSort,
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

  return (
    <div className="w-full min-h-screen flex bg-surface-50">
      <div className="flex-1 flex-col pt-8 pb-8 hidden md:flex">
        <FilterBar
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
        <div className="mt-2">
          <BasicTable rows={rows} loading={loading} />
        </div>
      </div>
      <div className="w-full md:w-auto">
        <RightSidebar
          overview={overview}
          fileTypes={fileTypes}
          loading={loading}
        />
      </div>
    </div>
  );
}
