import React from "react";
import UserManagerPage from "./components/UserManagerPage";

export async function generateMetadata({ params }) {
  return {
    title: "Quản lý người dùng - D2MBox",
    description:
      "Quản lý tài khoản người dùng và phân quyền trong khu vực admin D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function page() {
  return <UserManagerPage />;
}

export default page;

