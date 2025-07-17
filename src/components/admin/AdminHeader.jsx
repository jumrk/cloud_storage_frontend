import React from "react";

export default function AdminHeader({ onOpenSidebar }) {
  return (
    <header className="w-full h-16 flex items-center justify-between px-4 md:px-8 bg-gradient-to-r from-blue-50 via-white to-blue-100 shadow-sm z-20 sticky top-0">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-extrabold text-blue-800 tracking-wide">
          AdminPanel
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden md:inline text-gray-700 font-semibold text-lg">
          Xin chào, Admin
        </span>
        <span className="hidden md:flex w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-700  items-center justify-center border-2 border-white">
          <span className="text-white font-bold text-lg">A</span>
        </span>
        <button
          className="md:hidden p-2 rounded hover:bg-blue-100 transition"
          onClick={onOpenSidebar}
        >
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="feather feather-menu"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    </header>
  );
}
