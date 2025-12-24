import axiosClient from "@/shared/lib/axiosClient";

export async function getSharedByMe(signal) {
  return axiosClient
    .get("/api/shared-files/by-me", { signal })
    .then((r) => r.data);
}

export async function getSharedWithMe(signal) {
  return axiosClient
    .get("/api/shared-files/with-me", { signal })
    .then((r) => r.data);
}

