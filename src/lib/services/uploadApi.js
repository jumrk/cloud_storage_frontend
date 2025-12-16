import axiosClient from "@/lib/axiosClient";

export async function postChunk(body, headers) {
  const res = await axiosClient.post("/api/upload/v2", body, { headers });
  return res.data;
}

export async function getStatus(uploadId) {
  const res = await axiosClient.get("/api/upload/v2/status", {
    params: { uploadId },
  });
  return res.data;
}

export async function cancelUpload(uploadId) {
  const res = await axiosClient.post("/api/upload/v2/cancel", { uploadId });
  return res.data;
}
