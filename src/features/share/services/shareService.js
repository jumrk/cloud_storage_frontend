import axiosClient from "@/shared/lib/axiosClient";

const shareService = {
  // Lấy thông tin share qua token (public)
  getShareInfo: (token, password) => {
    return axiosClient.get(`/api/share/${token}`, {
      params: password ? { password } : undefined,
    });
  },

  // Lấy nội dung subfolder trong shared folder (public)
  getShareSubfolderInfo: (token, folderId, password) => {
    return axiosClient.get(`/api/share/${token}/folder/${folderId}`, {
      params: password ? { password } : undefined,
    });
  },

  // Lấy danh sách file trong folder qua share token (public)
  getShareFolderFiles: (token, password) => {
    return axiosClient.get(`/api/share/${token}/files`, {
      params: password ? { password } : undefined,
    });
  },

  // Tải xuống một file cụ thể qua share token (public)
  downloadShareFile: (token, fileId, onDownloadProgress, password) => {
    return axiosClient.get(`/api/share/${token}/file/${fileId}`, {
      responseType: "blob",
      params: password ? { password } : undefined,
      onDownloadProgress: onDownloadProgress || undefined,
    });
  },

  // Lấy download URL của file qua share token (public) - chỉ trả về URL
  getShareFileUrl: (token, fileId, password) => {
    return axiosClient.get(`/api/share/${token}/file/${fileId}/url`, {
      params: password ? { password } : undefined,
    });
  },

  // Tải xuống file/folder qua share token (public) - backward compatibility
  downloadShare: (token, password) => {
    return axiosClient.get(`/api/share/${token}/download`, {
      responseType: "blob",
      params: password ? { password } : undefined,
    });
  },
};

export default shareService;

