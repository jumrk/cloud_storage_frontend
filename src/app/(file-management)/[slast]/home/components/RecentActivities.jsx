"use client";

import { useTranslations } from "next-intl";
import { FiUpload, FiTrash2, FiMove, FiShare2, FiClock } from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
// Helper function to format time ago
const formatTimeAgo = (date) => {
  if (!date) return "";
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return "vừa xong";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  }
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  }
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} tháng trước`;
  }
  const years = Math.floor(diffInSeconds / 31536000);
  return `${years} năm trước`;
};

const activityIcons = {
  upload: FiUpload,
  delete: FiTrash2,
  move: FiMove,
  share: FiShare2,
};

const activityColors = {
  upload: "text-success",
  delete: "text-danger",
  move: "text-warning",
  share: "text-brand",
};

export function RecentActivities({ activities, loading }) {
  const t = useTranslations();

  if (loading) {
    return (
      <div className="mb-6 p-5 rounded-xl bg-white border border-border shadow-card">
        <div className="font-semibold text-text-strong mb-3 text-base tracking-wide">
          Hoạt động gần đây
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 mb-3">
            <Skeleton circle width={32} height={32} />
            <div className="flex-1">
              <Skeleton width={200} height={14} className="mb-1" />
              <Skeleton width={120} height={12} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="mb-6 p-5 rounded-xl bg-white border border-border shadow-card">
        <div className="font-semibold text-text-strong mb-3 text-base tracking-wide">
          Hoạt động gần đây
        </div>
        <div className="text-sm text-text-muted text-center py-4">
          Chưa có hoạt động nào
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-white border border-border shadow-card">
      <div className="font-semibold text-text-strong mb-3 text-base tracking-wide">
        Hoạt động gần đây
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto sidebar-scrollbar">
        {activities.map((activity, index) => {
          const Icon = activityIcons[activity.type] || FiClock;
          const colorClass = activityColors[activity.type] || "text-text-muted";

          return (
            <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
              <div className={`${colorClass} flex-shrink-0 mt-0.5`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text-strong font-medium">
                  {activity.title}
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  {activity.content}
                </div>
                <div className="text-xs text-text-muted mt-1 flex items-center gap-1">
                  <FiClock size={12} />
                  {formatTimeAgo(activity.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

