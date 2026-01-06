"use client";
import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
function MemberRowSkeleton() {
  return (
    <li className="flex items-center justify-between p-3">
      <div className="flex items-center gap-3">
        <Skeleton circle width={32} height={32} />
        <div className="w-48">
          <Skeleton height={14} />
          <Skeleton height={10} className="mt-1 w-36" />
        </div>
      </div>
      <Skeleton width={40} height={24} />
    </li>
  );
}
export default function ModalShareBoardSkeleton() {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 grid place-items-center px-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
          <SkeletonTheme
            baseColor="#e5e7eb"
            highlightColor="#f3f4f6"
            baseColorDark="#334155"
            highlightColorDark="#475569"
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <Skeleton width={120} height={20} />
                <Skeleton circle width={32} height={32} />
              </div>
              <div className="mt-4">
                <Skeleton width={220} height={16} />
                <div className="mt-2 flex gap-2">
                  <Skeleton height={40} className="flex-1" />
                  <Skeleton width={84} height={40} />
                </div>
                <Skeleton width={260} height={12} className="mt-2" />
              </div>
              <div className="mt-5">
                <Skeleton width={140} height={16} />
                <ul className="mt-2 divide-y divide-neutral-100 max-h-[130px] overflow-auto rounded-xl border border-neutral-100">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <MemberRowSkeleton key={i} />
                  ))}
                </ul>
              </div>
              <div className="mt-5 flex justify-end">
                <Skeleton width={72} height={36} />
              </div>
            </div>
          </SkeletonTheme>
        </div>
      </div>
    </div>
  );
}
