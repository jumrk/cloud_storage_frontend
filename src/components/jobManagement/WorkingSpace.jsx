"use client";
import React, { useEffect, useMemo } from "react";
import { LuUserRound } from "react-icons/lu";
import { FiUsers } from "react-icons/fi";
import CardBoard from "@/components/jobManagement/Board/CardBoard";
import CardBoardAdd from "@/components/jobManagement/Board/CardBoardAdd";
import CreateBoardModal from "./Board/CreateBoardModal";
import useBoard from "@/hooks/jobManagement/useBoard";

function normalize(str = "") {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function WorkingSpace({ query = "" }) {
  const {
    loading,
    err,
    boards,
    open,
    router,
    title,
    inputRef,
    guestBoard,
    fetchGuestBoads,
    setOpen,
    fetchBoards,
    createdByName,
    setTitle,
    handleSubmit,
    setErr,
    handleDelete,
  } = useBoard();

  useEffect(() => {
    fetchBoards();
    fetchGuestBoads();
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
        <LuUserRound size={20} />
        <h1 className="text-xl">Không gian làm việc của bạn</h1>
      </div>

      <div className="mt-3 flex justify-center sm:justify-start flex-wrap gap-3">
        {loading && (
          <>
            <div className="w-[220px] h-[96px] rounded-2xl border-2 border-neutral-200 animate-pulse bg-neutral-50" />
            <div className="w-[220px] h-[96px] rounded-2xl border-2 border-neutral-200 animate-pulse bg-neutral-50" />
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
              onClick={() => router.push(`./job_management/board/${b._id}`)}
              onDelete={() => handleDelete(b._id)}
            />
          ))}

        {!loading && !err && filteredBoards.length === 0 && (
          <div className="w-full max-w-[560px] rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
            Trống
          </div>
        )}

        <CardBoardAdd onClick={() => setOpen(true)} />
      </div>

      <div className="flex items-center mt-6 gap-2">
        <FiUsers size={20} />
        <h1 className="text-xl">Không gian làm việc với khách</h1>
      </div>
      <div className="flex gap-2 mt-3">
        {!loading &&
          guestBoard.map((b) => (
            <CardBoard
              key={b._id}
              title={b.title}
              createdBy={createdByName(b)}
              onClick={() => router.push(`./job_management/board/${b._id}`)}
              onDelete={() => handleDelete(b._id)}
            />
          ))}
      </div>

      {err && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

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
