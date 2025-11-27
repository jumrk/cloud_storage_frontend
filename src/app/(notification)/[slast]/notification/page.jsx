import React from "react";
import NotificationPage from "./components/NotificationPage";

export async function generateMetadata({ params }) {
  return {
    title: "Thông báo - D2MBox",
    description: "Xem và quản lý thông báo trong khu vực leader D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function page() {
  return <NotificationPage />;
}

export default page;

