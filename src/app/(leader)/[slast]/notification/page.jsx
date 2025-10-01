import Notification_Page from "@/components/client/Notification/NotificationPage";
import React from "react";

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

function Notification() {
  return (
    <div>
      <Notification_Page />
    </div>
  );
}

export default Notification;
