import React from "react";
import HomePage from "./components/HomePage";
import HomeRouteGuard from "./RouteGuard";

export const metadata = {
  title: "Trang chủ - D2MBox",
  description: "Quản lý tài khoản và dữ liệu trong khu vực leader của D2MBox",
  robots: {
    index: false,
    follow: false,
  },
};

function page() {
  return (
    <HomeRouteGuard>
      <HomePage />
    </HomeRouteGuard>
  );
}

export default page;
