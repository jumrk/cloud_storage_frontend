"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiMoreVertical, FiEdit, FiTrash2 } from "react-icons/fi";

export default function ProjectMenu({ project, onEdit, onDelete, deleteLoading }) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      // Tính toán vị trí menu
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + window.scrollY + 4,
          right: window.innerWidth - rect.right + window.scrollX,
        });
      }
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const menuContent = open ? (
    <div
      ref={menuRef}
      className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999]"
      style={{
        top: `${menuPosition.top}px`,
        right: `${menuPosition.right}px`,
      }}
    >
      <div className="py-1">
        <button
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          onClick={() => {
            setOpen(false);
            onEdit && onEdit(project);
          }}
        >
          <FiEdit className="text-base" />
          Chỉnh sửa
        </button>
        <button
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          onClick={() => {
            setOpen(false);
            onDelete && onDelete(project.id || project._id);
          }}
          disabled={deleteLoading === project.id || deleteLoading === project._id}
        >
          <FiTrash2 className="text-base" />
          {deleteLoading === project.id || deleteLoading === project._id
            ? "Đang xóa..."
            : "Xóa"}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="relative inline-block" ref={buttonRef}>
        <button
          className="text-gray-400 hover:text-gray-600 p-1 rounded"
          onClick={() => setOpen(!open)}
          disabled={deleteLoading === project.id || deleteLoading === project._id}
        >
          <FiMoreVertical className="text-lg" />
        </button>
      </div>
      {typeof window !== "undefined" && createPortal(menuContent, document.body)}
    </>
  );
}

