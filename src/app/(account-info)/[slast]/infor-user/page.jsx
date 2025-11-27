import React from "react";
import InforComponent from "./components/InforComponent";

export async function generateMetadata({ params }) {
  return {
    title: "Thông tin người dùng - D2MBox",
    description:
      "Quản lý thông tin cá nhân và tài khoản trong khu vực leader D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function page() {
  return <InforComponent />;
}

export default page;

