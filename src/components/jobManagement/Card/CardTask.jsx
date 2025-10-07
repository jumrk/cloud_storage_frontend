"use client";
import { useCardTask } from "@/hooks/jobManagement/useCardTask";
import React from "react";
import { AiOutlineDelete } from "react-icons/ai";
import { FiEdit } from "react-icons/fi";

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
    dateStr,
    barColor,
    firstLetter,
    pickColor,
  } = useCardTask(title, desc, progress, dueDate, members, labels, showDetails);

  return (
    <div className="group relative w-full select-none rounded-xl border border-neutral-200 bg-white p-3 hover:bg-neutral-50">
      <div className="flex items-start">
        <div className="min-w-0 pr-8">
          <h3 className="text-[14px] font-medium leading-snug text-neutral-800 truncate">
            {title}
          </h3>
          {shouldShowDetails && hasDesc && (
            <p className="mt-0.5 text-[12px] leading-snug text-neutral-500 line-clamp-2">
              {desc}
            </p>
          )}
        </div>

        <div className="absolute right-2 top-2 inline-flex">
          <button
            type="button"
            onClick={() => onEdit?.(id)}
            className=" h-7 w-7 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200/50"
            aria-label="Sửa thẻ"
          >
            <FiEdit size={16} />
          </button>
          <button
            className="h-7 w-7 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200/50"
            aria-label="Xóa"
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
            ></span>
          ))}
          {labels.length > 6 && (
            <span className="inline-flex h-6 items-center rounded-md bg-neutral-100 px-2 text-[11px] font-medium text-neutral-700">
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
                <span className="text-[12px] text-neutral-600">Tiến độ</span>
                <span
                  className="text-[12px] font-medium"
                  style={{ color: barColor }}
                >
                  {hasProgress ? `${pct}%` : "--"}
                </span>
              </div>
              <div className="relative h-1 w-full rounded-full bg-neutral-200/70">
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
                    color: hasDue ? barColor : "#94A3B8",
                    backgroundColor: hasDue ? `${barColor}15` : "#F1F5F9",
                  }}
                >
                  {hasDue ? dateStr : "Chưa có hạn"}
                </span>
              )}

              {(hasMembers || showDetails) && (
                <div className="flex -space-x-1.5">
                  {hasMembers ? (
                    <>
                      {members.slice(0, 5).map((name, idx) => (
                        <span
                          key={idx}
                          title={name.fullName}
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-white text-[11px] font-semibold ring-2 ring-white ${pickColor(
                            name.fullName
                          )}`}
                        >
                          {firstLetter(name.fullName)}
                        </span>
                      ))}
                      {members.length > 5 && (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-neutral-700 text-[11px] font-semibold ring-2 ring-white">
                          +{members.length - 5}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="inline-flex h-6 px-2 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 text-[11px]">
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
