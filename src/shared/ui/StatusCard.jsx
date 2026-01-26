import React from "react";
import { motion } from "framer-motion";
import { FiCheck, FiX, FiLoader } from "react-icons/fi";

const StatusCard = ({
  title,
  status, // 'pending', 'uploading', 'processing', 'success', 'error', 'downloading', 'cancelled'
  progress,
  speed,
  eta,
  children,
  style,
  headerIcon,
  headerColor = "text-brand",
}) => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 100, opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed bottom-4 right-4 z-[9999] w-[90vw] md:w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      style={style}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50/50 backdrop-blur-md border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg bg-white shadow-sm ring-1 ring-gray-100 ${headerColor}`}>
            {headerIcon}
          </div>
          <span className="font-semibold text-gray-700 text-sm truncate max-w-[200px]">{title}</span>
        </div>
        <div className="flex items-center gap-2">
            {status === 'success' && <div className="text-xs font-medium px-2 py-1 bg-green-50 text-green-600 rounded-full flex items-center gap-1"><FiCheck size={12}/> Xong</div>}
            {status === 'error' && <div className="text-xs font-medium px-2 py-1 bg-red-50 text-red-600 rounded-full flex items-center gap-1"><FiX size={12}/> Lỗi</div>}
            {(status === 'uploading' || status === 'processing' || status === 'downloading') && <div className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full flex items-center gap-1"><FiLoader className="animate-spin" size={12}/> {status === 'processing' ? 'Xử lý' : status === 'downloading' ? 'Đang tải' : 'Đang gửi'}</div>}
            {status === 'cancelled' && <div className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-500 rounded-full flex items-center gap-1"><FiX size={12}/> Đã hủy</div>}
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
           <span>Tiến độ</span>
           <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              status === 'error' ? 'bg-red-500' : status === 'success' ? 'bg-green-500' : status === 'cancelled' ? 'bg-gray-400' : 'bg-blue-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50 }}
          />
        </div>
        {(eta || speed) && (
            <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                <span>{speed}</span>
                <span>{eta}</span>
            </div>
        )}
      </div>

      {/* Content */}
      <div className="max-h-[200px] overflow-y-auto px-2 pb-2 custom-scrollbar">
        {children}
      </div>
    </motion.div>
  );
};

export default StatusCard;
