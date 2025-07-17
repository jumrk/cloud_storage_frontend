import { useState } from "react";
import toast from "react-hot-toast";
import axiosClient from "@/lib/axiosClient";

export default function useDriveActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch files & folders (không phân trang)
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(`/api/upload`);
      const { files, folders } = res.data;
      setLoading(false);
      return {
        files,
        folders,
        totalFiles: files.length,
        totalPages: 1,
        page: 1,
        limit: files.length,
      };
    } catch (err) {
      setError(err.message || "Lỗi khi tải dữ liệu");
      setLoading(false);
      toast.error(err.message || "Lỗi khi tải dữ liệu");
      return {
        files: [],
        folders: [],
        totalFiles: 0,
        totalPages: 1,
        page: 1,
        limit: 0,
      };
    }
  };

  // Upload files với progress tracking
  const upload = async (formData, onProgress) => {
    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Tạo XMLHttpRequest để track progress
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
            if (onProgress) onProgress(progress);
          }
        });

        // Handle response
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              setLoading(false);
              setUploadProgress(100);
              toast.success("Tải lên thành công!");
              resolve(result);
            } catch (e) {
              setLoading(false);
              setError("Lỗi khi parse response");
              toast.error("Lỗi khi xử lý response");
              reject(new Error("Lỗi khi parse response"));
            }
          } else {
            setLoading(false);
            let errorMessage = "Tải lên thất bại";
            try {
              const errorResult = JSON.parse(xhr.responseText);
              errorMessage = errorResult.error || errorMessage;
            } catch (e) {
              // Ignore parse error
            }
            setError(errorMessage);
            toast.error(errorMessage);
            reject(new Error(errorMessage));
          }
        });

        // Handle network errors
        xhr.addEventListener("error", () => {
          setLoading(false);
          const errorMessage = "Lỗi kết nối mạng";
          setError(errorMessage);
          toast.error(errorMessage);
          reject(new Error(errorMessage));
        });

        // Handle timeout
        xhr.addEventListener("timeout", () => {
          setLoading(false);
          const errorMessage = "Upload timeout";
          setError(errorMessage);
          toast.error(errorMessage);
          reject(new Error(errorMessage));
        });

        // Send request
        xhr.open("POST", "/api/upload");
        xhr.timeout = 300000; // 5 minutes timeout
        xhr.send(formData);
      });
    } catch (err) {
      setLoading(false);
      setError(err.message || "Lỗi khi tải lên");
      toast.error(err.message || "Lỗi khi tải lên");
      return null;
    }
  };

  // Upload với batch processing (cho nhiều file lớn)
  const uploadBatch = async (files, privacySettings = {}, onProgress) => {
    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      // Thêm files
      files.forEach((file) => {
        formData.append("files", file, file.webkitRelativePath || file.name);
      });

      // Thêm privacy settings
      if (Object.keys(privacySettings).length > 0) {
        formData.append("privacy", JSON.stringify(privacySettings));
      }

      // Thêm empty folders nếu có
      const emptyFolders = [];
      files.forEach((file) => {
        const path = file.webkitRelativePath || file.name;
        const parts = path.split("/");
        for (let i = 0; i < parts.length - 1; i++) {
          const folderPath = parts.slice(0, i + 1).join("/") + "/";
          if (!emptyFolders.includes(folderPath)) {
            emptyFolders.push(folderPath);
          }
        }
      });

      if (emptyFolders.length > 0) {
        formData.append("emptyFolders", JSON.stringify(emptyFolders));
      }

      const result = await upload(formData, onProgress);
      return result;
    } catch (err) {
      setLoading(false);
      setError(err.message || "Lỗi khi tải lên batch");
      toast.error(err.message || "Lỗi khi tải lên batch");
      return null;
    }
  };

  // Move item
  const move = async ({ id, type, targetFolderId }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.post("/api/upload/move", {
        id,
        type,
        targetFolderId,
      });
      const data = res.data;
      setLoading(false);
      if (data.success) {
        toast.success("Di chuyển thành công!");
        return true;
      } else {
        throw new Error(data.error || "Di chuyển thất bại");
      }
    } catch (err) {
      setError(err.message || "Lỗi khi di chuyển");
      setLoading(false);
      toast.error(err.message || "Lỗi khi di chuyển");
      return false;
    }
  };

  // Delete items
  const deleteItems = async (items) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.post("/api/upload/delete", { items });
      const data = res.data;
      setLoading(false);
      if (data.success) {
        toast.success("Đã xóa thành công!");
        return true;
      } else {
        throw new Error(data.error || "Xóa thất bại");
      }
    } catch (err) {
      setError(err.message || "Lỗi khi xóa");
      setLoading(false);
      toast.error(err.message || "Lỗi khi xóa");
      return false;
    }
  };

  // Rename
  const rename = async (id, type, newName) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.post("/api/upload/rename", {
        id,
        type,
        newName,
      });
      const data = res.data;
      setLoading(false);
      if (data.success) {
        toast.success("Đổi tên thành công!");
        return true;
      } else {
        throw new Error(data.error || "Đổi tên thất bại");
      }
    } catch (err) {
      setError(err.message || "Lỗi khi đổi tên");
      setLoading(false);
      toast.error(err.message || "Lỗi khi đổi tên");
      return false;
    }
  };

  // Reset progress
  const resetProgress = () => {
    setUploadProgress(0);
    setError(null);
  };

  return {
    loading,
    error,
    uploadProgress,
    fetchData,
    upload,
    uploadBatch,
    move,
    deleteItems,
    rename,
    resetProgress,
  };
}
