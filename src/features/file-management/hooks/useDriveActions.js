import { useState } from "react";
import toast from "react-hot-toast";
import axiosClient from "@/shared/lib/axiosClient";
import { useTranslations } from "next-intl";

export default function useDriveActions() {
  const t = useTranslations();
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
      setError(err.message || t("hooks.drive_actions.load_data_error"));
      setLoading(false);
      toast.error(err.message || t("hooks.drive_actions.load_data_error"));
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
              toast.success(t("hooks.drive_actions.upload_success"));
              resolve(result);
            } catch (e) {
              setLoading(false);
              setError(t("hooks.drive_actions.parse_response_error"));
              toast.error(t("hooks.drive_actions.process_response_error"));
              reject(new Error(t("hooks.drive_actions.parse_response_error")));
            }
          } else {
            setLoading(false);
            let errorMessage = t("hooks.drive_actions.upload_failed");
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
          const errorMessage = t("hooks.drive_actions.network_error");
          setError(errorMessage);
          toast.error(errorMessage);
          reject(new Error(errorMessage));
        });

        // Handle timeout
        xhr.addEventListener("timeout", () => {
          setLoading(false);
          const errorMessage = t("hooks.drive_actions.upload_timeout");
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
      setError(err.message || t("hooks.drive_actions.upload_error"));
      toast.error(err.message || t("hooks.drive_actions.upload_error"));
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
      files.forEach((file) => {
        formData.append("files", file, file.webkitRelativePath || file.name);
      });

      if (Object.keys(privacySettings).length > 0) {
        formData.append("privacy", JSON.stringify(privacySettings));
      }

      const result = await upload(formData, onProgress);
      return result;
    } catch (err) {
      setLoading(false);
      setError(err.message || t("hooks.drive_actions.batch_upload_error"));
      toast.error(err.message || t("hooks.drive_actions.batch_upload_error"));
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
        toast.success(t("hooks.drive_actions.move_success"));
        return true;
      } else {
        throw new Error(data.error || t("hooks.drive_actions.move_failed"));
      }
    } catch (err) {
      setError(err.message || t("hooks.drive_actions.move_error"));
      setLoading(false);
      toast.error(err.message || t("hooks.drive_actions.move_error"));
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
        toast.success(t("hooks.drive_actions.delete_success"));
        return true;
      } else {
        throw new Error(data.error || t("hooks.drive_actions.delete_failed"));
      }
    } catch (err) {
      setError(err.message || t("hooks.drive_actions.delete_error"));
      setLoading(false);
      toast.error(err.message || t("hooks.drive_actions.delete_error"));
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
        toast.success(t("hooks.drive_actions.rename_success"));
        return true;
      } else {
        throw new Error(data.error || t("hooks.drive_actions.rename_failed"));
      }
    } catch (err) {
      setError(err.message || t("hooks.drive_actions.rename_error"));
      setLoading(false);
      toast.error(err.message || t("hooks.drive_actions.rename_error"));
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
