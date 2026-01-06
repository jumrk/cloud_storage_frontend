import React from "react";
import AssignedPage from "./components/AssignedPage";

export const metadata = {
  title: "Công việc của tôi - Job Management",
  description: "Danh sách các công việc được giao cho bạn trong Job Management",
};

export default function Page() {
  return <AssignedPage />;
}
