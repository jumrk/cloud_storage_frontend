import React from "react";
export default function SkeletonCard({ count = 8 }) {
  return (
    <div className="flex flex-wrap gap-4">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="w-[180px] h-[140px] bg-gray-200 rounded-2xl animate-pulse"
        />
      ))}
    </div>
  );
}
