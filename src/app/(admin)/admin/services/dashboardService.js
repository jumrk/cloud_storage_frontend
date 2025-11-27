import axiosClient from "@/shared/lib/axiosClient";

export default function dashboardService() {
  const getFileCount = () =>
    axiosClient.get("/api/admin/files/count").then((r) => r.data);

  const getUsedSize = () =>
    axiosClient.get("/api/admin/files/used-size").then((r) => r.data);

  const getDriveStorage = () =>
    axiosClient.get("/api/admin/drive/storage").then((r) => r.data);

  const getUserCount = () =>
    axiosClient.get("/api/admin/users/count").then((r) => r.data);

  const getDriveCount = () =>
    axiosClient.get("/api/admin/drive/count").then((r) => r.data);

  const getFilesByType = (period) =>
    axiosClient
      .get(`/api/admin/files/by-type`, { params: { period } })
      .then((r) => r.data);

  const getUsersByTime = (period) =>
    axiosClient
      .get(`/api/admin/users/by-time`, { params: { period } })
      .then((r) => r.data);

  const getDriveByType = () =>
    axiosClient.get(`/api/admin/drive/by-type`).then((r) => r.data);

  return {
    getFileCount,
    getUsedSize,
    getDriveStorage,
    getUserCount,
    getDriveCount,
    getFilesByType,
    getUsersByTime,
    getDriveByType,
  };
}

