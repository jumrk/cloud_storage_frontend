import { useEffect, useState } from "react";
import dashboardService from "../services/dashboardService";

export default function useDashboardPage() {
  const api = dashboardService();

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
      api.getFileCount(),
      api.getUsedSize(),
      api.getDriveStorage(),
      api.getUserCount(),
      api.getDriveCount(),
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
    api
      .getFilesByType(barFilter)
      .then((r) => setBarData(r.data))
      .finally(() => {
        setLoadingBar(false);
      });
  }, [barFilter]);

  // Fetch UserLineChart data
  useEffect(() => {
    setLoadingUserChart(true);
    api
      .getUsersByTime(userFilter)
      .then((r) => setUserChartData(r.data))
      .finally(() => {
        setLoadingUserChart(false);
      });
  }, [userFilter]);

  // Fetch GoogleAccountPieChart data
  useEffect(() => {
    setLoadingDrivePie(true);
    api
      .getDriveByType()
      .then((r) => setDrivePieData(r.data))
      .finally(() => {
        setLoadingDrivePie(false);
      });
  }, []);

  return {
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
  };
}

