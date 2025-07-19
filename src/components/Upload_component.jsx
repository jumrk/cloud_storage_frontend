"use client";
import React, { useCallback, useRef, useState, useEffect } from "react";
import {
  FiUploadCloud,
  FiEye,
  FiEyeOff,
  FiGlobe,
  FiLock,
} from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

const UploadModal = ({ isOpen, onClose, onStartUpload, parentId }) => {
  const fileInputRef = useRef();
  const folderInputRef = useRef();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [emptyFolders, setEmptyFolders] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles([]);
      setIsUploading(false);
      setDragActive(false);
      setEmptyFolders([]);
    }
  }, [isOpen]);
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
      const newFiles = files.filter((file) => {
        const relPath =
          file._relativePath || file.webkitRelativePath || file.name;
        // Chỉ cho phép file lẻ hoặc file nằm trong folder gốc
        return relPath.split("/").filter(Boolean).length <= 2;
      });

      return [
        ...prev,
        ...newFiles.map((file) => ({
          name: file.name,
          file,
          isPublic: false, // Mặc định là riêng tư
          path: file._relativePath || file.webkitRelativePath || file.name,
        })),
      ];
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
  };

  const togglePrivacy = (index) => {
    setSelectedFiles((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, isPublic: !item.isPublic } : item
      )
    );
  };

  const handleUploadClick = () => {
    if (selectedFiles.length > 0) {
      const batchId = uuidv4(); // Sinh batchId duy nhất cho mỗi lần upload
      // Gom các folder gốc
      const folderMap = new Map();
      selectedFiles.forEach((item) => {
        if (item.path.includes("/")) {
          const folderName = item.path.split("/")[0];
          if (!folderMap.has(folderName)) folderMap.set(folderName, []);
          folderMap.get(folderName).push(item);
        }
      });
      // Gom emptyFolders theo folder gốc
      const emptyFoldersMap = new Map();
      emptyFolders.forEach((f) => {
        const folderName = f.split("/")[0];
        if (!emptyFoldersMap.has(folderName))
          emptyFoldersMap.set(folderName, []);
        emptyFoldersMap.get(folderName).push(f);
      });
      // Tạo batch cho từng folder
      const folderBatches = Array.from(folderMap.entries()).map(
        ([folderName, items]) => ({
          type: "folder",
          folderName,
          batchId, // Gán batchId cho batch folder
          files: items.map((item) => ({
            file: item.file,
            name: item.name,
            relativePath: item.path,
            batchId, // Gán batchId cho từng file
          })),
          emptyFolders: emptyFoldersMap.get(folderName) || [],
          parentId: parentId || null,
        })
      );
      // Batch file lẻ
      const filesOnly = selectedFiles
        .filter((item) => !item.path.includes("/"))
        .map((item) => ({
          file: item.file,
          name: item.name,
          batchId, // Gán batchId cho file lẻ
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

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative w-[90%] max-w-2xl bg-white rounded-2xl p-6 shadow-2xl transform transition-all duration-300 ease-in-out max-h-[90vh] overflow-y-auto"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors duration-200"
        >
          <IoClose size={24} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center mb-6">
          <FiUploadCloud size={60} className="text-blue-600 animate-pulse" />
          <h2 className="text-2xl font-bold text-gray-800">
            Tải lên tệp hoặc thư mục
          </h2>
          <p className="text-sm text-gray-500">
            Kéo và thả file/thư mục hoặc chọn từ thiết bị
          </p>
        </div>

        {/* Drag Area Overlay */}
        {dragActive && (
          <div className="absolute inset-0 border-4 border-dashed border-blue-500 rounded-2xl bg-blue-50/50 flex items-center justify-center pointer-events-none">
            <p className="text-lg font-semibold text-blue-600">
              Thả file/thư mục tại đây!
            </p>
          </div>
        )}

        {/* File List với Privacy Settings */}
        {selectedFiles.length > 0 && (
          <div className="mb-6 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
            <div className="text-sm font-medium text-gray-700 mb-2 px-2">
              Danh sách tệp ({selectedFiles.length})
            </div>
            {selectedFiles.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md mb-2 last:mb-0 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 truncate">
                      📄 {item.path}
                    </span>
                  </div>
                </div>

                {/* Privacy Toggle */}
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => togglePrivacy(index)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      item.isPublic
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    title={item.isPublic ? "Công khai" : "Riêng tư"}
                  >
                    {item.isPublic ? (
                      <>
                        <FiGlobe size={12} />
                        Công khai
                      </>
                    ) : (
                      <>
                        <FiLock size={12} />
                        Riêng tư
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Xóa"
                  >
                    <IoClose size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => fileInputRef.current.click()}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-blue-300"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <span className="animate-spin">⏳</span> Đang tải...
              </>
            ) : (
              <>
                <FiUploadCloud size={20} />
                Chọn tệp
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
            className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-green-300"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <span className="animate-spin">⏳</span> Đang tải...
              </>
            ) : (
              <>
                <FiUploadCloud size={20} />
                Chọn thư mục
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
              className="w-full px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all duration-200 disabled:bg-indigo-300 font-semibold"
              disabled={isUploading}
            >
              {isUploading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                `Tải lên ${selectedFiles.length} mục`
              )}
            </button>
          )}
        </div>

        {/* Feedback */}
        {isUploading && (
          <p className="mt-4 text-center text-sm text-gray-600">
            Đang xử lý, vui lòng chờ...
          </p>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
