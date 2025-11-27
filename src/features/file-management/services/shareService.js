import axiosClient from "@/shared/lib/axiosClient";

const shareService = {
  // Tạo hoặc cập nhật share
  createOrUpdateShare: (data) => {
    return axiosClient.post("/api/share", data);
  },

  // Lấy thông tin share qua token (public)
  getShareInfo: (token) => {
    return axiosClient.get(`/api/share/${token}`);
  },

  // Tải xuống file/folder qua share token (public)
  downloadShare: (token) => {
    return axiosClient.get(`/api/share/${token}/download`, {
      responseType: "blob",
    });
  },
};

export default shareService;

