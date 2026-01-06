"use client";

import React from "react";
import FileManagement from "./components/FileManagemant";
import { useUserRole } from "@/shared/hooks/useUserRole";

function page() {
  const { role, isLeader, isMember } = useUserRole();
  
  return (
    <FileManagement 
      userRole={role}
      isLeader={isLeader}
      isMember={isMember}
    />
  );
}

export default page;
