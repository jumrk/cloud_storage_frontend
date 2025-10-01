import AdminDashboard from "@/components/admin/dashboard/DashboardPage";
import React from "react";

export const metadata = {
  title: "Tổng quan Admin - D2MBox",
  description: "Bảng điều khiển quản trị hệ thống D2MBox",
  robots: {
    index: false,
    follow: false,
  },
};
function page() {
  return (
    <div>
      <AdminDashboard />
    </div>
  );
}

export default page;
