import axiosClient from "@/shared/lib/axiosClient";
import sleep from "@/shared/utils/sleep";

export async function getUser(signal) {
  await sleep();
  return axiosClient.get("/api/user", { signal }).then((r) => r.data);
}

export async function getMembers(signal) {
  await sleep();
  return axiosClient.get("/api/user/members", { signal }).then((r) => r.data);
}

export async function getUploads(params = { page: 1, limit: 1000 }, signal) {
  await sleep();
  return axiosClient.get("/api/upload", { params, signal }).then((r) => r.data);
}

export async function getNotifications(params = { page: 1, limit: 10 }, signal) {
  return axiosClient.get("/api/notification", { params, signal }).then((r) => r.data);
}

export async function getStorageTrend(period = "month", signal) {
  // This will be implemented in backend
  // For now, return mock data structure
  return Promise.resolve({ data: [] });
}

export async function getFileDistributionByMember(signal) {
  // This will be implemented in backend
  // For now, return mock data structure
  return Promise.resolve({ data: [] });
}