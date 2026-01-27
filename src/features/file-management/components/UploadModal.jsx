"use client";
import React, { useCallback, useRef, useState, useEffect } from "react";

import { FiUploadCloud, FiAlertTriangle, FiFile, FiFolder, FiX } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { v4 as uuidv4 } from "uuid";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import axiosClient from "@/shared/lib/axiosClient";
import useDebounce from "@/hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";

// Không giới hạn file size
const MAX_FILE_COUNT = 1000;

const dropIn = {
  hidden: { y: "-100vh", opacity: 0, scale: 0.8 },
  visible: {
    y: "0",
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: { y: "100vh", opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

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
  const debouncedSelectedFiles = useDebounce(selectedFiles, 500);

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

  // Auto-check duplicates whenever debouncedSelectedFiles changes
  useEffect(() => {
    if (isOpen && debouncedSelectedFiles.length > 0) {
      checkDuplicates(debouncedSelectedFiles);
    } else if (debouncedSelectedFiles.length === 0) {
      setDuplicateFiles(new Set());
    }
  }, [debouncedSelectedFiles, isOpen, checkDuplicates]);

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
    
    try {
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
    } catch (error) {
        console.error("Error handling dropped files:", error);
        toast.error(t("upload_modal.drop_error") || "Có lỗi xảy ra khi xử lý file kéo thả");
    }
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const sanitizePath = (path) => {
    // Remove null bytes, unsafe chars, and directory traversal attempts
    return path.replace(/\0/g, '').replace(/(\.\.(\/|\\|$))+/g, '');
  };

  const handleFilesOrFolder = (files) => {
    setSelectedFiles((prev) => {
        // Validation: Check total file count
        if (prev.length + files.length > MAX_FILE_COUNT) {
            toast.error(t("upload_modal.max_file_count_error", { max: MAX_FILE_COUNT }) || `Bạn chỉ có thể upload tối đa ${MAX_FILE_COUNT} file một lần.`);
            // Only add enough files to reach limit
            files = files.slice(0, MAX_FILE_COUNT - prev.length);
        }

      const seen = new Set(
        prev.map((p) => `${p.path}__${p.file.size}__${p.file.lastModified}`)
      );
      const toAdd = [];
      for (const file of files) {
        const relPathRaw =
          file._relativePath || file.webkitRelativePath || file.name;
        // Sanitize path here
        let relPath = relPathRaw.replace(/\\/g, "/").replace(/^\.?\/*/, "");
        relPath = sanitizePath(relPath);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-[50] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={dropIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-2xl bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/50 flex flex-col max-h-[90vh] md:max-h-[85vh]"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="p-2 bg-brand/10 rounded-lg text-brand">
                  <FiUploadCloud size={24} />
                </span>
                {t("upload_modal.title")}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-danger"
              >
                <IoClose size={24} />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 px-6 custom-scrollbar">
              {/* Drag Drop Zone */}
              <div
                className={`relative group rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center py-6 md:py-10 px-4 text-center cursor-pointer overflow-hidden flex-shrink-0 ${
                  dragActive
                    ? "border-brand bg-brand/5 scale-[1.01]"
                    : "border-gray-300 hover:border-brand/50 hover:bg-gray-50/50"
                }`}
              >
                 <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                />
                <input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  webkitdirectory=""
                  directory=""
                  className="hidden"
                  onChange={handleFolderChange}
                />
                
                <div className="z-10 flex flex-col items-center gap-3">
                  <div className={`p-3 md:p-4 rounded-full bg-brand/5 text-brand transform transition-transform duration-300 ${dragActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                    <FiUploadCloud size={32} className="md:w-12 md:h-12" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-700">
                      {t("upload_modal.drag_drop")}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                      {t("upload_modal.support_text") || "Hỗ trợ định dạng hình ảnh, video, tài liệu..."}
                    </p>
                  </div>
                  <div className="flex gap-2 md:gap-3 mt-2 flex-wrap justify-center">
                    <button
                      onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current.click();
                      }}
                      className="px-3 py-1.5 md:px-4 md:py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-brand/30 transition-all text-xs md:text-sm font-medium text-gray-600 hover:text-brand flex items-center gap-2"
                    >
                      <FiFile /> {t("upload_modal.choose_file")}
                    </button>
                     <button
                      onClick={(e) => {
                           e.stopPropagation();
                           folderInputRef.current.click();
                      }}
                      className="px-3 py-1.5 md:px-4 md:py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-brand/30 transition-all text-xs md:text-sm font-medium text-gray-600 hover:text-brand flex items-center gap-2"
                    >
                      <FiFolder /> {t("upload_modal.choose_folder")}
                    </button>
                  </div>
                </div>
  
                 {dragActive && (
                  <div className="absolute inset-0 z-0 bg-brand/5 animate-pulse" />
                )}
              </div>
  
              {/* File List */}
              <AnimatePresence>
                {selectedFiles.length > 0 && (
                  <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-6 border-t border-gray-100 pt-4 pb-2"
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-sm font-semibold text-gray-700">
                        {t("upload_modal.file_list", { count: selectedFiles.length })}
                      </span>
                       {checkingDuplicates && (
                          <span className="text-xs text-brand animate-pulse">Đang kiểm tra trùng lặp...</span>
                        )}
                    </div>
  
                    {duplicateFiles.size > 0 && (
                       <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-3"
                        >
                         <div className="p-1.5 bg-warning/20 rounded-full text-warning-700 mt-0.5">
                             <FiAlertTriangle size={14} />
                         </div>
                         <div className="text-xs text-warning-800 space-y-0.5">
                              <p className="font-semibold">Phát hiện {duplicateFiles.size} file trùng lặp</p>
                               <p className="opacity-80">Hệ thống sẽ tự động đổi tên file (ví dụ: "file (1).ext") để tránh ghi đè.</p>
                         </div>
                     </motion.div>
                    )}
  
                    <div className="space-y-2">
                      {selectedFiles.map((item, index) => {
                           const fileName = item.path.split("/").pop();
                           const isDuplicate = duplicateFiles.has(fileName);
  
                        return (
                        <motion.div
                          key={`${item.path}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                              isDuplicate
                              ? "bg-warning/5 border-warning/30 hover:border-warning/50"
                              : "bg-gray-50 border-gray-100 hover:border-brand/30 hover:shadow-sm hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${isDuplicate ? 'bg-warning/20 text-warning-700' : 'bg-brand/10 text-brand'}`}>
                              {item.path.includes("/") ? <FiFolder size={16} /> : <FiFile size={16} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-700 truncate" title={item.path}>
                                {item.path}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(item.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="p-1.5 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-full transition-colors flex-shrink-0"
                          >
                            <FiX size={16} />
                          </button>
                        </motion.div>
                      )})}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="p-6 pt-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0 bg-white/50 backdrop-blur-sm">
              <button
                onClick={onClose}
                className="px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors text-sm md:text-base"
                disabled={isUploading}
              >
                {t("common.cancel") || "Hủy bỏ"}
              </button>
              <button
                onClick={handleUploadClick}
                disabled={isUploading || selectedFiles.length === 0}
                className={`px-5 py-2 md:px-6 md:py-2.5 rounded-xl font-semibold text-white shadow-lg shadow-brand/20 transition-all flex items-center gap-2 text-sm md:text-base ${
                  isUploading || selectedFiles.length === 0
                    ? "bg-gray-300 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 hover:shadow-xl hover:shadow-brand/30 transform hover:-translate-y-0.5"
                }`}
              >
                {isUploading ? (
                  <>
                     <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     {t("upload_modal.uploading")}...
                  </>
                ) : (
                  <>
                    <FiUploadCloud size={20} />
                    {selectedFiles.length > 0 
                        ? t("upload_modal.upload_count", { count: selectedFiles.length })
                        : t("upload_modal.start_upload") || "Bắt đầu tải lên"
                    }
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UploadModal;