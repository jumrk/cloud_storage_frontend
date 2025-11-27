"use client";
import React, { useEffect, useMemo } from "react";
import { LuUserRound } from "react-icons/lu";
import { FiUsers } from "react-icons/fi";
import CardBoard from "../CardBoard";
import CardBoardAdd from "../CardBoardAdd";
import CreateBoardModal from "../modals/CreateBoardModal";
import { useWorkspaceContext } from "../../../context/WorkspaceContext";
import { useTranslations } from "next-intl";

function normalize(str = "") {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function WorkingSpace() {
  const t = useTranslations();
  const {
    query,
    loading,
    err,
    boards,
    open,
    router,
    title,
    inputRef,
    guestBoard,
    fetchGuestBoads,
    fetchPinnedBoards,
    setOpen,
    fetchBoards,
    createdByName,
    createdByAvatar,
    setTitle,
    handleSubmit,
    setErr,
    handleDelete,
    isBoardPinned,
    togglePinBoard,
  } = useWorkspaceContext();

  useEffect(() => {
    fetchBoards();
    fetchGuestBoads();
    fetchPinnedBoards();
  }, []);

  const normalizedQuery = normalize(query);

  const filteredBoards = useMemo(() => {
    if (!normalizedQuery) return boards;
    return boards.filter((b) => {
      const name = normalize(b?.title || "");
      const owner = normalize(createdByName(b) || "");
      return name.includes(normalizedQuery) || owner.includes(normalizedQuery);
    });
  }, [boards, normalizedQuery, createdByName]);

  return (
    <div className="w-full mt-3">
      <div className="flex items-center mt-3 gap-2">
        <LuUserRound size={20} className="text-brand-500" />
        <h1 className="text-xl font-medium text-text-strong">
          {t("job_management.board.your_workspace")}
        </h1>
      </div>

      <div className="mt-3 flex justify-center sm:justify-start flex-wrap gap-3">
        {loading && (
          <>
            <div className="w-[220px] h-[96px] rounded-2xl border border-border bg-surface-50 shadow-sm animate-pulse" />
            <div className="w-[220px] h-[96px] rounded-2xl border border-border bg-surface-50 shadow-sm animate-pulse" />
          </>
        )}

        {!loading &&
          !err &&
          filteredBoards.length > 0 &&
          filteredBoards.map((b) => (
              <CardBoard
              key={b._id}
              title={b.title}
              createdBy={createdByName(b)}
                createdByAvatar={createdByAvatar(b)}
              onClick={() =>
                router.push(`/job-management/workspace/board/${b._id}`)
              }
              onDelete={() => handleDelete(b._id)}
              showPin
              pinned={isBoardPinned(b._id)}
              onTogglePin={() => togglePinBoard(b._id)}
            />
          ))}

        {!loading && !err && filteredBoards.length === 0 && (
          <div className="w-[220px] h-[96px] rounded-xl border border-border bg-surface-50 px-4 py-6 text-sm text-text-muted">
            {t("job_management.board.empty")}
          </div>
        )}

        <CardBoardAdd onClick={() => setOpen(true)} />
      </div>

      <div className="flex items-center mt-6 gap-2">
        <FiUsers size={20} className="text-brand-500" />
        <h1 className="text-xl font-medium text-text-strong">
          {t("job_management.board.guest_workspace")}
        </h1>
      </div>

      <div className="mt-3 flex justify-center sm:justify-start flex-wrap gap-3">
        {!loading &&
          guestBoard.map((b) => (
            <CardBoard
              key={b._id}
              title={b.title}
              createdBy={createdByName(b)}
              createdByAvatar={createdByAvatar(b)}
              onClick={() =>
                router.push(`/job-management/workspace/board/${b._id}`)
              }
              showDelete={false}
              showPin
              pinned={isBoardPinned(b._id)}
              onTogglePin={() => togglePinBoard(b._id)}
            />
          ))}
      </div>

      <CreateBoardModal
        open={open}
        onClose={() => {
          setOpen(false);
          setErr("");
        }}
        title={title}
        setTitle={setTitle}
        loading={loading}
        err={err}
        inputRef={inputRef}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
