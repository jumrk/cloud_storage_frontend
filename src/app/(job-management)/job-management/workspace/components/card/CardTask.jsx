"use client";
import useCardTask from "../../hooks/useCardTask";
import React from "react";
import { AiOutlineDelete } from "react-icons/ai";
import { FiEdit } from "react-icons/fi";
import { useTranslations } from "next-intl";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";

function hexToRgb(hex) {
  let h = (hex || "").trim();
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  if (h.length !== 6) return { r: 0, g: 0, b: 0 };
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function contrastText(hex) {
  const { r, g, b } = hexToRgb(hex);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#111827" : "#ffffff";
}

export default function CardTask({
  id,
  title,
  desc,
  progress,
  dueDate,
  startDate,
  members = [],
  labels = [],
  showDetails = false,
  onEdit,
  onDelete,
}) {
  const {
    shouldShowDetails,
    hasDesc,
    hasProgress,
    hasDue,
    hasMembers,
    hasLabels,
    pct,
    dueStr,
    barColor,
    firstLetter,
    pickColor,
  } = useCardTask(
    title,
    desc,
    progress,
    dueDate,
    startDate,
    members,
    labels,
    showDetails
  );
  const t = useTranslations();

  return (
    <div className="group relative w-full select-none rounded-xl border border-border bg-white p-3 hover:bg-surface-50">
      <div className="flex items-start">
        <div className="min-w-0 pr-8">
          <h3 className="text-[14px] font-medium leading-snug text-text-strong truncate">
            {title}
          </h3>
          {shouldShowDetails && hasDesc && (
            <p className="mt-0.5 text-[12px] leading-snug text-text-muted line-clamp-2">
              {desc}
            </p>
          )}
        </div>

        <div className="absolute right-2 top-2 inline-flex">
          <button
            type="button"
            onClick={() => onEdit?.(id)}
            className="h-7 w-7 flex items-center justify-center rounded-full text-text-muted hover:bg-surface-50"
            aria-label={t("job_management.board.edit_card")}
          >
            <FiEdit size={16} />
          </button>
          <button
            className="h-7 w-7 flex items-center justify-center rounded-full text-text-muted hover:bg-surface-50"
            aria-label={t("job_management.card.delete")}
            onClick={() => onDelete?.(id)}
          >
            <AiOutlineDelete size={16} />
          </button>
        </div>
      </div>

      {shouldShowDetails && hasLabels && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {labels.slice(0, 6).map((c) => (
            <span
              key={c}
              className="inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium ring-1 ring-black/5"
              style={{ backgroundColor: c, color: contrastText(c) }}
              title={c}
            />
          ))}
          {labels.length > 6 && (
            <span className="inline-flex h-6 items-center rounded-md bg-surface-50 px-2 text-[11px] font-medium text-text-strong">
              +{labels.length - 6}
            </span>
          )}
        </div>
      )}

      {shouldShowDetails && (
        <>
          {(hasProgress || showDetails) && (
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[12px] text-text-muted">{t("job_management.board.progress_label")}</span>
                <span
                  className="text-[12px] font-medium"
                  style={{ color: barColor }}
                >
                  {hasProgress ? `${pct}%` : "--"}
                </span>
              </div>
              <div className="relative h-1 w-full rounded-full bg-surface-50">
                <div
                  className="absolute left-0 top-0 h-1 rounded-full transition-[width]"
                  style={{
                    width: hasProgress ? `${pct}%` : "0%",
                    backgroundColor: barColor,
                  }}
                />
              </div>
            </div>
          )}

          {(hasDue || hasMembers || showDetails) && (
            <div className="mt-3 flex items-center justify-between">
              {(hasDue || showDetails) && (
                <span
                  className="text-[11px] px-2 py-0.5 rounded-lg font-medium"
                  style={{
                    color: hasDue ? barColor : "var(--color-text-muted)",
                    backgroundColor: hasDue
                      ? `${barColor}15`
                      : "var(--color-surface-50)",
                  }}
                >
                  {hasDue ? dueStr : t("job_management.board.no_due_date")}
                </span>
              )}

              {(hasMembers || showDetails) && (
                <div className="flex -space-x-1.5">
                  {hasMembers ? (
                    <>
                      {members.slice(0, 5).map((member, idx) => {
                        const displayName =
                          member.fullName ||
                          member.name ||
                          member.email ||
                          "";
                        const avatarSrc = member.avatar
                          ? getAvatarUrl(member.avatar)
                          : "";
                        return (
                          <span
                            key={idx}
                            title={displayName}
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ring-2 ring-white overflow-hidden ${
                              avatarSrc ? "bg-white" : pickColor(displayName)
                            }`}
                          >
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={displayName || "avatar"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              firstLetter(displayName)
                            )}
                          </span>
                        );
                      })}
                      {members.length > 5 && (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-50 text-text-strong text-[11px] font-semibold ring-2 ring-white">
                          +{members.length - 5}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="inline-flex h-6 px-2 items-center justify-center rounded-full bg-surface-50 text-text-muted text-[11px]">
                      Chưa gán
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
