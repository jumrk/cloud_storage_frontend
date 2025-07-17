import React from "react";
export default function SkeletonTable({ rows = 6 }) {
  return (
    <div className="animate-pulse">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 mb-2">
          <div className="bg-gray-200 rounded w-8 h-8" />
          <div className="bg-gray-200 rounded h-4 w-1/4" />
          <div className="bg-gray-200 rounded h-4 w-1/6" />
          <div className="bg-gray-200 rounded h-4 w-1/6" />
          <div className="bg-gray-200 rounded h-4 w-1/12" />
        </div>
      ))}
    </div>
  );
}
