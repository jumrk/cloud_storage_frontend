"use client";
import React, { useEffect } from "react";
import CardBoard from "../../workspace/components/board/CardBoard";
import useRecentBoards from "../hooks/useRecentBoards";
export default function RecentBoardsPage() {
  const { items, loading, t, fetchRecent, formatDate, navigateToBoard } =
    useRecentBoards();
  useEffect(() => {
    fetchRecent();
  }, []);
  return (
    <div className="w-full px-4 py-6 sm:px-8 bg-white h-full">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {t("job_management.pages.recent_boards")}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {t("job_management.pages.recent_description")}
        </p>
      </div>
      {loading ? (
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="w-[220px] h-[96px] rounded-2xl border border-gray-200 bg-white animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-600">
          {t("job_management.pages.no_recent_boards")}
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {items.map((item) => (
            <div key={item.board._id} className="flex flex-col gap-2">
              <CardBoard
                title={item.board.title}
                createdBy={
                  item.board?.createdBy?.fullName ||
                  t("job_management.pages.unknown")
                }
                createdByAvatar={item.board?.createdBy?.avatar || ""}
                onClick={() => navigateToBoard(item.board._id)}
                showDelete={false}
              />
              <p className="text-xs text-gray-600">
                {t("job_management.pages.accessed_at")}
                {formatDate(item.lastVisitedAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
