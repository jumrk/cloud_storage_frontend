"use client";
import { useState } from "react";
import MemberHeader from "@/components/member/MemberHeader";
import MemberSidebar from "@/components/member/Member_sidebar";

export default function MemberLayout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full sticky top-0 z-40">
        <MemberHeader />
      </div>

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

      <div className="max-w-6xl mx-auto md:px-6">
        <div className="hidden md:block fixed left-0 top-0 h-screen w-60">
          <MemberSidebar />
        </div>
        <main className="md:ml-60">
          <div className="max-w-5xl  mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
