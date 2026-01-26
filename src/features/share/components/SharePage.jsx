"use client";
import React, { useEffect } from "react";
import {
  FiCopy,
  FiFolder,
  FiFile,
  FiChevronRight,
  FiDownload,
  FiChevronDown,
  FiLock,
  FiLink,
  FiLoader,
} from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import DownloadStatus from "./DownloadStatus";
import useSharePage from "../hooks/useSharePage";

import { motion, AnimatePresence } from "framer-motion";

export default function SharePage() {
  const {
    item,
    error,
    loading,
    copied,
    breadcrumb,
    downloadingId,
    downloadBatch,
    formatSize,
    fetchShareInfo,
    handleEnterFolder,
    handleBreadcrumbClick,
    copyShareLink,
    handleDownload,
    handleDownloadUrl,
    clearDownloadBatch,
    passwordRequired,
    sharePassword,
    setSharePassword,
    passwordError,
    submitSharePassword,
  } = useSharePage();
  const [showDownloadMenu, setShowDownloadMenu] = React.useState(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDownloadMenu && !event.target.closest(".relative")) {
        setShowDownloadMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDownloadMenu]);

  useEffect(() => {
    fetchShareInfo();
  }, [fetchShareInfo]);

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center bg-gray-50 md:p-8">
        <div className="w-full max-w-4xl bg-white md:rounded-3xl md:shadow-sm md:border md:border-gray-100 p-6 md:p-10 flex flex-col items-center gap-8 animate-pulse">
           <div className="w-20 h-20 rounded-2xl bg-gray-100 mb-2" />
           <div className="space-y-3 w-full max-w-md flex flex-col items-center">
              <div className="h-8 bg-gray-100 rounded-lg w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
           </div>
           
           <div className="w-full mt-8 space-y-6">
              <div className="h-6 bg-gray-100 rounded w-1/4" />
              <div className="space-y-0 divide-y divide-gray-100">
                {[1, 2, 3].map((i) => (
                   <div key={i} className="py-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-gray-100" />
                      <div className="flex-1 space-y-2">
                         <div className="h-4 bg-gray-100 rounded w-1/3" />
                      </div>
                   </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    );

  if (passwordRequired)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 max-w-lg w-full flex flex-col gap-8"
        >
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
               <FiLock size={28} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Protected Content</h2>
            <p className="text-gray-500">This link requires a password to access.</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <input
                type="password"
                className="w-full px-5 py-4 rounded-xl border border-gray-200 text-lg focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all placeholder:text-gray-400"
                placeholder="Enter password"
                value={sharePassword}
                onChange={(e) => setSharePassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitSharePassword()}
                autoFocus
              />
            </div>
            {passwordError && (
              <div className="text-red-500 font-medium flex items-center gap-2 justify-center">
                 <FiLock size={16} /> {passwordError}
              </div>
            )}
            <button
              className="w-full px-6 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all active:scale-[0.99] disabled:opacity-50"
              onClick={submitSharePassword}
              disabled={!sharePassword}
            >
              Access Content
            </button>
          </div>
        </motion.div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
             <FiFile className="text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Unable to access</h2>
          <p className="text-gray-500 mb-8 text-lg">{error}</p>
          <button 
             onClick={() => window.location.reload()}
             className="px-8 py-3 bg-white border border-gray-200 text-gray-900 font-semibold rounded-full hover:bg-gray-50 transition-colors"
          >
             Reload Page
          </button>
        </div>
      </div>
    );

  if (!item) return null;

  const ext = item.name.split(".").pop().toLowerCase();

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 font-sans md:py-10">
      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, ease: "easeOut" }}
         className="w-full max-w-5xl bg-white md:rounded-[32px] md:shadow-sm md:border md:border-gray-100/50 p-6 md:p-12 flex flex-col items-center gap-8 min-h-[calc(100vh-80px)] md:min-h-fit"
      >
        {/* Breadcrumb - Clean & Simple */}
        {item.type === "folder" && breadcrumb.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center justify-center text-sm w-full mb-4">
            {breadcrumb.map((b, idx) => (
              <React.Fragment key={b.id}>
                {idx > 0 && <span className="text-gray-300">/</span>}
                <button
                  className={`transition-colors ${
                    idx === breadcrumb.length - 1
                      ? "text-gray-900 font-semibold cursor-default"
                      : "text-gray-500 hover:text-blue-600"
                  }`}
                  onClick={() => idx !== breadcrumb.length - 1 && handleBreadcrumbClick(idx)}
                  disabled={idx === breadcrumb.length - 1}
                >
                  {b.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col items-center gap-6 text-center max-w-2xl">
          <div className="w-24 h-24 rounded-[28px] bg-gradient-to-tr from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center shadow-inner">
             {item.type === "folder" ? (
               <FiFolder className="text-5xl" />
             ) : (
               <FiFile className="text-5xl" />
             )}
          </div>

          <div className="space-y-4">
             <h1 className="text-3xl md:text-4xl font-bold text-gray-900 break-words tracking-tight leading-tight">
               {item.name}
             </h1>
             <div className="flex items-center justify-center gap-3 text-sm text-gray-500 font-medium">
                <span>{formatSize(item.size)}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>{item.type === "folder" ? "Folder" : (item.mimeType || ext).toUpperCase()}</span>
             </div>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2">
             <button
                className="h-12 px-6 rounded-full border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
                onClick={copyShareLink}
             >
                {copied ? <FiCheck className="text-green-600" /> : <FiCopy />}
                <span>{copied ? "Copied" : "Copy Link"}</span>
             </button>

             {item.type === "file" ? (
                item.canDownload ? (
                   <div className="relative z-20">
                      <button
                         className="h-12 px-8 bg-black text-white rounded-full font-bold hover:opacity-80 transition-all flex items-center gap-2 shadow-lg shadow-gray-200"
                         onClick={() => setShowDownloadMenu(showDownloadMenu === item.id ? null : item.id)}
                         disabled={downloadingId === item.id}
                      >
                         {downloadingId === item.id ? <FiLoader className="animate-spin" /> : <FiDownload />}
                         <span>Download</span>
                         <FiChevronDown className={`transition-transform duration-200 ${showDownloadMenu === item.id ? "rotate-180" : ""}`} />
                      </button>
                      
                      <AnimatePresence>
                         {showDownloadMenu === item.id && (
                            <motion.div
                               initial={{ opacity: 0, y: 8, scale: 0.96 }}
                               animate={{ opacity: 1, y: 0, scale: 1 }}
                               exit={{ opacity: 0, y: 8, scale: 0.96 }}
                               className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 p-1.5"
                            >
                               <button
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-gray-700 font-medium transition-colors"
                                  onClick={() => { handleDownload(item); setShowDownloadMenu(null); }}
                               >
                                  <FiDownload className="text-gray-400" /> Direct Download
                               </button>
                               <button
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-gray-700 font-medium transition-colors"
                                  onClick={() => { handleDownloadUrl(item); setShowDownloadMenu(null); }}
                               >
                                  <FiLink className="text-gray-400" /> Download via URL
                               </button>
                            </motion.div>
                         )}
                      </AnimatePresence>
                   </div>
                ) : (
                   <div className="h-12 px-6 bg-gray-100 text-gray-500 rounded-full font-medium flex items-center gap-2 cursor-not-allowed">
                      <FiLock /> View Only
                   </div>
                )
             ) : (
                item.canDownload && (
                   <button
                      className="h-12 px-8 bg-black text-white rounded-full font-bold hover:opacity-80 transition-all flex items-center gap-2 shadow-lg shadow-gray-200"
                      onClick={() => handleDownload(item)}
                      disabled={downloadingId === item.id}
                   >
                      {downloadingId === item.id ? <FiLoader className="animate-spin" /> : <FiDownload />}
                      <span>Download All</span>
                   </button>
                )
             )}
          </div>
        </div>

        {/* Folder Content List */}
        {item.type === "folder" && (
           <div className="w-full mt-8 max-w-4xl">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                 <h3 className="font-bold text-gray-900 text-lg">Files</h3>
                 <span className="text-sm text-gray-500 font-medium">{formatSize(item.size)} total</span>
              </div>
              
              <div className="flex flex-col">
                 {/* Empty State */}
                 {(!item.children?.folders?.length && !item.children?.files?.length) && (
                    <div className="py-20 text-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                       <p>This folder is empty</p>
                    </div>
                 )}

                 {/* Folders */}
                 {item.children?.folders?.map((f) => (
                    <div
                      key={f.id}
                      className="group flex items-center gap-4 py-4 px-3 md:px-4 border-b border-gray-50 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                      onClick={() => handleEnterFolder(f)}
                    >
                       <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                          <FiFolder size={20} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{f.name}</h4>
                          <span className="text-xs text-gray-400 font-medium">Folder</span>
                       </div>
                       <FiChevronRight className="text-gray-300 group-hover:text-gray-500" />
                    </div>
                 ))}

                 {/* Files */}
                 {item.children?.files?.map((f) => (
                    <div
                      key={f.id}
                      className="group flex items-center gap-4 py-4 px-3 md:px-4 border-b border-gray-50 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                       <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center shrink-0">
                          <FiFile size={20} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{f.name}</h4>
                          <span className="text-xs text-gray-400 font-medium">{formatSize(f.size)}</span>
                       </div>
                       
                       {item.canDownload && (
                          <div className="relative">
                             <button
                               className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200 transition-all"
                               onClick={() => setShowDownloadMenu(showDownloadMenu === f.id ? null : f.id)}
                            >
                               {downloadingId === f.id ? <FiLoader className="animate-spin" /> : <FiDownload />}
                            </button>

                             <AnimatePresence>
                               {showDownloadMenu === f.id && (
                                 <motion.div 
                                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                    className="absolute top-1/2 right-full mr-2 transform -translate-y-1/2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 p-1"
                                 >
                                    <button
                                       className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded-lg flex items-center gap-2 text-sm text-gray-700 font-medium"
                                       onClick={() => { handleDownload(f); setShowDownloadMenu(null); }}
                                    >
                                       <FiDownload size={14} className="text-gray-400" /> Direct
                                    </button>
                                    <button
                                       className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded-lg flex items-center gap-2 text-sm text-gray-700 font-medium"
                                       onClick={() => { handleDownloadUrl(f); setShowDownloadMenu(null); }}
                                    >
                                       <FiLink size={14} className="text-gray-400" /> Link
                                    </button>
                                 </motion.div>
                               )}
                             </AnimatePresence>
                          </div>
                       )}
                    </div>
                 ))}
              </div>
           </div>
        )}

        <div className="mt-auto md:mt-10 py-6 text-center text-xs text-gray-300 font-medium uppercase tracking-wider">
           Securely shared via D2MBox
        </div>
      </motion.div>

      {/* DownloadStatus - đã có animation riêng */}
      {downloadBatch && (
        <DownloadStatus
          files={downloadBatch.files}
          folderName={downloadBatch.folderName}
          onComplete={clearDownloadBatch}
        />
      )}
    </div>
  );
}
