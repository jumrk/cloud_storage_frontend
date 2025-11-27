"use client";

import React, { useEffect } from "react";
import CardBoard from "../../workspace/components/board/CardBoard";
import usePinnedBoards from "../hooks/usePinnedBoards";

export default function PinnedBoardsPage() {
  const {
    items,
    loading,
    t,
    fetchPinned,
    handleUnpin,
    navigateToBoard,
  } = usePinnedBoards();

  useEffect(() => {
    fetchPinned();
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text-strong">
          {t("job_management.pages.pinned_boards")}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {t("job_management.pages.pinned_description")}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="w-[220px] h-[96px] rounded-2xl border border-border bg-surface-50 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface-50 px-6 py-12 text-center text-text-muted">
          {t("job_management.pages.no_pinned_boards")}
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {items.map((item) => (
            <CardBoard
              key={item.board._id}
              title={item.board.title}
              createdBy={item.board?.createdBy?.fullName || t("job_management.pages.unknown")}
              createdByAvatar={item.board?.createdBy?.avatar || ""}
              onClick={() => navigateToBoard(item.board._id)}
              showDelete={false}
              showPin
              pinned
              onTogglePin={() => handleUnpin(item.board._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}


