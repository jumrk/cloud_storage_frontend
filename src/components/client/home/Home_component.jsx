"use client";

import React from "react";
import "react-loading-skeleton/dist/skeleton.css";
import useSlastHomePage from "@/hooks/leader/home/useSlastHomePage";
import { FilterBar } from "@/components/client/home/FilterBar";
import { BasicTable } from "@/components/client/home/BasicTable";
import { RightSidebar } from "@/components/client/home/RightSidebar";
// ===== Page =====
export default function Page() {
  const {
    loading,
    rows,
    sortColumn,
    sortOrder,
    handleSort,
    overview,
    fileTypes,
  } = useSlastHomePage();

  return (
    <div className="w-full min-h-screen flex bg-white">
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
