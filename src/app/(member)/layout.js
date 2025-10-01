"use client";
import { useState } from "react";
import MemberSidebar from "@/components/member/MemberSidebar";

export default function MemberLayout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <button
        aria-label="Mở menu"
        className="md:hidden fixed top-4 left-4 z-50 bg-white border border-gray-200 rounded-xl p-2 shadow"
        onClick={() => setOpen(true)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 6h16M4 12h16M4 18h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <MemberSidebar isMobile open={open} onClose={() => setOpen(false)} />

      <div className="mx-auto py-3">
        <div className="hidden md:block fixed left-0 top-0 h-screen w-60">
          <MemberSidebar />
        </div>
        <main className="md:ml-60">
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}
