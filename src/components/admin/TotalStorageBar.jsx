import React from "react";
import { formatSize } from "@/utils/driveUtils";

export default function TotalStorageBar({ used, total }) {
  const percent = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <div className="flex justify-between mb-1 text-sm font-medium text-gray-700">
        <span>Dung lượng đã dùng</span>
        <span>
          {formatSize(used)} / {formatSize(total)}
        </span>
      </div>
      <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-300 transition-all duration-500"
          style={{ width: percent + "%" }}
        />
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ width: percent + "%" }}
        />
      </div>
    </div>
  );
}
