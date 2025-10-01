"use client";
import React, { useState } from "react";
import WorkingSpace from "@/components/jobManagement/WorkingSpace";
import HeaderTask from "@/components/jobManagement/HeaderTask";

function JobManagementPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="w-full mx-auto bg-white p-6 sm:p-8">
      <HeaderTask query={query} onQueryChange={setQuery} />
      <WorkingSpace query={query} />
    </div>
  );
}

export default JobManagementPage;
