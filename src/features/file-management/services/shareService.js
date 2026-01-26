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
  downloadShare: (token, password = null) => {
    const config = {
      responseType: "blob",
    };
    if (password) {
      config.params = { password };
    }
    return axiosClient.get(`/api/share/${token}/download`, config);
  },

  // Verify password for public share
  verifyPassword: (token, password) => {
    return axiosClient.post(`/api/share/${token}/verify`, { password });
  },
};

export default shareService;

