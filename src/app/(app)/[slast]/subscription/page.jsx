import React from "react";
import SubscriptionManagement from "./components/SubscriptionManagement";

export async function generateMetadata({ params }) {
  return {
    title: "Quản lý gói dịch vụ - D2MBox",
    description: "Quản lý gói dịch vụ và nâng cấp tài khoản",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function SubscriptionPage() {
  return <SubscriptionManagement />;
}
