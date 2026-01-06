import React from "react";
import BoardReportPage from "./components/BoardReportPage";

export const metadata = {
  title: "Báo cáo tổng kết - Job Management",
  description: "Báo cáo tổng kết tiến độ làm việc",
};

export default async function Page({ params }) {
  const { id } = await params;
  return <BoardReportPage boardId={id} />;
}
