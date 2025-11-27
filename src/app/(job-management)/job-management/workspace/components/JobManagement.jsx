"use client";
import React from "react";
import WorkingSpace from "./board/layout/WorkingSpace";
import HeaderTask from "./board/layout/HeaderTask";
import { WorkspaceProvider } from "../context/WorkspaceContext";

function JobManagementPage() {
  return (
    <WorkspaceProvider>
      <div className="w-full mx-auto bg-white p-6 sm:p-8">
        <HeaderTask />
        <WorkingSpace />
      </div>
    </WorkspaceProvider>
  );
}

export default JobManagementPage;
