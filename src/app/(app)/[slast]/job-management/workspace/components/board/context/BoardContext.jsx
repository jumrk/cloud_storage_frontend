"use client";

import { createContext, useContext, useMemo, useState } from "react";

const BoardContext = createContext(null);

export const FILTER_PERIOD_ALL = "all";
export const FILTER_PERIOD_DAY = "day";
export const FILTER_PERIOD_WEEK = "week";
export const FILTER_PERIOD_MONTH = "month";
export const FILTER_PERIOD_YEAR = "year";

export function BoardProvider({ boardId, children }) {
  const [filterPeriod, setFilterPeriod] = useState(FILTER_PERIOD_ALL);
  const [filterMemberId, setFilterMemberId] = useState(null);

  const value = useMemo(
    () => ({
      boardId,
      filterPeriod,
      filterMemberId,
      setFilterPeriod,
      setFilterMemberId,
    }),
    [boardId, filterPeriod, filterMemberId]
  );
  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoardContext() {
  const ctx = useContext(BoardContext);
  if (!ctx) {
    throw new Error("useBoardContext must be used within a BoardProvider");
  }
  return ctx;
}

/** Trả về { start, end } (Date) cho khoảng thời gian hiện tại theo period */
export function getBoardFilterDateRange(period) {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  switch (period) {
    case FILTER_PERIOD_DAY:
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 1);
      break;
    case FILTER_PERIOD_WEEK: {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.getFullYear(), now.getMonth(), diff);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
      break;
    }
    case FILTER_PERIOD_MONTH:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case FILTER_PERIOD_YEAR:
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      break;
    default:
      return null;
  }
  return { start, end };
}


