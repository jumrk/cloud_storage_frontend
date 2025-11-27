import ChatLayout from "@/features/chat/components/ChatLayout";
import React from "react";

export async function generateMetadata({ params }) {
  return {
    title: "Trò chuyện Admin - D2MBox",
    description: "Trò chuyện và hỗ trợ khách hàng trong khu vực admin D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function page() {
  return <ChatLayout isAdmin={true} />;
}

