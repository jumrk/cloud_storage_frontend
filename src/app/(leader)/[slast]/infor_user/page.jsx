import Infor_component from "@/components/client/infor_user/InforComponent";
import React from "react";

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

function InforUser() {
  return <Infor_component />;
}

export default InforUser;
