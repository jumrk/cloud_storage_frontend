"use client";

import { createContext, useContext, useMemo } from "react";

const BoardContext = createContext(null);

export function BoardProvider({ boardId, children }) {
  const value = useMemo(() => ({ boardId }), [boardId]);
  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoardContext() {
  const ctx = useContext(BoardContext);
  if (!ctx) {
    throw new Error("useBoardContext must be used within a BoardProvider");
  }
  return ctx;
}


