import React from "react";
import RecentBoardsPage from "./components/RecentBoardsPage";

export const metadata = {
  title: "Board gần đây - Job Management",
  description: "Danh sách các bảng bạn vừa truy cập trong Job Management",
};

export default function Page() {
  return <RecentBoardsPage />;
}
