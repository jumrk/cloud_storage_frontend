import React from "react";
import AccountSettings from "./components/AccountSettings";

export async function generateMetadata({ params }) {
  return {
    title: "Thông tin tài khoản - D2MBox",
    description: "Quản lý thông tin cá nhân và cài đặt tài khoản",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function AccountPage() {
  return <AccountSettings />;
}
