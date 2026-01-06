"use client";
import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <Skeleton circle width={32} height={32} />
        <div className="min-w-0 flex-1">
          <Skeleton height={14} />
          <Skeleton height={10} className="mt-2 w-2/3" />
          <div className="mt-3 flex gap-2">
            <Skeleton width={56} height={18} />
            <Skeleton width={56} height={18} />
            <Skeleton width={56} height={18} />
          </div>
        </div>
      </div>
    </div>
  );
}
export default function ListBoardSkeleton() {
  return (
    <div className="w-[352px] min-w-[352px] min-h-[560px] rounded-2xl border border-dashed border-neutral-300 bg-white shadow-sm">
      <SkeletonTheme
        baseColor="#e5e7eb"
        highlightColor="#f3f4f6"
        baseColorDark="#334155"
        highlightColorDark="#475569"
      >
        {/* Header */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <Skeleton width={120} height={16} />
              <Skeleton width={40} height={12} className="mt-1" />
            </div>
            <div className="shrink-0 flex items-center gap-1">
              <Skeleton circle width={36} height={36} />
              <Skeleton circle width={36} height={36} />
            </div>
          </div>
        </div>
        {/* Add area */}
        <div className="px-3">
          <div className="rounded-2xl border border-neutral-200 p-2">
            <Skeleton height={36} />
            <div className="mt-2 flex items-center gap-3">
              <Skeleton width={96} height={36} />
              <Skeleton circle width={28} height={28} />
            </div>
          </div>
        </div>
        {/* Cards */}
        <div className="px-3 pb-3">
          <div className="mt-2 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </SkeletonTheme>
    </div>
  );
}
