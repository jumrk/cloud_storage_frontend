"use client";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";
import Image from "next/image";
import React from "react";
import { FiX, FiMessageCircle } from "react-icons/fi";

// User Item Component
export function UserItem({ user, onStartChat, onRemove, showRemove = false }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition group">
      <div className="relative">
        <Image
          src={getAvatarUrl(user.avatar)}
          alt={user.fullName || user.email}
          width={44}
          height={44}
          className="w-11 h-11 rounded-full object-cover border border-gray-200"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {user.fullName || user.slast || "Người dùng"}
        </p>
        <p className="text-sm text-gray-600 truncate"> {user.email} </p>
      </div>
      <div className="flex items-center gap-2">
        {showRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="p-2 rounded-full text-gray-600 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
            title="Xóa khỏi gần đây"
          >
            <FiX size={16} />
          </button>
        )}
        <button
          onClick={onStartChat}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-600 transition"
        >
          <FiMessageCircle size={16} /> <span>Nhắn tin</span>
        </button>
      </div>
    </div>
  );
}
