import React from "react";
import { FiDatabase, FiHardDrive } from "react-icons/fi";
import { useTranslations } from "next-intl";

const StorageUsage = ({ stats, loading }) => {
  const t = useTranslations();

  if (loading) {
    return (
      <div className="px-4 py-4 mb-4 bg-gray-50 rounded-xl animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
        <div className="h-2 w-full bg-gray-200 rounded-full mb-2"></div>
        <div className="h-3 w-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!stats) return null;

  const { storage, formattedStorage } = stats;
  const { usedPercent = 0 } = storage || {};

  // Color based on usage percentage
  let barColor = "bg-brand";
  if (usedPercent > 90) barColor = "bg-red-500";
  else if (usedPercent > 70) barColor = "bg-orange-500";

  return (
    <div className="px-4 py-4 mb-4 mx-2 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-900 font-bold text-[14px]">
          <FiHardDrive className="text-brand text-lg" />
          {t("file.sidebar.storage") || "Dung lượng"}
        </div>
        <span className="text-[12px] font-semibold text-gray-500">
          {usedPercent}%
        </span>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${barColor} transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(100, usedPercent)}%` }}
        ></div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-[12px] text-gray-600 flex justify-between">
          <span>{formattedStorage?.used || "0 Bytes"}</span>
          <span>{formattedStorage?.total || "10 GB"}</span>
        </div>
        {storage?.trasedSize > 0 && (
          <div className="text-[11px] text-gray-400 italic">
            {t("file.sidebar.trash_info", { size: formattedStorage?.trashed }) || `Thùng rác: ${formattedStorage?.trashed}`}
          </div>
        )}
      </div>

      <button
        onClick={() => (window.location.href = "/pricing")}
        className="mt-3 w-full py-1.5 px-3 bg-brand/10 text-brand text-[12px] font-bold rounded-lg hover:bg-brand hover:text-white transition-colors border border-brand/20"
      >
        {t("file.sidebar.upgrade") || "Nâng cấp bộ nhớ"}
      </button>
    </div>
  );
};

export default StorageUsage;
