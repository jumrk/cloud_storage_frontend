import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const AVATAR_SIZE = 44;
const MAIN_PX = "px-7";

export default function SkeletonChat() {
  const skeletonWidths = [180, 140, 200, 160, 190, 170, 150, 210];
  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div
        className={`flex items-center gap-3 ${MAIN_PX} py-5 border-b border-gray-100 bg-white shadow-sm`}
      >
        <div
          className="flex items-center justify-center rounded-full bg-[#eaf6fd] border-2 border-[#189ff2] shadow overflow-hidden"
          style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
        >
          <Skeleton circle width={AVATAR_SIZE} height={AVATAR_SIZE} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[18px] text-[#222]">
            <Skeleton width={120} height={20} />
          </div>
          <div className="text-xs flex items-center gap-1 mt-0.5">
            <Skeleton width={60} height={12} />
          </div>
        </div>
      </div>
      {/* Messages */}
      <div
        className={`flex-1 overflow-y-auto hide-scrollbar ${MAIN_PX} py-6 bg-[#f7fafd]`}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {skeletonWidths.map((w, i) => (
          <div key={i} className="mb-2 flex justify-start items-end">
            <Skeleton
              circle
              width={32}
              height={32}
              style={{ marginRight: 8 }}
            />
            <Skeleton width={w} height={28} borderRadius={18} />
          </div>
        ))}
      </div>
      {/* Input (ẩn khi loading) */}
    </div>
  );
}
