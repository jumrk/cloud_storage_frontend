"use client";
import React from "react";
import { useTranslations } from "next-intl";
import {
  FiFile,
  FiHardDrive,
  FiUsers,
  FiTrendingUp,
  FiFolder,
  FiDownload,
  FiUpload,
  FiActivity,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { formatSize } from "@/shared/utils/driveUtils";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { StorageTrendChart } from "./StorageTrendChart";
import { FileDistributionByType } from "./FileDistributionByType";
import { FileDistributionByMember } from "./FileDistributionByMember";
import { StoragePieChart } from "./StoragePieChart";

export default function Dashboard({
  overview,
  stats,
  loading,
  activities,
  loadingActivities,
  fileTypes,
  storageTrend,
  fileDistributionByMember,
  loadingCharts,
  storagePeriod,
  setStoragePeriod,
}) {
  const t = useTranslations();

  const statCards = [
    {
      key: "totalFiles",
      label: "Tổng số tệp",
      value: overview?.totalFiles || 0,
      icon: <FiFile className="text-xl" />,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      change: stats?.filesChange || 0,
    },
    {
      key: "storageUsed",
      label: "Dung lượng đã dùng",
      value: formatSize(overview?.usedNum || 0),
      icon: <FiHardDrive className="text-xl" />,
      iconColor: "text-green-600",
      iconBg: "bg-green-50",
      change: stats?.storageChange || 0,
    },
    {
      key: "members",
      label: "Thành viên",
      value: overview?.subAccounts || 0,
      icon: <FiUsers className="text-xl" />,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
      change: stats?.membersChange || 0,
    },
    {
      key: "storagePercent",
      label: "Tỷ lệ sử dụng",
      value: overview?.totalNum
        ? `${Math.round((overview.usedNum / overview.totalNum) * 100)}%`
        : "0%",
      icon: <FiTrendingUp className="text-xl" />,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-50",
      change: null,
    },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-white h-full overflow-auto main-content-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm p-5 border border-gray-100"
            >
              <Skeleton height={100} />
            </div>
          ))}
        </div>
        {/* Charts Row Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Storage Pie Chart Skeleton */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Skeleton height={20} width="60%" className="mb-4" />
            <Skeleton circle height={180} width={180} className="mx-auto" />
            <div className="mt-6 space-y-3">
              <Skeleton height={20} />
              <Skeleton height={20} />
              <Skeleton height={20} />
            </div>
          </div>
          {/* Quick Stats Skeleton */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Skeleton height={20} width="50%" className="mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Skeleton circle width={40} height={40} />
                  <div className="flex-1">
                    <Skeleton height={12} width="60%" className="mb-2" />
                    <Skeleton height={20} width="40%" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Recent Activities Skeleton */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Skeleton height={20} width="50%" className="mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton circle width={36} height={36} />
                  <div className="flex-1">
                    <Skeleton height={14} width="70%" className="mb-1" />
                    <Skeleton height={10} width="50%" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Charts Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Skeleton height={20} width="40%" className="mb-4" />
            <Skeleton height={300} />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Skeleton height={20} width="40%" className="mb-4" />
            <Skeleton height={300} />
          </div>
        </div>
        {/* File Distribution Skeleton */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <Skeleton height={20} width="40%" className="mb-4" />
          <Skeleton height={400} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-white h-full overflow-auto main-content-scrollbar">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.iconBg}`}>
                  <div className={card.iconColor}>{card.icon}</div>
                </div>
                {card.change !== null && (
                  <div
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      card.change >= 0
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {card.change >= 0 ? (
                      <FiArrowUp className="text-[10px]" />
                    ) : (
                      <FiArrowDown className="text-[10px]" />
                    )}
                    {Math.abs(card.change)}%
                  </div>
                )}
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1.5 uppercase tracking-wider">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Tổng quan lưu trữ
          </h3>
          {loading || loadingCharts ? (
            <div className="space-y-4">
              <Skeleton circle height={180} width={180} className="mx-auto" />
              <div className="mt-6 space-y-3">
                <Skeleton height={20} />
                <Skeleton height={20} />
                <Skeleton height={20} />
              </div>
            </div>
          ) : (
            <>
              <StoragePieChart
                used={overview?.usedNum || 0}
                total={overview?.totalNum || 0}
              />
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Đã sử dụng</span>
                  <span className="font-semibold text-blue-600">
                    {formatSize(overview?.usedNum || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Tổng dung lượng</span>
                  <span className="font-semibold text-gray-900">
                    {formatSize(overview?.totalNum || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Còn lại</span>
                  <span className="font-semibold text-green-600">
                    {formatSize(
                      Math.max(
                        0,
                        (overview?.totalNum || 0) - (overview?.usedNum || 0)
                      )
                    )}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Thông tin nhanh
          </h3>
          {loading || loadingCharts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Skeleton circle width={40} height={40} />
                  <div className="flex-1">
                    <Skeleton height={12} width="60%" className="mb-2" />
                    <Skeleton height={20} width="40%" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiFile className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Tổng số tệp</p>
                  <p className="text-lg font-bold text-gray-900">
                    {overview?.totalFiles || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiUsers className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Thành viên</p>
                  <p className="text-lg font-bold text-gray-900">
                    {overview?.subAccounts || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiTrendingUp className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Gói dịch vụ</p>
                  <p className="text-lg font-bold text-gray-900">
                    {overview?.plan || "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">
              Hoạt động gần đây
            </h3>
            <FiActivity className="text-gray-400" />
          </div>
          {loadingActivities ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton circle width={36} height={36} />
                  <div className="flex-1">
                    <Skeleton height={14} width="70%" className="mb-1" />
                    <Skeleton height={10} width="50%" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {activities.slice(0, 8).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      activity.type === "upload"
                        ? "bg-blue-100"
                        : activity.type === "download"
                        ? "bg-green-100"
                        : activity.type === "folder"
                        ? "bg-purple-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {activity.type === "upload" && (
                      <FiUpload className="text-blue-600 text-sm" />
                    )}
                    {activity.type === "download" && (
                      <FiDownload className="text-green-600 text-sm" />
                    )}
                    {activity.type === "folder" && (
                      <FiFolder className="text-purple-600 text-sm" />
                    )}
                    {!["upload", "download", "folder"].includes(
                      activity.type
                    ) && <FiActivity className="text-gray-600 text-sm" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {activity.title || activity.content}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {activity.createdAt
                        ? new Date(activity.createdAt).toLocaleString("vi-VN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <FiActivity className="text-3xl mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chưa có hoạt động nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StorageTrendChart
          data={storageTrend}
          loading={loadingCharts}
          period={storagePeriod}
          onPeriodChange={setStoragePeriod}
        />
        <FileDistributionByType data={fileTypes} loading={loading} />
      </div>

      {/* File Distribution by Member */}
      <FileDistributionByMember
        data={fileDistributionByMember}
        loading={loadingCharts}
      />
    </div>
  );
}
