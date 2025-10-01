import { getFileIcon } from "@/utils/getFileIcon";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { FiLayers, FiLink, FiUser, FiX } from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import { extMap } from "@/components/client/file_management/extMap";

export default function SidebarFilter({
  isMobile,
  open,
  onClose,
  loading,
  filter,
  onChangeFilter,
  members,
}) {
  const t = useTranslations();

  const fileTypes = Object.keys(extMap).map((ext) => ({
    key: ext,
    label: ext.toUpperCase(),
  }));

  if (isMobile && !open) return null;
  return (
    <>
      {isMobile && (
        <div
          className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed right-0 top-0 h-screen w-[270px] bg-white border-l border-gray-100 flex flex-col px-0 py-6 gap-2 z-50 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out transform ${
          isMobile
            ? open
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0"
            : "lg:translate-x-0 lg:opacity-100 hidden lg:flex"
        }`}
        style={{
          borderTopLeftRadius: isMobile ? 16 : 0,
          borderBottomLeftRadius: isMobile ? 16 : 0,
          boxShadow: isMobile ? "0 0 20px rgba(0,0,0,0.1)" : "none",
        }}
      >
        {isMobile && (
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-primary text-2xl z-10 transition-all duration-200 hover:scale-110 active:scale-95"
            onClick={onClose}
            aria-label={t("file.sidebar.close_filter")}
          >
            <FiX />
          </button>
        )}
        <div className="px-4 mb-2 mt-2">
          <div className="flex items-center gap-2 text-gray-700 font-bold text-[14px] mb-1">
            <FiLayers className="text-primary text-lg" />
            {t("file.sidebar.type")}
          </div>
          <ul className="flex flex-col gap-1 ml-2 mt-1">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 py-1.5 pl-4 pr-2"
                >
                  <Skeleton width={60} height={16} />
                </li>
              ))
            ) : (
              <>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg font-medium text-gray-800 group text-[13px] ${
                    filter.type === "all"
                      ? "bg-blue-100 border border-blue-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, type: "all" })}
                >
                  {t("file.sidebar.all")}
                  <span className="w-2 h-2 bg-gray-300 rounded-full ml-auto group-hover:bg-primary transition" />
                </li>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg text-gray-700 group text-[13px] ${
                    filter.type === "file"
                      ? "bg-blue-100 border border-blue-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, type: "file" })}
                >
                  {t("file.sidebar.file")}
                  <span className="w-2 h-2 bg-gray-300 rounded-full ml-auto group-hover:bg-primary transition" />
                </li>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg text-gray-700 group text-[13px] ${
                    filter.type === "folder"
                      ? "bg-blue-100 border border-blue-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, type: "folder" })}
                >
                  {t("file.sidebar.folder")}
                  <span className="w-2 h-2 bg-gray-300 rounded-full ml-auto group-hover:bg-primary transition" />
                </li>
              </>
            )}
          </ul>
        </div>
        <div className="px-4 mb-2">
          <div className="flex items-center gap-2 text-gray-700 font-bold text-[14px] mb-1">
            <FiUser className="text-primary text-lg" />
            {t("file.sidebar.account")}
          </div>
          <ul className="flex flex-col gap-1 ml-2 mt-1">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 py-1.5 pl-4 pr-2"
                >
                  <Skeleton width={60} height={16} />
                </li>
              ))
            ) : (
              <>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg font-medium text-gray-800 group text-[13px] ${
                    !filter.memberId
                      ? "bg-blue-100 border border-blue-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, memberId: null })}
                >
                  {t("file.sidebar.all")}
                  <span className="w-2 h-2 bg-gray-300 rounded-full ml-auto group-hover:bg-primary transition" />
                </li>
                {members &&
                  members.map((m) => (
                    <li
                      key={m._id || m.id}
                      className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg text-gray-700 group text-[13px] ${
                        filter.memberId === (m._id || m.id)
                          ? "bg-blue-100 border border-blue-400 font-bold"
                          : ""
                      }`}
                      onClick={() =>
                        onChangeFilter({ ...filter, memberId: m._id || m.id })
                      }
                    >
                      {m.fullName || m.name || m.email || m.username}
                      <span className="w-2 h-2 bg-gray-300 rounded-full ml-auto group-hover:bg-primary transition" />
                    </li>
                  ))}
              </>
            )}
          </ul>
        </div>
        <div className="px-4 mb-2">
          <div className="flex items-center gap-2 text-gray-700 font-bold text-[14px] mb-1">
            <FiLink className="text-primary text-lg" />
            {t("file.sidebar.file_types")}
          </div>
          <ul className="flex flex-col gap-1 ml-2 mt-1">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 py-1.5 pl-4 pr-2"
                >
                  <Skeleton width={100} height={16} />
                </li>
              ))
            ) : (
              <>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg font-medium group text-[13px] ${
                    !filter.fileType || filter.fileType === "all"
                      ? "bg-blue-100 border border-blue-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, fileType: "all" })}
                >
                  <span className="font-medium">{t("file.sidebar.all")}</span>
                  <span className="w-2 h-2 bg-gray-300 rounded-full ml-auto group-hover:bg-primary transition" />
                </li>
                {fileTypes.map((type) => (
                  <li
                    key={type.key}
                    className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-white rounded-lg group text-[13px] ${
                      filter.fileType === type.key
                        ? "bg-blue-100 border border-blue-400 font-bold"
                        : ""
                    }`}
                    onClick={() =>
                      onChangeFilter({ ...filter, fileType: type.key })
                    }
                  >
                    <Image
                      src={getFileIcon({
                        type: type.key === "folder" ? "folder" : "file",
                        name: `file.${type.key}`,
                      })}
                      alt={type.label}
                      className="w-5 h-5 object-contain"
                      width={20}
                      height={20}
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,..."
                      priority
                    />
                    <span className="font-medium">{type.label}</span>
                    <span className="w-2 h-2 bg-gray-300 rounded-full ml-auto group-hover:bg-primary transition" />
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      </aside>
    </>
  );
}
