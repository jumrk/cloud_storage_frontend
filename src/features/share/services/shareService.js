import axiosClient from "@/shared/lib/axiosClient";

const shareService = {
  // Lấy thông tin share qua token (public)
  getShareInfo: (token) => {
    return axiosClient.get(`/api/share/${token}`);
  },

  // Lấy nội dung subfolder trong shared folder (public)
  getShareSubfolderInfo: (token, folderId) => {
    return axiosClient.get(`/api/share/${token}/folder/${folderId}`);
  },

  // Lấy danh sách file trong folder qua share token (public)
  getShareFolderFiles: (token) => {
    return axiosClient.get(`/api/share/${token}/files`);
  },

  // Tải xuống một file cụ thể qua share token (public)
  downloadShareFile: (token, fileId) => {
    return axiosClient.get(`/api/share/${token}/file/${fileId}`, {
      responseType: "blob",
    });
  },

  // Tải xuống file/folder qua share token (public) - backward compatibility
  downloadShare: (token) => {
    return axiosClient.get(`/api/share/${token}/download`, {
      responseType: "blob",
    });
  },
};

export default shareService;

