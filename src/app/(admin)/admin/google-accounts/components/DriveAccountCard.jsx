"use client";

import React from "react";
import { formatSize } from "@/shared/utils/driveUtils";

export default function DriveAccountCard({ account, onDelete, onRelink }) {
  if (!account) return null;
  return (
    <div className="bg-white rounded-2xl shadow p-5 flex flex-col gap-2 w-full max-w-xs mx-auto border border-gray-100 hover:shadow-lg transition">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-lg">
          {account.email?.[0]?.toUpperCase() || "G"}
        </div>
        <div className="flex-1 truncate">
          <div className="font-semibold text-gray-800 max-w-[140px] truncate whitespace-nowrap">
            {account.email}
          </div>
          <div className="text-xs text-gray-400">Đã liên kết</div>
        </div>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Đã dùng:</span>
        <span>{formatSize(account.usedStorage)}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Tổng dung lượng:</span>
        <span>{formatSize(account.totalStorage)}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Token hết hạn:</span>
        <span>
          {account.tokenExpiry
            ? new Date(account.tokenExpiry).toLocaleString("vi-VN")
            : "—"}
        </span>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Ngày liên kết:</span>
        <span>
          {account.createdAt
            ? new Date(account.createdAt).toLocaleDateString("vi-VN")
            : "—"}
        </span>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
          onClick={() => onRelink?.(account)}
        >
          Liên kết lại
        </button>
        <button
          className="flex-1 py-2 rounded-lg bg-red-100 text-red-600 font-semibold hover:bg-red-200 transition"
          onClick={() => onDelete?.(account)}
        >
          Xoá
        </button>
      </div>
    </div>
  );
}


