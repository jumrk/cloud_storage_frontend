import { useTranslations } from "next-intl";
import Skeleton from "react-loading-skeleton";
import { StoragePieChart } from "./StoragePieChart";
import { FileTypeRatio } from "./FileTypeRatio";
import { formatSize } from "@/utils/driveUtils";

export function RightSidebar({ overview, fileTypes, loading }) {
  const t = useTranslations();

  if (loading) {
    return (
      <aside className="bg-white border-l border-gray-100 px-4 md:px-6 py-8 h-screen sticky top-0 flex flex-col overflow-y-auto w-full md:max-w-[300px] md:min-w-[220px] md:block">
        <div className="mb-6 p-5 rounded-xl bg-[#f7f8fa] border border-gray-100 shadow-sm">
          <Skeleton width={100} height={24} className="mb-3" />
          <div className="flex justify-center">
            <Skeleton circle width={112} height={112} />
          </div>
        </div>
        <div className="mb-6 p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
          <Skeleton width={100} height={20} className="mb-3" />
          <Skeleton width={180} height={16} className="mb-2" />
          <Skeleton width={180} height={16} />
        </div>
        <div className="mb-6 p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
          <Skeleton width={100} height={20} className="mb-3" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 text-sm mb-2">
              <Skeleton width={32} height={16} />
              <Skeleton width={120} height={12} />
              <Skeleton width={40} height={12} />
            </div>
          ))}
        </div>
        <div className="mb-2 p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
          <Skeleton width={120} height={20} className="mb-3" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <Skeleton width={60} height={12} />
                <Skeleton width={40} height={18} />
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="bg-white border-l border-gray-100 px-4 md:px-6 py-8 h-screen sticky top-0 flex flex-col overflow-y-auto w-full md:max-w-[300px] md:min-w-[220px] md:block">
      <div className="mb-6 p-5 rounded-xl bg-[#f7f8fa] border border-gray-100 shadow-sm">
        <div className="font-semibold text-gray-700 mb-3 text-lg tracking-wide">
          {t("home.sidebar.overview")}
        </div>
        <StoragePieChart used={overview.usedNum} total={overview.totalNum} />
      </div>
      <div className="mb-6 p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
        <div className="font-semibold text-gray-700 mb-3 text-base tracking-wide">
          {t("home.sidebar.total_storage")}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-500">{t("home.sidebar.used")}</span>
            <span className="font-semibold text-[#1cadd9]">
              {formatSize(overview.usedNum)}
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-500">
              {t("home.sidebar.total_storage")}
            </span>
            <span className="font-semibold">
              {formatSize(overview.totalNum)}
            </span>
          </div>
        </div>
      </div>
      <div className="mb-6 p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
        <div className="font-semibold text-gray-700 mb-3 text-base tracking-wide">
          {t("home.sidebar.file_ratio")}
        </div>
        <FileTypeRatio types={fileTypes} />
      </div>
      <div className="mb-2 p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
        <div className="font-semibold text-gray-700 mb-3 text-base tracking-wide">
          {t("home.sidebar.account_info")}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-400">
              {t("home.sidebar.total_files")}
            </span>
            <span className="font-bold text-base text-gray-800">
              {overview.totalFiles}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-400">{t("home.sidebar.used")}</span>
            <span className="font-bold text-base text-gray-800">
              {formatSize(overview.usedNum)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-400">
              {t("home.sidebar.sub_accounts")}
            </span>
            <span className="font-bold text-base text-gray-800">
              {overview.subAccounts}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-400">{t("home.sidebar.remain")}</span>
            <span className="font-bold text-base text-gray-800">
              {formatSize(Math.max(0, overview.totalNum - overview.usedNum))}
            </span>
          </div>
          <div className="col-span-2 flex flex-col gap-0.5 mt-2">
            <span className="text-gray-400">{t("home.sidebar.plan")}</span>
            <span className="font-bold text-base text-gray-800">
              {overview.plan}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
