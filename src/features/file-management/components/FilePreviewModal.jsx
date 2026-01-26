import React, { useEffect, useState, useMemo } from "react";

import { useTranslations } from "next-intl";
import { FiX, FiDownload, FiInfo, FiLoader, FiAlertCircle, FiCode, FiFileText, FiPlay, FiMusic } from "react-icons/fi";
import FileManagementService from "../services/fileManagementService";
import { motion, AnimatePresence } from "framer-motion";

export default function FilePreviewModal({ file, fileUrl, onClose, onOpen }) {
  const t = useTranslations();
  const api = useMemo(() => FileManagementService(), []);
  // ✅ No need for token - cookie sent automatically with API requests
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "";

  const [previewData, setPreviewData] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (onOpen) onOpen();
    loadPreview();
  }, [file]);

  const loadPreview = async () => {
    const fileId = file.id || file._id;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get capabilities
      const capRes = await api.getPreviewCapabilities(fileId);
      if (capRes.success) {
        setCapabilities(capRes);
      }

      // 2. Get preview data (for text/code)
      if (["text", "code"].includes(capRes.previewType)) {
        const dataRes = await api.getFilePreview(fileId);
        if (dataRes.success) {
          setPreviewData(dataRes);
        }
      }
    } catch (err) {
      console.error("Preview load error:", err);
      setError("Không thể tải bản xem trước cho tệp tin này.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    const fileId = file.id || file._id;
    const previewUrl = `${apiBase}/api/download/file/${fileId}?preview=true`;
    const downloadUrl = fileUrl || `${apiBase}/api/download/file/${fileId}`;
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-brand">
          <div className="w-16 h-16 relative">
             <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
             <div className="absolute inset-0 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-semibold animate-pulse text-gray-500">Đang tải bản xem trước...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-6 text-gray-400">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
             <FiAlertCircle size={32} className="text-red-400" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-gray-900 font-medium">Đã có lỗi xảy ra</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
          <button 
            onClick={() => window.open(downloadUrl, '_blank')}
            className="px-6 py-2.5 bg-brand text-white rounded-xl font-medium text-sm shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
          >
            Tải xuống để xem
          </button>
        </div>
      );
    }

    const type = capabilities?.previewType;

    switch (type) {
      case "image":
        return (
          <div className="relative w-full h-full flex items-center justify-center rounded-2xl overflow-hidden">
            <motion.img 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              src={previewUrl} 
              alt={file.name} 
              className="max-w-full max-h-full object-contain drop-shadow-2xl"
            />
          </div>
        );

      case "video":
        return (
          <div className="flex items-center justify-center w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative group">
            <video 
              controls 
              autoPlay
              className="w-full h-full max-h-[75vh]"
              src={previewUrl}
            >
              Trình duyệt của bạn không hỗ trợ phát video.
            </video>
          </div>
        );

      case "audio":
        return (
          <div className="flex flex-col items-center justify-center w-full h-full gap-8 bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-white shadow-inner p-8">
            <div className="w-40 h-40 rounded-[32px] bg-white shadow-xl flex items-center justify-center ring-1 ring-gray-100 relative overflow-hidden group">
               <div className="absolute inset-0 bg-brand/5 group-hover:bg-brand/10 transition-colors" />
               <FiMusic size={64} className="text-brand" />
            </div>
            <div className="w-full max-w-md">
                <audio controls className="w-full shadow-lg rounded-full">
                  <source src={previewUrl} />
                </audio>
            </div>
          </div>
        );

      case "pdf":
        return (
          <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
            <iframe 
              src={`${previewUrl}#toolbar=0`} 
              className="w-full h-full border-none"
              title="PDF Preview"
            />
          </div>
        );

      case "text":
      case "code":
        return (
          <div className="w-full h-full flex flex-col bg-[#1E1E1E] rounded-2xl overflow-hidden shadow-2xl border border-gray-800 ring-1 ring-black/50">
            <div className="px-4 py-3 bg-[#252526] border-b border-black flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                 {/* MacOS Dots */}
                 <div className="flex gap-1.5 mr-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                    <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                 </div>
                 <div className="h-4 w-[1px] bg-gray-700 mx-2" />
                 <span className="text-xs font-mono text-gray-400">
                    {previewData?.language || 'Plain Text'}
                 </span>
              </div>
              {previewData?.truncated && (
                 <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Preview Truncated</span>
              )}
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar p-6">
              <pre className="text-[13px] leading-relaxed font-mono text-[#D4D4D4] whitespace-pre tab-4">
                <code>{previewData?.content}</code>
              </pre>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-gray-500">
            <div className="w-24 h-24 rounded-[28px] bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm">
              <FiInfo size={40} className="text-gray-300" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-gray-900">Không thể xem trước</p>
              <p className="text-sm">Định dạng tập tin này chưa được hỗ trợ xem trực tiếp.</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open(downloadUrl, '_blank')}
              className="px-8 py-3 bg-gray-900 text-white rounded-xl font-medium text-sm shadow-xl shadow-gray-900/10 hover:bg-black transition-all mt-4"
            >
              Tải xuống tập tin
            </motion.button>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-[50] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="absolute inset-0 bg-black/60 backdrop-blur-md"
           onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95, y: 20 }}
           transition={{ type: "spring", stiffness: 300, damping: 28 }}
           className="relative w-full max-w-6xl h-[80vh] sm:h-[85vh] bg-white/95 backdrop-blur-2xl rounded-[24px] sm:rounded-[32px] shadow-2xl border border-white/20 flex flex-col overflow-hidden ring-1 ring-black/5"
           onClick={(e) => e.stopPropagation()}
        >
           {/* Header */}
           <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 bg-white/50 backdrop-blur shrink-0 z-10">
              <div className="flex items-center gap-4 min-w-0">
                 <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-white shadow-sm shrink-0">
                    <FiFileText className="text-gray-500" size={20} />
                 </div>
                 <div className="min-w-0 flex flex-col">
                    <h3 className="text-base font-bold text-gray-900 truncate leading-snug">{file.name}</h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">
                       {file.mimeType} • {((file.size || 0) / 1024 / 1024).toFixed(2)} MB
                    </p>
                 </div>
              </div>

              <div className="flex items-center gap-2">
                 <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.open(fileUrl || `/api/download/file/${file.id || file._id}`, '_blank')}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all border border-gray-200 shadow-sm"
                 >
                    <FiDownload className="text-gray-500" size={16} /> 
                    <span className="hidden sm:inline">Tải xuống</span>
                 </motion.button>
                 <motion.button
                    whileHover={{ scale: 1.05, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ rotate: { duration: 0.2 } }}
                    onClick={onClose}
                    className="w-9 h-9 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-all"
                 >
                    <FiX size={20} />
                 </motion.button>
              </div>
           </div>

           {/* Main Content */}
           <div className="flex-1 overflow-hidden relative bg-gray-50/50 flex items-center justify-center p-2 sm:p-8">
              {renderContent()}
           </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
