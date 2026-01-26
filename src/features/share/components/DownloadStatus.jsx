import React, { useEffect, useState, useRef } from "react";
import { FiCheck, FiX, FiDownload, FiFile, FiFolder } from "react-icons/fi";
import Image from "next/image";
import StatusCard from "@/shared/ui/StatusCard";
import { motion, AnimatePresence } from "framer-motion";

export default function DownloadStatus({
  files = [],
  folderName,
  onComplete,
  onCancel,
}) {
  const [fileStates, setFileStates] = useState(() =>
    files.map((f) => ({
      ...f,
      status: f.status || "pending",
      progress: f.progress || 0,
      error: f.error || null,
      loadedBytes: f.loadedBytes || 0, // ✅ Track actual bytes loaded
    }))
  );
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [eta, setEta] = useState(null); // Estimated time of arrival in seconds
  const [speed, setSpeed] = useState(0); // Download speed in bytes per second
  const downloadSpeedRef = useRef({ bytes: 0, time: 0, speeds: [] }); // ✅ Track speeds for averaging

  useEffect(() => {
    if (files && files.length > 0) {
      setFileStates(
        files.map((f) => ({
          ...f,
          status: f.status || "pending",
          progress: f.progress || 0,
          error: f.error || null,
          loadedBytes: f.loadedBytes || 0, // ✅ Include loadedBytes
        }))
      );
    }
  }, [files]);

  // Format ETA to human readable string
  const formatETA = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes < 60) return `${minutes}m ${secs}s`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format speed to human readable string
  const formatSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond || bytesPerSecond <= 0) return "0 B/s";
    const kb = bytesPerSecond / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB/s`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB/s`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB/s`;
  };

  // Calculate ETA based on current speed and remaining progress
  const calculateETA = (currentProgress, currentSpeed, totalSize) => {
    if (currentSpeed <= 0 || currentProgress >= 100 || !totalSize) return null;
    const remainingProgress = 100 - currentProgress;
    const remainingBytes = (remainingProgress / 100) * totalSize;
    const estimatedSeconds = remainingBytes / currentSpeed;
    return estimatedSeconds > 0 ? Math.round(estimatedSeconds) : null;
  };

  useEffect(() => {
    const calculateProgress = () => {
      if (fileStates.length === 0) return 0;
      // Ensure completed files always count as 100%
      const sum = fileStates.reduce((acc, f) => {
        const fileProgress = f.status === "success" ? 100 : f.progress || 0;
        return acc + fileProgress;
      }, 0);
      return Math.round(sum / fileStates.length);
    };

    const overallProgress = calculateProgress();
    setProgress(overallProgress);

    // ✅ FIX: Calculate download speed from actual bytes instead of progress %
    const downloadingFile = fileStates.find((f) => f.status === "downloading");
    if (
      downloadingFile &&
      downloadingFile.size &&
      downloadingFile.loadedBytes > 0
    ) {
      const now = Date.now();
      const currentBytes = downloadingFile.loadedBytes; // ✅ Use actual bytes

      if (!downloadSpeedRef.current.bytes || !downloadSpeedRef.current.time) {
        // Initialize
        downloadSpeedRef.current = { bytes: currentBytes, time: now, speeds: [] };
      } else {
        const timeDiff = (now - downloadSpeedRef.current.time) / 1000; // seconds
        if (timeDiff >= 1.0) {
          // ✅ Update every 1 second (was 0.5s)
          const bytesDiff = currentBytes - downloadSpeedRef.current.bytes;
          
          if (bytesDiff > 0) {
            const instantSpeed = bytesDiff / timeDiff;
            
            // ✅ Moving average: keep last 3 speeds for smoothing
            const speeds = [...downloadSpeedRef.current.speeds, instantSpeed];
            if (speeds.length > 3) speeds.shift(); // Keep only last 3
            
            const avgSpeed = speeds.reduce((sum, s) => sum + s, 0) / speeds.length;
            setSpeed(avgSpeed);
            
            downloadSpeedRef.current = { 
              bytes: currentBytes, 
              time: now, 
              speeds 
            };

            // Calculate ETA
            const etaSeconds = calculateETA(
              overallProgress,
              avgSpeed,
              downloadingFile.size
            );
            setEta(etaSeconds);
          }
        }
      }
    } else if (!downloadingFile) {
      // ✅ Reset when no downloading file
      setSpeed(0);
      setEta(null);
      downloadSpeedRef.current = { bytes: 0, time: 0, speeds: [] };
    }
  }, [fileStates]); // ✅ Only depend on fileStates, not speed (avoids infinite loop)

  useEffect(() => {
    const allDone = fileStates.every(
      (f) =>
        f.status === "success" ||
        f.status === "error" ||
        f.status === "cancelled"
    );
    if (allDone && fileStates.length > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [fileStates, onComplete]);

  if (!isVisible || !files || files.length === 0) return null;

  const allDone = fileStates.every(
    (f) =>
      f.status === "success" || f.status === "error" || f.status === "cancelled"
  );
  const hasErrors = fileStates.some((f) => f.status === "error");
  const hasCancelled = fileStates.some((f) => f.status === "cancelled");
  const isDownloading = !allDone && !hasCancelled && !hasErrors;

  // Determine card status for header styling
  let cardStatus = "pending";
  if (isDownloading) cardStatus = "downloading";
  else if (hasErrors) cardStatus = "error";
  else if (hasCancelled) cardStatus = "cancelled";
  else if (allDone) cardStatus = "success";

  return (
    <AnimatePresence>
      {isVisible && (
        <StatusCard
          title={
            isDownloading
              ? `Đang tải xuống... ${progress}%`
              : hasCancelled
              ? "Đã hủy tải xuống"
              : hasErrors
              ? "Tải xuống thất bại (có lỗi)"
              : "Tải xuống hoàn tất"
          }
          status={cardStatus}
          progress={progress}
          speed={formatSpeed(speed)}
          eta={formatETA(eta)}
          headerIcon={<FiDownload size={18} />}
          headerColor="text-brand"
        >
          <div className="space-y-2 mt-1">
             {folderName && (
               <div className="flex items-center gap-2 text-xs mb-2 pb-2 border-b border-gray-50">
                   <div className="p-1.5 rounded bg-yellow-100/50 text-yellow-600">
                      <FiFolder size={14}/>
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-gray-700">{folderName}</p>
                   </div>
               </div>
             )}
             
             {fileStates.map((f, idx) => (
               <div key={idx} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="p-1.5 rounded bg-blue-50 text-blue-600 shrink-0">
                     <FiFile size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between">
                         <p className={`truncate text-xs font-medium ${
                             f.status === 'success' ? 'text-green-600' :
                             f.status === 'error' ? 'text-red-600' :
                             'text-gray-700'
                         }`}>
                             {f.name}
                         </p>
                     </div>
                     <div className="flex items-center justify-between mt-0.5">
                         <p className="text-[10px] text-gray-400">
                             {f.status === 'success' ? 'Hoàn tất' :
                              f.status === 'error' ? 'Thất bại' :
                              f.status === 'downloading' ? 'Đang tải...' :
                              f.status === 'cancelled' ? 'Đã hủy' :
                              'Đang chờ...'}
                         </p>
                         {f.status !== 'success' && f.status !== 'error' && f.status !== 'cancelled' ? (
                             <div className="relative w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                                 <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full" style={{width: `${f.progress || 0}%`}}></div>
                             </div>
                         ) : null}
                     </div>
                     {f.error && <p className="text-[10px] text-red-600 mt-1 bg-red-50 p-1 rounded truncate" title={f.error}>{f.error}</p>}
                  </div>
                  
                  <div className="shrink-0 flex items-center">
                      {(f.status === "downloading" || f.status === "pending") && onCancel && (
                           <button
                             onClick={() => onCancel(f.id || f.name)}
                             className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                             title="Hủy"
                           >
                             <FiX size={14} />
                           </button>
                      )}
                      {f.status === "success" && <FiCheck className="text-green-500" size={14} />}
                      {f.status === "error" && <FiX className="text-red-500" size={14} />}
                      {f.status === "cancelled" && <FiX className="text-gray-400" size={14} />}
                  </div>
               </div>
             ))}
          </div>
        </StatusCard>
      )}
    </AnimatePresence>
  );
}
