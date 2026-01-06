"use client";
import { useEffect, useState, useRef } from "react";
import { FiMoreHorizontal } from "react-icons/fi";
export default function RoleMenu({ user, onChangeRole }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        className="text-gray-400 hover:text-gray-700 p-2 rounded-full"
        onClick={() => setOpen((v) => !v)}
        title="Tùy chọn"
      >
        <FiMoreHorizontal className="text-lg" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 min-w-[180px] bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-2 animate-fadeIn">
          {user.role === "leader" && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-700 font-medium"
              onClick={() => {
                setOpen(false);
                onChangeRole("admin");
              }}
            >
              Phân quyền: Admin
            </button>
          )}
          {user.role === "admin" && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-yellow-50 text-yellow-700 font-medium"
              onClick={() => {
                setOpen(false);
                onChangeRole("leader");
              }}
            >
              Phân quyền: Leader
            </button>
          )}
        </div>
      )}
    </div>
  );
}
