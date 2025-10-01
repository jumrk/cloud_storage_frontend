import React from "react";
import HeaderDetailBoard from "@/components/jobManagement/Board/HeaderDetailBoard";
import ColumnBoard from "@/components/jobManagement/Board/ColumnBoard";

function DetailBoard({ boardId }) {
  return (
    <div className="p-3">
      <HeaderDetailBoard boardId={boardId} />
      <div className="mt-3">
        <ColumnBoard boardId={boardId} />
      </div>
    </div>
  );
}

export default DetailBoard;
