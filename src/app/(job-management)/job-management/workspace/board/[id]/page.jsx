import React from "react";
import DetailBoard from "../../components/board/DetailBoard";

export const metadata = {
  title: "Chi tiết bảng công việc",
  description: "Quản lý công việc theo bảng, danh sách và thẻ.",
};

async function page({ params }) {
  const { id } = await params;
  return <DetailBoard boardId={id} />;
}

export default page;
