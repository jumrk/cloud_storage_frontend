import Home from "@/components/client/home/Home_component";
import React from "react";

export const metadata = {
  title: "Trang chủ - D2MBox",
  description: "Quản lý tài khoản và dữ liệu trong khu vực leader của D2MBox",
  robots: {
    index: false,
    follow: false,
  },
};

function page() {
  return <Home />;
}

export default page;
