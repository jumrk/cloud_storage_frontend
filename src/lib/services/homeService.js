import axiosClient from "@/lib/axiosClient";

export function getUser(signal) {
  return axiosClient.get("/api/user", { signal }).then((r) => r.data);
}

export function getMembers(signal) {
  return axiosClient.get("/api/user/members", { signal }).then((r) => r.data);
}

export function getUploads(params = { page: 1, limit: 1000 }, signal) {
  return axiosClient.get("/api/upload", { params, signal }).then((r) => r.data);
}
