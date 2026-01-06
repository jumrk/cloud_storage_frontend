"use client";
import React from "react";
import { useRouter, useParams } from "next/navigation";
import { FiChevronRight } from "react-icons/fi";
import { useTranslations } from "next-intl";

function formatDate(date, t) {
  if (!date) return t("job_management.pages.not_set");
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return t("job_management.pages.unknown");
  return d.toLocaleDateString("vi-VN");
}

export default function TaskCard({ task }) {
  const router = useRouter();
  const params = useParams();
  const slast = params?.slast;
  const t = useTranslations();
  const boardId = task?.board?._id || task?.boardId;
  const isOverdue =
    task?.dueAt &&
    new Date(task.dueAt).getTime() < Date.now() - 24 * 60 * 60 * 1000;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">
            {task?.board?.title ||
              t("job_management.board.workspace_fallback")}
          </p>
          <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
          <p className="text-xs text-gray-600 mt-1">
            {t("job_management.board.list")}:{" "}
            <strong>{task?.list?.title || "—"}</strong>
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1 rounded-full border border-brand-200 px-3 py-1 text-sm text-brand-600 hover:bg-brand-50 transition"
          onClick={() => {
            if (!boardId) return;
            const boardPath = slast 
              ? `/${slast}/job-management/workspace/board/${boardId}`
              : `/job-management/workspace/board/${boardId}`;
            router.push(boardPath);
          }}
        >
          {t("job_management.board.open_board")}
          <FiChevronRight />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <p className="text-gray-600">
            {t("job_management.board.due_date_label")}
          </p>
          <p
            className={`font-semibold ${
              isOverdue ? "text-danger-600" : "text-gray-900"
            }`}
          >
            {formatDate(task.dueAt, t)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-gray-600">
            {t("job_management.board.progress_label")}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-white overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${task.progress || 0}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-900 min-w-[36px] text-right">
              {Math.round(task.progress || 0)}%
            </span>
          </div>
        </div>
      </div>
      {task.descText && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
          {task.descText}
        </p>
      )}
    </div>
  );
}
