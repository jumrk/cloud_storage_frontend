"use client";
import React from "react";
import { useParams } from "next/navigation";
import DetailBoard from "../../components/board/DetailBoard";

export default function BoardDetailPage() {
  const params = useParams();
  const boardId = params?.id;

  if (!boardId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Không tìm thấy board</p>
      </div>
    );
  }

  return <DetailBoard boardId={boardId} />;
}
