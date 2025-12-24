"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-hot-toast";
import useSlastHomePage from "../hooks/useSlastHomePage";
import { BasicTable } from "./BasicTable";
import { RightSidebar } from "./RightSidebar";
import { RecentActivities } from "./RecentActivities";
import { StorageTrendChart } from "./StorageTrendChart";
import { FileDistributionByMember } from "./FileDistributionByMember";
import { FileDistributionByType } from "./FileDistributionByType";

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
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    handlePageChange,
    selectedRows,
    handleSelectRow,
    handleSelectAll,
    isAllSelected,
    isIndeterminate,
    activities,
    loadingActivities,
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

  return (
    <div className="w-full min-h-screen flex bg-surface-50">
      <div className="flex-1 flex-col pt-8 pb-8 hidden md:flex">
        <div className="mt-2">
          <BasicTable
            rows={rows}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            selectedRows={selectedRows}
            onSelectRow={handleSelectRow}
            onSelectAll={handleSelectAll}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            onBulkAction={(action) => {
              // Handle bulk actions
              console.log("Bulk action:", action, selectedRows);
            }}
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        </div>

        {/* Charts Section */}
        <div className="mx-5 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StorageTrendChart
            data={storageTrend}
            loading={loadingCharts}
            period={storagePeriod}
            onPeriodChange={setStoragePeriod}
          />
          <FileDistributionByMember
            data={fileDistributionByMember}
            loading={loadingCharts}
          />
        </div>
        <div className="mx-5 mt-6">
          <FileDistributionByType data={fileTypes} loading={loading} />
        </div>
        <div className="mx-5 mt-6">
          <RecentActivities
            activities={activities}
            loading={loadingActivities}
          />
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
