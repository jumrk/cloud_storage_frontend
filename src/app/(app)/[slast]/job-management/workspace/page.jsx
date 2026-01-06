import React from "react";
import JobManagementPage from "./components/JobManagement";

export const metadata = {
  title: "Quản lý công việc",
  description:
    "Tạo bảng, danh sách và thẻ để theo dõi tiến độ công việc của nhóm.",
  openGraph: {
    title: "Quản lý công việc",
    description:
      "Tạo bảng, danh sách và thẻ để theo dõi tiến độ công việc của nhóm.",
    type: "website",
    url: "/job-management",
  },
  twitter: {
    card: "summary",
    title: "Quản lý công việc",
    description:
      "Tạo bảng, danh sách và thẻ để theo dõi tiến độ công việc của nhóm.",
  },
};

export default function Page() {
  return <JobManagementPage />;
}
