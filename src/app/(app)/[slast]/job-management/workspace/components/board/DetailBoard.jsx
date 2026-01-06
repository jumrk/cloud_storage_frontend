"use client";
import React, { useEffect } from "react";
import HeaderDetailBoard from "./HeaderDetailBoard";
import ColumnBoard from "./ColumnBoard";
import { BoardProvider } from "./context/BoardContext";
import boardService from "../../services/boardService";

function DetailBoard({ boardId }) {
  useEffect(() => {
    if (!boardId) return;
    boardService()
      .recordVisit(boardId)
      .catch(() => {});
  }, [boardId]);

  return (
    <BoardProvider boardId={boardId}>
      <div className="p-3">
        <HeaderDetailBoard />
        <div className="mt-3">
          <ColumnBoard />
        </div>
      </div>
    </BoardProvider>
  );
}

export default DetailBoard;
