import React from "react";
import DashboardPage from "./components/DashboardPage";

export const metadata = {
  title: "Tổng quan Admin - D2MBox",
  description: "Bảng điều khiển quản trị hệ thống D2MBox",
  robots: {
    index: false,
    follow: false,
  },
};

function page() {
  return <DashboardPage />;
}

export default page;

