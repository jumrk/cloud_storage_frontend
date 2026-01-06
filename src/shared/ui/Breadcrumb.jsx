"use client";
import React from "react";

export default function Breadcrumb({ items = [], onItemClick }) {
  // Always render to prevent UI jumps, but only show home icon when at root
  const hasItems = items && items.length > 0;

  return (
    <div className="flex items-center py-1 overflow-x-auto whitespace-nowrap">
      {/* Home icon - always visible */}
      <button
        onClick={() => onItemClick && onItemClick(null)}
        className="text-gray-600 hover:text-brand transition-colors"
        aria-label="Về trang chủ"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      </button>

      {hasItems &&
        items.map((item, index) => (
          <React.Fragment key={index}>
            <span className="mx-2 text-gray-500 text-sm">/</span>
            {index === items.length - 1 ? (
              <span className="text-blue-600 font-medium text-sm">
                {item.label}
              </span>
            ) : (
              <button
                onClick={() => onItemClick && onItemClick(item.id)}
                className="text-gray-600 hover:underline transition-colors text-sm"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        ))}
    </div>
  );
}
