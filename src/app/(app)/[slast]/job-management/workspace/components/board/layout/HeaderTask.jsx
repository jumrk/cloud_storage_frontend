"use client";
import React, { useRef } from "react";
import { CiSearch } from "react-icons/ci";
import { IoClose } from "react-icons/io5";
import { useWorkspaceContext } from "../../../context/WorkspaceContext";
import { useTranslations } from "next-intl";
export default function HeaderTask() {
  const { query, setQuery } = useWorkspaceContext();
  const inputRef = useRef(null);
  const t = useTranslations();
  return (
    <div className="mb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[560px]">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder={t("job_management.card.search_board")}
            className="w-full h-11 rounded-xl border border-neutral-200 bg-white pl-10 pr-10 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none shadow-sm focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition"
          />
          <CiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400"
            size={20}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
              aria-label={t("job_management.board.clear_search")}
            >
              <IoClose size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
