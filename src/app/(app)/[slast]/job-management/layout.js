"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import JobManagementChat from "@/features/job-management/components/JobManagementChat";

export default function JobManagementLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const slast = params?.slast;
  const [showChat, setShowChat] = useState(false);
  const [currentBoardId, setCurrentBoardId] = useState(null);

  // Extract boardId from URL if we're on a board detail page
  useEffect(() => {
    const boardMatch = pathname?.match(/\/board\/([^\/]+)/);
    if (boardMatch) {
      setCurrentBoardId(boardMatch[1]);
    } else {
      setCurrentBoardId(null);
    }
  }, [pathname]);

  return (
    <>
      {children}
      
      {/* Floating AI Chat Button */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#0e5f9b] shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center group"
        aria-label="Mở AI Chat"
        style={{
          boxShadow: "0 4px 12px rgba(14, 95, 155, 0.3)",
        }}
      >
        {/* Sparkles icon - AI icon */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
            fill="white"
          />
          <path
            d="M6 4L6.5 6.5L9 7L6.5 7.5L6 10L5.5 7.5L3 7L5.5 6.5L6 4Z"
            fill="white"
          />
          <path
            d="M18 14L18.5 16.5L21 17L18.5 17.5L18 20L17.5 17.5L15 17L17.5 16.5L18 14Z"
            fill="white"
          />
        </svg>
        {/* Subtle pulse animation ring on hover */}
        <span className="absolute inset-0 rounded-full bg-[#0e5f9b] animate-ping opacity-0 group-hover:opacity-20"></span>
      </button>

      {/* AI Chat Panel */}
      <JobManagementChat
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        currentBoardId={currentBoardId}
        boards={[]}
        tasks={[]}
        onNavigateToTask={(task) => {
          console.log("Navigate to task:", task);
        }}
        onNavigateToBoard={(board) => {
          const boardPath = slast 
            ? `/${slast}/job-management/workspace/board/${board.id || board._id}`
            : `/job-management/workspace/board/${board.id || board._id}`;
          router.push(boardPath);
        }}
        onRefresh={() => {
          window.location.reload();
        }}
      />
    </>
  );
}

