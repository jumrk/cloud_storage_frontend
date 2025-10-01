"use client";
import { useEffect, useState } from "react";
import FileBarChart from "@/components/admin/FileBarChart";
import StorageDonutChart from "@/components/admin/StorageDonutChart";
import UserLineChart from "@/components/admin/UserLineChart";
import GoogleAccountPieChart from "@/components/admin/GoogleAccountPieChart";
import { formatSize } from "@/utils/driveUtils";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import axiosClient from "@/lib/axiosClient";

export default function AdminDashboard() {
  // Stat cards state
  const [fileCount, setFileCount] = useState(null);
  const [usedSize, setUsedSize] = useState(null);
  const [totalSize, setTotalSize] = useState(null);
  const [userCount, setUserCount] = useState(null);
  const [driveCount, setDriveCount] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // FileBarChart state
  const [barFilter, setBarFilter] = useState("month");
  const [barData, setBarData] = useState([]);
  const [loadingBar, setLoadingBar] = useState(true);

  // UserLineChart state
  const [userFilter, setUserFilter] = useState("month");
  const [userChartData, setUserChartData] = useState([]);
  const [loadingUserChart, setLoadingUserChart] = useState(true);

  // GoogleAccountPieChart state
  const [drivePieData, setDrivePieData] = useState([]);
  const [loadingDrivePie, setLoadingDrivePie] = useState(true);

  // Fetch stat cards
  useEffect(() => {
    setLoadingStats(true);
    Promise.all([
      axiosClient.get("/api/admin/files/count").then((r) => r.data),
      axiosClient.get("/api/admin/files/used-size").then((r) => r.data),
      axiosClient.get("/api/admin/drive/storage").then((r) => r.data),
      axiosClient.get("/api/admin/users/count").then((r) => r.data),
      axiosClient.get("/api/admin/drive/count").then((r) => r.data),
    ])
      .then(([countRes, usedRes, storageRes, userRes, driveRes]) => {
        setFileCount(countRes.count);
        setUsedSize(usedRes.used);
        setTotalSize(storageRes.total);
        setUserCount(userRes.count);
        setDriveCount(driveRes.count);
      })
      .finally(() => {
        setLoadingStats(false);
      });
  }, []);

  // Fetch FileBarChart data
  useEffect(() => {
    setLoadingBar(true);
    axiosClient
      .get(`/api/admin/files/by-type`, { params: { period: barFilter } })
      .then((r) => setBarData(r.data.data))
      .finally(() => {
        setLoadingBar(false);
      });
  }, [barFilter]);

  // Fetch UserLineChart data
  useEffect(() => {
    setLoadingUserChart(true);
    axiosClient
      .get(`/api/admin/users/by-time`, { params: { period: userFilter } })
      .then((r) => setUserChartData(r.data.data))
      .finally(() => {
        setLoadingUserChart(false);
      });
  }, [userFilter]);

  // Fetch GoogleAccountPieChart data
  useEffect(() => {
    setLoadingDrivePie(true);
    axiosClient
      .get(`/api/admin/drive/by-type`)
      .then((r) => setDrivePieData(r.data.data))
      .finally(() => {
        setLoadingDrivePie(false);
      });
  }, []);

  // Stat cards config
  const statCards = [
    {
      title: "Tổng số lượng file",
      value: loadingStats ? "..." : fileCount ?? 0,
    },
    {
      title: "Tổng dung lượng đã dùng",
      value: loadingStats
        ? "..."
        : usedSize != null
        ? formatSize(usedSize)
        : "0 B",
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
