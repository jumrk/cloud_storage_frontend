import React from "react";
import User_Management_Page from "./components/MemberManagement";
export async function generateMetadata({ params }) {
  return {
    title: "Quản lý thành viên - D2MBox",
    description: "Quản lý tài khoản thành viên trong khu vực leader D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}
function page() {
  return <User_Management_Page />;
}

export default page;

