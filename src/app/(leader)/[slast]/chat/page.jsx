import ChatLayout from "@/components/client/chat/ChatLayout";
import React from "react";

export async function generateMetadata({ params }) {
  return {
    title: "Trò chuyện - D2MBox",
    description: "Trò chuyện và hỗ trợ khách hàng trong khu vực leader D2MBox",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function page() {
  return <ChatLayout isAdmin={false} />;
}
