import AdminDashboard from "@/components/admin/dashboard/Dashboard_Page";
import React from "react";

export const metadata = {
  title: "Tổng quan",
};
function page() {
  return (
    <div>
      <AdminDashboard />
    </div>
  );
}

export default page;
