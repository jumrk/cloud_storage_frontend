import User_Management_Page from "@/components/client/user_management/page";
import React from "react";

export async function generateMetadata({ params }) {
  return {
    title: "Quản lý tài khoản - D2MBox",
    description: "Quản lý tài khoản thành viên trong khu vực leader D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function User_Management() {
  return <User_Management_Page />;
}

export default User_Management;
