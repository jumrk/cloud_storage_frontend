"use client";
import React, { useCallback, useRef, useState, useEffect } from "react";
import { FiUploadCloud, FiAlertTriangle } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { v4 as uuidv4 } from "uuid";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import axiosClient from "@/shared/lib/axiosClient";

const UploadModal = ({ isOpen, onClose, onStartUpload, parentId, isMember = false }) => {
  const t = useTranslations();
  const fileInputRef = useRef();
  const folderInputRef = useRef();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [emptyFolders, setEmptyFolders] = useState([]);
  const [duplicateFiles, setDuplicateFiles] = useState(new Set());
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Check for duplicate files - check all files in selectedFiles list
  const checkDuplicates = useCallback(
    async (selectedFilesList) => {
      if (!selectedFilesList || selectedFilesList.length === 0) {
        setDuplicateFiles(new Set());
        return;
      }

      try {
        setCheckingDuplicates(true);
        // Extract filenames from selectedFiles items (which have path property)
        const fileNames = selectedFilesList.map((item) => {
          // Extract filename from path
          const parts = item.path.replace(/\\/g, "/").split("/");
          return parts[parts.length - 1]; // Get the last part (filename)
        });

        const response = await axiosClient.post(
          "/api/upload/check-duplicates",
          {
            fileNames,
            parentId: parentId || null,
          }
        );

        if (response.data.success && response.data.duplicates) {
          setDuplicateFiles(new Set(response.data.duplicates));
        } else {
          setDuplicateFiles(new Set());
        }
      } catch (error) {
        console.error("Error checking duplicates:", error);
        // Don't block upload if check fails
        setDuplicateFiles(new Set());
      } finally {
        setCheckingDuplicates(false);
      }
    },
    [parentId]
  );

  // console.log(parentId); // Commented out to prevent console spam
  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles([]);
      setIsUploading(false);
      setDragActive(false);
      setEmptyFolders([]);
      setDuplicateFiles(new Set());
      setCheckingDuplicates(false);
    }
  }, [isOpen]);

  // Auto-check duplicates whenever selectedFiles changes
  useEffect(() => {
    if (isOpen && selectedFiles.length > 0) {
      checkDuplicates(selectedFiles);
    } else if (selectedFiles.length === 0) {
      setDuplicateFiles(new Set());
    }
  }, [selectedFiles, isOpen, checkDuplicates]);

  const traverseFileTree = async (item, path = "") => {
    if (item.isFile) {
      return new Promise((resolve) => {
        item.file((file) => {
          resolve([{ file, relativePath: path + file.name }]);
        });
      });
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      return new Promise((resolve) => {
        dirReader.readEntries(async (entries) => {
          let files = [];
          let isEmpty = entries.length === 0;
          for (const entry of entries) {
            const entryFiles = await traverseFileTree(
              entry,
              path + item.name + "/"
            );
            files = files.concat(entryFiles);
          }
          if (isEmpty) {
            resolve([
              { emptyFolder: true, relativePath: path + item.name + "/" },
            ]);
          } else {
            resolve(files);
          }
        });
      });
    }
  };

  const getAllFileEntries = async (dataTransferItemList) => {
    let fileEntries = [];
    let emptyFolders = [];
    const promises = [];
    for (let i = 0; i < dataTransferItemList.length; i++) {
      const item = dataTransferItemList[i].webkitGetAsEntry();
      if (item) {
        promises.push(traverseFileTree(item));
      }
    }
    const results = await Promise.all(promises);
    results.forEach((files) => {
      files.forEach((obj) => {
        if (obj.emptyFolder) emptyFolders.push(obj.relativePath);
        else fileEntries.push(obj);
      });
    });
    return { fileEntries, emptyFolders };
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    let filesToAdd = [];
    let emptyFoldersToAdd = [];
    let hasDirectory = false;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const entry = e.dataTransfer.items[i].webkitGetAsEntry?.();
        if (entry && entry.isDirectory) {
          hasDirectory = true;
          break;
        }
      }
    }
    if (hasDirectory) {
      const { fileEntries, emptyFolders } = await getAllFileEntries(
        e.dataTransfer.items
      );
      if (fileEntries.length > 0) {
        filesToAdd = fileEntries.map((obj) => {
          obj.file._relativePath = obj.relativePath;
          return obj.file;
        });
      }
      emptyFoldersToAdd = emptyFolders;
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      filesToAdd = Array.from(e.dataTransfer.files);
    }
    if (filesToAdd.length > 0) {
      handleFilesOrFolder(filesToAdd);
    }
    if (emptyFoldersToAdd.length > 0) {
      setEmptyFolders((prev) => [...prev, ...emptyFoldersToAdd]);
    }
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleFilesOrFolder = (files) => {
    setSelectedFiles((prev) => {
      const seen = new Set(
        prev.map((p) => `${p.path}__${p.file.size}__${p.file.lastModified}`)
      );
      const toAdd = [];
      for (const file of files) {
        const relPathRaw =
          file._relativePath || file.webkitRelativePath || file.name;
        const relPath = relPathRaw.replace(/\\/g, "/").replace(/^\.?\/*/, "");
        const key = `${relPath}__${file.size}__${file.lastModified}`;
        if (seen.has(key)) continue;
        toAdd.push({
          name: file.name,
          file,
          isPublic: false,
          path: relPath,
        });
        seen.add(key);
      }
      const newFiles = [...prev, ...toAdd];
      // Duplicates will be checked automatically by useEffect when selectedFiles updates
      return newFiles;
    });
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    handleFilesOrFolder(files);
  };

  const handleFolderChange = async (e) => {
    const files = Array.from(e.target.files);
    handleFilesOrFolder(files);
    const folderSet = new Set();
    files.forEach((file) => {
      const relPath =
        file.webkitRelativePath || file._relativePath || file.name;
      const parts = relPath.split("/");
      for (let i = 0; i < parts.length - 1; i++) {
        const folderPath = parts.slice(0, i + 1).join("/") + "/";
        folderSet.add(folderPath);
      }
    });
    setEmptyFolders(Array.from(folderSet));
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    // Duplicates will be checked automatically by useEffect when selectedFiles updates
  };

  const handleUploadClick = () => {
    // ================= PERMISSION CHECK FOR MEMBERS =================
    // Member must be inside a folder (parentId must not be null)
    if (isMember && parentId === null) {
      toast.error(
        t("file_management.member_must_enter_folder") ||
          "Bạn phải vào một thư mục được cấp quyền để tải lên",
      );
      return;
    }

    if (selectedFiles.length > 0) {
      const batchId = uuidv4();
      const folderMap = new Map();
      selectedFiles.forEach((item) => {
        if (item.path.includes("/")) {
          const folderName = item.path.split("/")[0];
          if (!folderMap.has(folderName)) folderMap.set(folderName, []);
          folderMap.get(folderName).push(item);
        }
      });
      const emptyFoldersMap = new Map();
      emptyFolders.forEach((f) => {
        const folderName = f.split("/")[0];
        if (!emptyFoldersMap.has(folderName))
          emptyFoldersMap.set(folderName, []);
        emptyFoldersMap.get(folderName).push(f);
      });
      const folderBatches = Array.from(folderMap.entries()).map(
        ([folderName, items]) => ({
          type: "folder",
          folderName,
          batchId,
          files: items.map((item) => ({
            file: item.file,
            name: item.name,
            relativePath: item.path,
            batchId,
          })),
          emptyFolders: emptyFoldersMap.get(folderName) || [],
          parentId: parentId || null,
        })
      );
      const filesOnly = selectedFiles
        .filter((item) => !item.path.includes("/"))
        .map((item) => ({
          file: item.file,
          name: item.name,
          batchId,
        }));
      const batches = [];
      if (filesOnly.length > 0)
        batches.push({
          type: "file",
          files: filesOnly,
          batchId,
          parentId: parentId || null,
        });
      batches.push(...folderBatches);
      if (onStartUpload) onStartUpload(batches);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative w-[90%] max-w-2xl bg-white rounded-2xl p-6 shadow-card transition-all duration-300 max-h-[90vh] overflow-y-auto border border-gray-200 main-content-scrollbar"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-danger transition-colors duration-200"
        >
          <IoClose size={24} />
        </button>
        <div className="flex flex-col items-center gap-4 text-center mb-6">
          <FiUploadCloud size={60} className="text-brand animate-pulse" />
          <h2 className="text-2xl font-bold text-gray-900">
            {t("upload_modal.title")}
          </h2>
          <p className="text-sm text-gray-600">{t("upload_modal.drag_drop")}</p>
        </div>
        {dragActive && (
          <div className="absolute inset-0 border-4 border-dashed border-brand rounded-2xl bg-brand-50/50 flex items-center justify-center pointer-events-none">
            <p className="text-lg font-semibold text-brand">
              {t("upload_modal.drop_here")}
            </p>
          </div>
        )}
        {selectedFiles.length > 0 && (
          <div className="mb-6 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 sidebar-scrollbar">
            <div className="flex items-center justify-between mb-2 px-2">
              <div className="text-sm font-medium text-gray-900">
              {t("upload_modal.file_list", { count: selectedFiles.length })}
              </div>
              {checkingDuplicates && (
                <span className="text-xs text-gray-500">Đang kiểm tra...</span>
              )}
            </div>
            {duplicateFiles.size > 0 && (
              <div className="mb-2 px-2 py-2 bg-warning/10 border border-warning/30 rounded-md">
                <div className="flex items-start gap-2">
                  <FiAlertTriangle
                    className="text-warning mt-0.5 flex-shrink-0"
                    size={16}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-warning-800">
                      Cảnh báo: {duplicateFiles.size} file đã tồn tại trong thư
                      mục này
                    </p>
                    <p className="text-xs text-warning-700 mt-0.5">
                      File sẽ được đổi tên tự động khi upload (ví dụ: "file
                      (1).ext")
                    </p>
                  </div>
                </div>
              </div>
            )}
            {selectedFiles.map((item, index) => {
              // Extract filename from path for duplicate check
              const fileName = item.path.split("/").pop();
              const isDuplicate = duplicateFiles.has(fileName);

              return (
              <div
                key={index}
                  className={`flex items-center justify-between p-3 rounded-md mb-2 last:mb-0 transition-colors border ${
                    isDuplicate
                      ? "bg-warning/5 border-warning/30"
                      : "bg-white border-gray-200/60 hover:bg-white"
                  }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900 truncate">
                      📄 {item.path}
                    </span>
                      {isDuplicate && (
                        <FiAlertTriangle
                          className="text-warning flex-shrink-0"
                          size={14}
                          title="File đã tồn tại"
                        />
                      )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="text-danger hover:opacity-90 p-1"
                  title={t("upload_modal.remove")}
                >
                  <IoClose size={16} />
                </button>
              </div>
              );
            })}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => fileInputRef.current.click()}
            className="w-full px-6 py-3 bg-brand text-white rounded-lg hover:opacity-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <span className="animate-spin">⏳</span>
                {t("upload_modal.uploading")}
              </>
            ) : (
              <>
                <FiUploadCloud size={20} />
                {t("upload_modal.choose_file")}
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
          />
          <button
            onClick={() => folderInputRef.current.click()}
            className="w-full px-6 py-3 bg-accent text-white rounded-lg hover:opacity-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <span className="animate-spin">⏳</span>
                {t("upload_modal.uploading")}
              </>
            ) : (
              <>
                <FiUploadCloud size={20} />
                {t("upload_modal.choose_folder")}
              </>
            )}
          </button>
          <input
            ref={folderInputRef}
            type="file"
            multiple
            webkitdirectory=""
            directory=""
            className="hidden"
            onChange={handleFolderChange}
          />
          {selectedFiles.length > 0 && (
            <button
              onClick={handleUploadClick}
              className="w-full px-6 py-3 bg-brand text-white rounded-lg hover:opacity-95 transition-all duration-200 disabled:opacity-50 font-semibold"
              disabled={isUploading}
            >
              {isUploading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                t("upload_modal.upload_count", { count: selectedFiles.length })
              )}
            </button>
          )}
        </div>
        {isUploading && (
          <p className="mt-4 text-center text-sm text-gray-600">
            {t("upload_modal.processing")}
          </p>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
