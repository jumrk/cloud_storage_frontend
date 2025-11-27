"use client";
import React, { useCallback, useRef, useState, useEffect } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { v4 as uuidv4 } from "uuid";
import { useTranslations } from "next-intl";

const UploadModal = ({ isOpen, onClose, onStartUpload, parentId }) => {
  const t = useTranslations();
  const fileInputRef = useRef();
  const folderInputRef = useRef();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [emptyFolders, setEmptyFolders] = useState([]);
  console.log(parentId);
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

      return [...prev, ...toAdd];
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

  const handleUploadClick = () => {
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
        className="relative w-[90%] max-w-2xl bg-white rounded-2xl p-6 shadow-card transition-all duration-300 max-h-[90vh] overflow-y-auto border border-border"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-danger transition-colors duration-200"
        >
          <IoClose size={24} />
        </button>

        <div className="flex flex-col items-center gap-4 text-center mb-6">
          <FiUploadCloud size={60} className="text-brand animate-pulse" />
          <h2 className="text-2xl font-bold text-text-strong">
            {t("upload_modal.title")}
          </h2>
          <p className="text-sm text-text-muted">
            {t("upload_modal.drag_drop")}
          </p>
        </div>

        {dragActive && (
          <div className="absolute inset-0 border-4 border-dashed border-brand rounded-2xl bg-brand-50/50 flex items-center justify-center pointer-events-none">
            <p className="text-lg font-semibold text-brand">
              {t("upload_modal.drop_here")}
            </p>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="mb-6 max-h-60 overflow-y-auto border border-border rounded-lg p-2">
            <div className="text-sm font-medium text-text-strong mb-2 px-2">
              {t("upload_modal.file_list", { count: selectedFiles.length })}
            </div>
            {selectedFiles.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-surface-50 rounded-md mb-2 last:mb-0 hover:bg-white transition-colors border border-border/60"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-strong truncate">
                      📄 {item.path}
                    </span>
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
            ))}
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
                <span className="animate-spin">⏳</span>{" "}
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
                <span className="animate-spin">⏳</span>{" "}
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
          <p className="mt-4 text-center text-sm text-text-muted">
            {t("upload_modal.processing")}
          </p>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
