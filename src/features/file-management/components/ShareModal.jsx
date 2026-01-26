import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  FiCopy, FiCheck, FiX, FiLock, FiDownload, 
  FiEye, FiInfo, FiShield, FiBarChart2, FiLink,
  FiSettings, FiPieChart
} from "react-icons/fi";
import shareService from "../services/shareService";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

export default function ShareModal({ isOpen, onClose, item, onSuccess }) {
  const t = useTranslations();
  const [canView, setCanView] = useState(true);
  const [canDownload, setCanDownload] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [maxDownloads, setMaxDownloads] = useState("");
  const [notifyOnAccess, setNotifyOnAccess] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("settings"); // settings, analytics

  useEffect(() => {
    if (isOpen && item) {
      setCanView(typeof item.canView === "boolean" ? item.canView : true);
      setCanDownload(typeof item.canDownload === "boolean" ? item.canDownload : false);
      setShareUrl(item.shareUrl || "");
      setCopied(false);
      // Reset advanced options
      const requirePwd = !!item.requirePassword;
      setRequirePassword(requirePwd);
      setPassword("");
      setMaxDownloads(
        Number.isFinite(item.maxDownloads) ? String(item.maxDownloads) : ""
      );
      setNotifyOnAccess(!!item.notifyOnAccess);
    }
  }, [isOpen, item]);

  const handleCreateShare = async () => {
    if (!item) return;
    setLoading(true);
    try {
      // ✅ FIX: Password validation
      if (requirePassword) {
        if (password) {
          // Validate new password
          if (password.length < 4) {
            toast.error("Mật khẩu phải có ít nhất 4 ký tự");
            setLoading(false);
            return;
          }
          if (password.length > 100) {
            toast.error("Mật khẩu quá dài (tối đa 100 ký tự)");
            setLoading(false);
            return;
          }
        } else if (!item?.requirePassword) {
          // No existing password and no new password
          toast.error("Vui lòng nhập mật khẩu khi bật bảo vệ");
          setLoading(false);
          return;
        }
      }

      const data = {
        resourceId: item.id || item._id,
        resourceType: item.type,
        canView,
        canDownload,
        requirePassword,
        password: requirePassword ? password : null,
        maxDownloads: maxDownloads ? parseInt(maxDownloads) : null,
        notifyOnAccess,
      };

      const response = await shareService.createOrUpdateShare(data);
      if (response.data?.success) {
        const updatedShare = response.data.share;
        setShareUrl(updatedShare.shareUrl);
        
        // Update local state
        setRequirePassword(!!updatedShare.requirePassword);
        setMaxDownloads(
          Number.isFinite(updatedShare.maxDownloads) ? String(updatedShare.maxDownloads) : ""
        );
        setNotifyOnAccess(!!updatedShare.notifyOnAccess);
        
        toast.success("Đã lưu cài đặt chia sẻ!");
        if (typeof onSuccess === "function") {
          onSuccess({
            ...updatedShare,
            resourceId: item.id || item._id,
          });
        }
      } else {
        toast.error(response.data?.error || "Không thể tạo link chia sẻ");
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.error || "Không thể tạo link chia sẻ";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Đã copy link chia sẻ!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Không thể copy link");
    }
  };

  if (!isOpen || !item) return null;

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="absolute inset-0 bg-black/60 backdrop-blur-sm"
           onClick={onClose}
        />
        
        <motion.div 
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95, y: 20 }}
           transition={{ type: "spring", stiffness: 300, damping: 28 }}
           className="relative w-full max-w-xl bg-white/95 backdrop-blur-2xl rounded-[24px] sm:rounded-[32px] shadow-2xl border border-white/20 flex flex-col overflow-hidden max-h-[90vh] ring-1 ring-black/5"
           onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 pb-4 shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand shrink-0 flex items-center justify-center border border-blue-100 shadow-sm">
                <FiLink size={24} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">{item.name || item.originalName}</h3>
                <p className="text-xs text-gray-500 font-medium">Chia sẻ tệp tin với người khác</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-900 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-6 gap-6 border-b border-gray-100">
            {[
               { id: "settings", label: "Cài đặt", icon: <FiSettings size={16} /> },
               { id: "analytics", label: "Thống kê", icon: <FiPieChart size={16} /> }
            ].map((tab) => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 pt-1 text-sm font-bold transition-colors flex items-center gap-2 relative ${
                     activeTab === tab.id ? "text-brand" : "text-gray-400 hover:text-gray-600"
                  }`}
               >
                  {tab.icon} {tab.label}
                  {activeTab === tab.id && (
                     <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full"
                     />
                  )}
               </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-hide">
            <AnimatePresence mode="wait">
              {activeTab === "settings" ? (
                <motion.div 
                  key="settings"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 sm:space-y-8"
                >
                  {/* Permission Selection */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
                      Quyền truy cập
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { id: "view", label: "Chỉ xem", icon: <FiEye size={20} />, view: true, dl: false },
                        { id: "both", label: "Xem & Tải về", icon: <FiDownload size={20} />, view: true, dl: true },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => { setCanView(opt.view); setCanDownload(opt.dl); }}
                          className={`relative flex items-center gap-3 p-4 rounded-2xl text-left transition-all border-2 group ${
                            canView === opt.view && canDownload === opt.dl
                              ? "border-brand bg-brand/5 shadow-sm"
                              : "border-gray-100 bg-white hover:border-gray-200"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            canView === opt.view && canDownload === opt.dl ? "bg-brand text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                          }`}>
                            {opt.icon}
                          </div>
                          <span className={`font-bold text-sm ${canView === opt.view && canDownload === opt.dl ? "text-brand" : "text-gray-600"}`}>
                            {opt.label}
                          </span>
                          {canView === opt.view && canDownload === opt.dl && (
                             <div className="absolute top-3 right-3 text-brand">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                   <FiCheck size={16} />
                                </motion.div>
                             </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
                      Tùy chọn nâng cao
                    </label>
                    
                    <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
                      {/* Password */}
                      <div className="p-4 border-b border-gray-100 hover:bg-white/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${requirePassword ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"}`}>
                                 <FiLock size={16} />
                              </div>
                              <span className="text-sm font-semibold text-gray-700">Mật khẩu bảo vệ</span>
                           </div>
                           <button 
                              onClick={() => setRequirePassword(!requirePassword)}
                              className={`w-11 h-6 rounded-full transition-all relative ${requirePassword ? "bg-brand" : "bg-gray-200"}`}
                           >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${requirePassword ? "left-6" : "left-1"}`} />
                           </button>
                        </div>
                        <AnimatePresence>
                           {requirePassword && (
                              <motion.input
                                 initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                 animate={{ height: "auto", opacity: 1, marginTop: 8 }}
                                 exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                 type="password"
                                 placeholder="Nhập mật khẩu..."
                                 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand outline-none bg-white font-medium"
                                 value={password}
                                 onChange={(e) => setPassword(e.target.value)}
                              />
                           )}
                        </AnimatePresence>
                      </div>

                      {/* Max Downloads */}
                      <div className="p-4 hover:bg-white/50 transition-colors flex flex-col gap-2">
                         <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${maxDownloads ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-400"}`}>
                               <FiDownload size={16} />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 flex-1">Giới hạn lượt tải</span>
                         </div>
                         <input
                           type="number"
                           placeholder="Không giới hạn"
                           className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand outline-none bg-white font-medium text-gray-600"
                           value={maxDownloads}
                           onChange={(e) => setMaxDownloads(e.target.value)}
                         />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="analytics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Stats Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col items-center text-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                         <FiEye size={20} />
                      </div>
                      <div>
                         <p className="text-3xl font-black text-blue-600">{item.viewCount || 0}</p>
                         <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-1">Lượt xem</p>
                      </div>
                    </div>
                    <div className="p-5 bg-green-50/50 rounded-2xl border border-green-100 flex flex-col items-center text-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                         <FiDownload size={20} />
                      </div>
                      <div>
                         <p className="text-3xl font-black text-green-600">{item.downloadCount || 0}</p>
                         <p className="text-xs font-bold text-green-400 uppercase tracking-widest mt-1">Lượt tải</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500 text-sm leading-relaxed">
                    <FiInfo className="shrink-0 mt-0.5 text-brand" size={18} />
                    <p>Thống kê được cập nhật theo thời gian thực mỗi khi có người dùng truy cập hoặc tải xuống tệp tin qua liên kết công khai.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-5 sm:p-6 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm">
            {!shareUrl ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateShare}
                disabled={loading}
                className="w-full py-3.5 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/20 hover:shadow-brand/30 hover:opacity-95 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiLink size={20} />}
                <span>Tạo liên kết chia sẻ</span>
              </motion.button>
            ) : (
              <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-4"
              >
                <div className="p-1 bg-white rounded-2xl border border-brand/20 shadow-sm ring-4 ring-brand/5 flex items-center gap-2 pl-4 pr-1 py-1">
                   <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Liên kết chia sẻ</p>
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none truncate"
                      />
                   </div>
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={handleCopyLink}
                     className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all ${
                        copied ? "bg-green-500 text-white shadow-green-500/20" : "bg-brand text-white shadow-brand/20 hover:opacity-95"
                     }`}
                   >
                     {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
                     <span>{copied ? "Đã chép" : "Copy"}</span>
                   </motion.button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCreateShare}
                    disabled={loading}
                    className="flex-1 py-3 bg-brand text-white rounded-xl font-bold text-sm hover:opacity-95 transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
                  >
                    {loading ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                  <button
                    onClick={() => setShareUrl("")}
                    className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 hover:text-gray-900 transition-all"
                  >
                    Cài đặt lại
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-gray-900/10"
                  >
                    Hoàn tất
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
