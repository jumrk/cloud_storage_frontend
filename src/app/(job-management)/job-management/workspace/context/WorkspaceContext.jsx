"use client";

import { createContext, useContext, useState } from "react";
import useBoard from "../hooks/useBoard";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const boardState = useBoard();
  const [query, setQuery] = useState("");

  const value = {
    query,
    setQuery,
    ...boardState,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error(
      "useWorkspaceContext must be used within a WorkspaceProvider"
    );
  }
  return ctx;
}


