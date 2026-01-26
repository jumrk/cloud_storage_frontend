"use client";

import React from "react";
import FileManagement from "./components/FileManagemant";
import { useUserRole } from "@/shared/hooks/useUserRole";

function page() {
  const { role, isLeader, isMember, isLoading } = useUserRole();
  
  // Wait for user role to be determined before rendering FileManagement
  // This prevents race condition where fetchData runs before isMember is set
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }
  
  return (
    <FileManagement 
      userRole={role}
      isLeader={isLeader}
      isMember={isMember}
    />
  );
}

export default page;
