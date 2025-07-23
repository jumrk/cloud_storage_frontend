import ChatLayout from "@/components/client/chat/ChatLayout";
import React from "react";
export const metadata = {
  title: "Trò chuyện",
};
export default function page() {
  return <ChatLayout isAdmin={false} />;
}
