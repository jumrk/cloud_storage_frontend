"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-white rounded-b-xl">
      <div className="text-sm text-text-muted">
        Hiển thị {startItem}-{endItem} trong tổng số {totalItems} mục
      </div>
      <nav className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition border border-border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-50 text-text-strong"
          aria-label="Trang trước"
        >
          <FiChevronLeft size={16} />
        </button>
        {getPageNumbers().map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-text-muted"
              >
                ...
              </span>
            );
          }
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition border ${
                currentPage === page
                  ? "bg-brand text-white border-brand"
                  : "border-border bg-white text-text-strong hover:bg-surface-50"
              }`}
            >
              {page}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition border border-border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-50 text-text-strong"
          aria-label="Trang sau"
        >
          <FiChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}

