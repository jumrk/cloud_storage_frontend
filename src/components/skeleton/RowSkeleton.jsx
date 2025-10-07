"use client";
import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

function RowSkeleton() {
  return (
    <div className="py-1">
      <div className="flex items-start gap-2">
        <Skeleton width={18} height={18} borderRadius={4} />
        <div className="flex-1">
          <Skeleton height={14} />
          <div className="mt-1 pl-6 flex gap-4">
            <Skeleton width={120} height={10} />
            <Skeleton width={100} height={10} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChecklistBlockSkeleton() {
  return (
    <div className="p-3 border border-black/30 border-dashed rounded-2xl w-full bg-white">
      <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton circle width={20} height={20} />
            <Skeleton width={200} height={18} />
          </div>
          <Skeleton width={60} height={32} />
        </div>

        <div className="mt-2 space-y-2">
          {/* Progress */}
          <div className="flex items-center gap-2 text-sm">
            <Skeleton width={28} height={14} />
            <div className="flex-1">
              <Skeleton height={10} borderRadius={999} />
            </div>
          </div>

          {/* Items */}
          <div className="mt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>

          {/* Add button */}
          <div className="pt-1">
            <Skeleton width={92} height={32} />
          </div>
        </div>
      </SkeletonTheme>
    </div>
  );
}
