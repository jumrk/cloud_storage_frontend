"use client";
import React, { useRef } from "react";
import { CiSearch } from "react-icons/ci";
import { IoClose } from "react-icons/io5";

export default function HeaderTask({ query = "", onQueryChange = () => {} }) {
  const inputRef = useRef(null);

  return (
    <div className="mb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[560px]">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            type="text"
            placeholder="Tìm kiếm board theo tiêu đề hoặc người tạo…"
            className="w-full h-11 rounded-xl border border-neutral-200 bg-white pl-10 pr-10 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
          />
          <CiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400"
            size={20}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                onQueryChange("");
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
              aria-label="Xoá tìm kiếm"
            >
              <IoClose size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
