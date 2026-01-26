import React, { useState, useEffect, useCallback } from "react";
// import Modal from "@/shared/ui/Modal"; // Replacing with custom motion modal
import { FiFolder, FiChevronRight, FiLoader, FiArrowLeft, FiX, FiCheck, FiMove } from "react-icons/fi";
import { useTranslations } from "next-intl";
import axiosClient from "@/shared/lib/axiosClient";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

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

export default function MoveModal({ isOpen, onClose, moveItems, onConfirm, currentFolderId }) {
  const t = useTranslations("file.modal");
  const tCommon = useTranslations("file.button");
  
  // Navigation history: stack of folders [{ id: null, name: 'Root' }, { id: '123', name: 'Folder A' }]
  const [history, setHistory] = useState([{ id: null, name: t("move_outside_all") || "Thư mục gốc" }]);
  const [currentViewFolder, setCurrentViewFolder] = useState({ id: null, name: t("move_outside_all") || "Thư mục gốc" });
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setHistory([{ id: null, name: t("move_outside_all") || "Thư mục gốc" }]);
      setCurrentViewFolder({ id: null, name: t("move_outside_all") || "Thư mục gốc" });
      setFolders([]);
      fetchFolders(null);
    }
  }, [isOpen, t]);

  const fetchFolders = async (parentId) => {
    setLoading(true);
    try {
      const params = parentId ? { folderId: parentId } : {};
      const response = await axiosClient.get("/api/files/browse", { params });
      
      if (response.data?.success) {
        // Filter out folders that are in the moveItems list (can't move folder into itself)
        const allFolders = response.data.folders || [];
        const moveItemIds = new Set(moveItems?.map(i => i.id || i._id) || []);
        
        const validFolders = allFolders.filter(f => !moveItemIds.has(f._id));
        setFolders(validFolders);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
      toast.error("Không thể tải danh sách thư mục");
    } finally {
      setLoading(false);
    }
  };

  const handleEnterFolder = (folder) => {
    const newHistory = [...history, { id: folder._id, name: folder.name }];
    setHistory(newHistory);
    setCurrentViewFolder({ id: folder._id, name: folder.name });
    fetchFolders(folder._id);
  };

  const handleNavigateBack = () => {
    if (history.length <= 1) return;
    const newHistory = [...history];
    newHistory.pop(); // Remove current
    const prevFolder = newHistory[newHistory.length - 1];
    
    setHistory(newHistory);
    setCurrentViewFolder(prevFolder);
    fetchFolders(prevFolder.id);
  };

  const handleBreadcrumbClick = (index) => {
    if (index === history.length - 1) return;
    const newHistory = history.slice(0, index + 1);
    const targetFolder = newHistory[newHistory.length - 1];
    
    setHistory(newHistory);
    setCurrentViewFolder(targetFolder);
    fetchFolders(targetFolder.id);
  };

  const handleConfirm = () => {
    onConfirm({
        targetFolderId: currentViewFolder.id,
        targetFolder: currentViewFolder 
    });
    // Don't close immediately? Logic handled by parent usually, but here we can rely on parent to close or close manualy.
    // Parent logic calls onClose usually.
  };

  // Determine if "Move Here" should be disabled
  const isNoOp = moveItems?.every(item => {
      const itemParentId = item.parentId || (item.folderId) || null; 
      return itemParentId === currentViewFolder.id;
  });

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
            className="relative w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/50 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="p-2 bg-brand/10 rounded-lg text-brand">
                        <FiMove size={20} />
                    </span>
                    {t("move_folder_title") || "Di chuyển đến"}
                </h3>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-danger"
                >
                    <FiX size={20} />
                </button>
            </div>

            {/* Breadcrumb / Navigation Bar */}
            <div className="px-6 py-2 flex-shrink-0">
                <div className="bg-gray-50/80 border border-gray-100 rounded-xl px-3 py-2 flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap custom-scrollbar">
                    {history.length > 1 && (
                        <button 
                            onClick={handleNavigateBack}
                            className="p-1 hover:bg-white rounded-md text-gray-600 transition-colors shadow-sm"
                            title="Quay lại"
                        >
                            <FiArrowLeft size={14} />
                        </button>
                    )}
                    
                    <div className="flex items-center text-gray-600">
                        {history.length <= 2 ? (
                            history.map((h, i) => (
                                <React.Fragment key={h.id || 'root'}>
                                    {i > 0 && <FiChevronRight className="mx-1 text-gray-400" size={12} />}
                                    <button
                                        onClick={() => handleBreadcrumbClick(i)}
                                        className={`hover:text-brand font-medium px-1 rounded transition-colors ${i === history.length - 1 ? 'text-gray-900 font-bold' : ''}`}
                                    >
                                        {h.name}
                                    </button>
                                </React.Fragment>
                            ))
                        ) : (
                            <>
                                <button onClick={() => handleBreadcrumbClick(0)} className="hover:text-brand font-medium px-1">
                                    {history[0].name}
                                </button>
                                <FiChevronRight className="mx-1 text-gray-400" size={12} />
                                <span className="text-gray-400">...</span>
                                <FiChevronRight className="mx-1 text-gray-400" size={12} />
                                <span className="text-gray-900 font-bold px-1">
                                    {history[history.length - 1].name}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Folder List */}
            <div className="flex-1 overflow-y-auto px-6 py-2 min-h-[300px] custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full py-10 text-gray-400">
                        <FiLoader className="animate-spin mb-2" size={24} />
                        <span className="text-sm">Đang tải...</span>
                    </div>
                ) : folders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                        <FiFolder size={32} className="opacity-20 mb-2" />
                        <span className="text-sm">Thư mục trống</span>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {folders.map(folder => (
                            <button
                                key={folder._id}
                                onClick={() => handleEnterFolder(folder)}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-brand/5 hover:text-brand transition-all border border-transparent hover:border-brand/10 group text-left"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 bg-gray-100 text-gray-500 rounded-lg group-hover:bg-white group-hover:text-brand group-hover:shadow-sm transition-all">
                                        <FiFolder size={18} />
                                    </div>
                                    <span className="text-gray-700 group-hover:text-brand font-medium truncate">{folder.name}</span>
                                </div>
                                <FiChevronRight className="text-gray-300 group-hover:text-brand/50" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t border-gray-100 bg-white/50 backdrop-blur-sm flex justify-end gap-3 flex-shrink-0">
                <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                >
                    {tCommon("cancel") || "Hủy"}
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={isNoOp}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg shadow-brand/20 transition-all flex items-center gap-2 ${
                        isNoOp 
                        ? "bg-gray-300 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 hover:shadow-xl hover:shadow-brand/30 transform hover:-translate-y-0.5"
                    }`}
                >
                    <FiCheck />
                    {tCommon("move") || "Di chuyển đây"}
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
