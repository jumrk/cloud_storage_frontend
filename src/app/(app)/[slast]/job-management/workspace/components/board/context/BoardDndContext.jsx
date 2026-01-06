"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";

const BoardDndContext = createContext(null);

export function BoardDndProvider({ children }) {
  const listsApiRef = useRef(new Map());

  const registerList = useCallback((listId, api) => {
    const key = String(listId);
    listsApiRef.current.set(key, api);
    return () => {
      listsApiRef.current.delete(key);
    };
  }, []);

  const getListApi = useCallback((listId) => {
    const key = String(listId);
    return listsApiRef.current.get(key);
  }, []);

  const value = useMemo(
    () => ({
      registerList,
      getListApi,
    }),
    [registerList, getListApi]
  );

  return (
    <BoardDndContext.Provider value={value}>
      {children}
    </BoardDndContext.Provider>
  );
}

export function useBoardDnd() {
  const ctx = useContext(BoardDndContext);
  if (!ctx) {
    throw new Error("useBoardDnd must be used within a BoardDndProvider");
  }
  return ctx;
}


