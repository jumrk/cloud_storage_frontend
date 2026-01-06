"use client";
import { formatSize } from "@/shared/utils/driveUtils";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import useDashboardPage from "../hooks/useDashboardPage";
import FileBarChart from "./FileBarChart";
import StorageDonutChart from "./StorageDonutChart";
import UserLineChart from "./UserLineChart";
import GoogleAccountPieChart from "./GoogleAccountPieChart";

export default function DashboardPage() {
  const {
    fileCount,
    usedSize,
    totalSize,
    userCount,
    driveCount,
    loadingStats,
    barFilter,
    setBarFilter,
    barData,
    loadingBar,
    userFilter,
    setUserFilter,
    userChartData,
    loadingUserChart,
    drivePieData,
    loadingDrivePie,
  } = useDashboardPage();

  // Stat cards config
  const statCards = [
    {
      title: "Tổng số lượng file",
      value: loadingStats ? "..." : fileCount ?? 0,
    },
    {
      title: "Tổng dung lượng đã dùng",
      value: loadingStats ? "..." : usedSize != null ? formatSize(usedSize) : "0 B",
    },
    {
      title: "Tổng số người đăng ký",
      value: loadingStats ? "..." : userCount ?? 0,
    },
    {
      title: "Tổng số tài khoản Google",
      value: loadingStats ? "..." : driveCount ?? 0,
    },
  ];

  return (
    <div className="space-y-8 m-10">
      {/* Stat cards - chỉ hiện trên desktop */}
      <div className="hidden md:grid grid-cols-2 xl:grid-cols-4 gap-6 mb-2">
        {statCards.map((card, idx) => (
          <div
            key={card.title}
            className="bg-white shadow rounded-xl flex flex-col items-center justify-center py-6 px-2 min-h-[100px]"
          >
            <div className="text-3xl font-bold text-gray-800 mb-1 text-center">
              {loadingStats ? <Skeleton width={60} height={32} /> : card.value}
            </div>
            <div className="text-sm text-gray-500 text-center">
              {loadingStats ? <Skeleton width={100} height={16} /> : card.title}
            </div>
          </div>
        ))}
      </div>

      {/* Biểu đồ - 2 cột desktop, 1 cột mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative">
          {loadingBar ? (
            <div className="h-[320px] w-full bg-white rounded-xl flex items-center justify-center">
              <Skeleton width={220} height={220} borderRadius={16} />
            </div>
          ) : (
            <FileBarChart
              data={barData}
              filter={barFilter}
              setFilter={setBarFilter}
              loading={false}
            />
          )}
        </div>

        <StorageDonutChart
          used={usedSize || 0}
          total={totalSize || 0}
          loading={loadingStats}
        />

        <div className="relative">
          {loadingUserChart ? (
            <div className="h-[320px] w-full bg-white rounded-xl flex items-center justify-center">
              <Skeleton width={220} height={220} borderRadius={16} />
            </div>
          ) : (
            <UserLineChart
              data={userChartData}
              filter={userFilter}
              setFilter={setUserFilter}
              loading={false}
            />
          )}
        </div>

        <div className="relative">
          {loadingDrivePie ? (
            <div className="h-[320px] w-full bg-white rounded-xl flex items-center justify-center">
              <Skeleton width={180} height={180} borderRadius={16} />
            </div>
          ) : (
            <GoogleAccountPieChart data={drivePieData} loading={false} />
          )}
        </div>
      </div>
    </div>
  );
}
