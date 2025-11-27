import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const AVATAR_SIZE = 56;
const MAIN_PX = "px-6 md:px-16";

export default function SkeletonChat() {
  const skeletonWidths = [240, 260, 220, 280, 230, 250, 210, 270];
  return (
    <div className="flex flex-col h-full w-full animate-fade-in" style={{ animation: "fadeIn 0.15s ease-out" }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      {/* Header */}
      <div className="bg-white border-b border-[var(--color-border)] shadow-sm">
        <div
          className={`${MAIN_PX} py-4 flex items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div
              className="flex items-center justify-center rounded-2xl bg-[var(--color-surface-50)] border-2 border-brand overflow-hidden"
              style={{ width: AVATAR_SIZE + 6, height: AVATAR_SIZE + 6 }}
            >
              <Skeleton circle width={AVATAR_SIZE} height={AVATAR_SIZE} />
            </div>
            <div className="flex-1 min-w-0">
              <Skeleton height={20} width={180} />
              <div className="flex items-center gap-2 mt-2 text-xs">
                <Skeleton width={90} height={12} />
                <Skeleton width={50} height={12} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[42, 42, 42, 42].map((size, idx) => (
              <Skeleton key={idx} circle width={size} height={size} />
            ))}
          </div>
        </div>
      </div>
      {/* Messages */}
      <div
        className={`flex-1 overflow-y-hidden ${MAIN_PX} py-8`}
        style={{
          background:
            "linear-gradient(180deg, rgba(166,219,255,0.8) 0%, rgba(208,251,236,0.85) 100%)",
        }}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <Skeleton width={120} height={24} borderRadius={999} />
          </div>
          {skeletonWidths.map((w, i) => (
            <div
              key={i}
              className={`flex items-end gap-2 ${
                i % 2 === 0 ? "justify-start" : "justify-end flex-row-reverse"
              }`}
            >
              <Skeleton
                circle
                width={36}
                height={36}
                style={{ opacity: i % 3 === 0 ? 1 : 0 }}
              />
              <div>
                <Skeleton
                  width={w}
                  height={52}
                  borderRadius={24}
                  style={{
                    border: "1px solid rgba(255,255,255,0.4)",
                    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
                  }}
                />
                <div className="flex justify-end mt-2">
                  <Skeleton width={60} height={10} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Input (ẩn khi loading) */}
      <div
        className={`${MAIN_PX} py-5 border-t border-[var(--color-border)] bg-white`}
      >
        <div className="flex items-center gap-3 rounded-full bg-[var(--color-surface-50)] px-5 py-3">
          <Skeleton circle width={32} height={32} />
          <Skeleton height={18} width="100%" />
          <Skeleton circle width={36} height={36} />
        </div>
      </div>
    </div>
  );
}
