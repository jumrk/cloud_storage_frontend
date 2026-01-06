"use client";
import React, { useMemo, useState } from "react";
import { CiSearch } from "react-icons/ci";
import useAssignedTasks from "../hooks/useAssignedTasks";
import TaskCard from "./TaskCard";
import { useTranslations } from "next-intl";

export default function AssignedPage() {
  const { tasks, loading } = useAssignedTasks();
  const [search, setSearch] = useState("");
  const t = useTranslations();

  const normalizedQuery = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalizedQuery) return tasks;
    return tasks.filter((task) => {
      const title = (task.title || "").toLowerCase();
      const board = (task?.board?.title || "").toLowerCase();
      return title.includes(normalizedQuery) || board.includes(normalizedQuery);
    });
  }, [tasks, normalizedQuery]);

  return (
    <div className="w-full px-4 py-6 sm:px-8 bg-white h-full">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {t("job_management.pages.assigned_to_me")}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {t("job_management.pages.assigned_description")}
        </p>
      </div>
      <div className="mb-6">
        <div className="relative max-w-md">
          <CiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("job_management.card.search_by_title_or_board")}
            className="w-full h-11 rounded-xl border border-neutral-200 bg-white pl-10 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none shadow-sm focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition"
          />
        </div>
      </div>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 w-full rounded-2xl border border-gray-200 bg-white animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-600">
          {t("job_management.pages.no_assigned_tasks")}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
