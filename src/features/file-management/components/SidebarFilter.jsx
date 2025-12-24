import { getFileIcon } from "@/shared/utils/getFileIcon";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  FiLayers,
  FiLink,
  FiUser,
  FiX,
  FiArrowUp,
  FiStar,
} from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import { extMap } from "@/shared/utils/extMap";

export default function SidebarFilter({
  isMobile,
  open,
  onClose,
  loading,
  filter,
  onChangeFilter,
  members,
  hideMemberFilter = false,
}) {
  const t = useTranslations();

  const fileTypes = Object.keys(extMap).map((ext) => ({
    key: ext,
    label: ext.toUpperCase(),
  }));

  if (isMobile && !open) return null;
  return (
    <>
      {/* Overlay - Show on both mobile and desktop when open */}
      {open && onClose && (
        <div
          className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed right-0 top-0 h-screen w-[270px] bg-white border-l border-border flex flex-col px-0 py-6 gap-2 z-50 overflow-y-auto overflow-x-hidden sidebar-scrollbar transition-all duration-300 ease-in-out transform ${
          isMobile
            ? open
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0 pointer-events-none"
            : open
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 pointer-events-none"
        }`}
        style={{
          borderTopLeftRadius: isMobile ? 16 : 0,
          borderBottomLeftRadius: isMobile ? 16 : 0,
          boxShadow: isMobile || open ? "0 0 20px rgba(0,0,0,0.1)" : "none",
        }}
      >
        {/* Close button - Show on both mobile and desktop when onClose is provided */}
        {onClose && (
          <button
            className="absolute top-4 right-4 text-text-muted hover:text-brand text-2xl z-10 transition-all duration-200 hover:scale-110 active:scale-95"
            onClick={onClose}
            aria-label={t("file.sidebar.close_filter")}
          >
            <FiX />
          </button>
        )}
        <div className="px-4 mb-2 mt-2">
          <div className="flex items-center gap-2 text-text-strong font-bold text-[14px] mb-1">
            <FiLayers className="text-brand text-lg" />
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
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg font-medium text-text-strong group text-[13px] ${
                    filter.type === "all"
                      ? "bg-brand-50 border border-brand-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, type: "all" })}
                >
                  {t("file.sidebar.all")}
                  <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
                </li>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg text-text-strong group text-[13px] ${
                    filter.type === "file"
                      ? "bg-brand-50 border border-brand-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, type: "file" })}
                >
                  {t("file.sidebar.file")}
                  <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
                </li>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg text-text-strong group text-[13px] ${
                    filter.type === "folder"
                      ? "bg-brand-50 border border-brand-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, type: "folder" })}
                >
                  {t("file.sidebar.folder")}
                  <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
                </li>
              </>
            )}
          </ul>
        </div>
        {!hideMemberFilter && (
          <div className="px-4 mb-2">
            <div className="flex items-center gap-2 text-text-strong font-bold text-[14px] mb-1">
              <FiUser className="text-brand text-lg" />
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
                    className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg font-medium text-text-strong group text-[13px] ${
                      !filter.memberId
                        ? "bg-brand-50 border border-brand-400 font-bold"
                        : ""
                    }`}
                    onClick={() =>
                      onChangeFilter({ ...filter, memberId: null })
                    }
                  >
                    {t("file.sidebar.all")}
                    <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
                  </li>
                  {members &&
                    members.map((m) => (
                      <li
                        key={m._id || m.id}
                        className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg text-text-strong group text-[13px] ${
                          filter.memberId === (m._id || m.id)
                            ? "bg-brand-50 border border-brand-400 font-bold"
                            : ""
                        }`}
                        onClick={() =>
                          onChangeFilter({ ...filter, memberId: m._id || m.id })
                        }
                      >
                        {m.fullName || m.name || m.email || m.username}
                        <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
                      </li>
                    ))}
                </>
              )}
            </ul>
          </div>
        )}
        {/* Sắp xếp */}
        <div className="px-4 mb-2">
          <div className="flex items-center gap-2 text-text-strong font-bold text-[14px] mb-1">
            <FiArrowUp className="text-brand text-lg" />
            Sắp xếp
          </div>
          <ul className="flex flex-col gap-1 ml-2 mt-1">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 py-1.5 pl-4 pr-2"
                >
                  <Skeleton width={80} height={16} />
                </li>
              ))
            ) : (
              <>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg font-medium text-text-strong group text-[13px] ${
                    !filter.sortBy || filter.sortBy === "none"
                      ? "bg-brand-50 border border-brand-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, sortBy: "none" })}
                >
                  Mặc định
                  <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
                </li>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg text-text-strong group text-[13px] ${
                    filter.sortBy === "name"
                      ? "bg-brand-50 border border-brand-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, sortBy: "name" })}
                >
                  Theo tên
                  <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
                </li>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg text-text-strong group text-[13px] ${
                    filter.sortBy === "size"
                      ? "bg-brand-50 border border-brand-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, sortBy: "size" })}
                >
                  Theo kích thước
                  <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
                </li>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg text-text-strong group text-[13px] ${
                    filter.sortBy === "date"
                      ? "bg-brand-50 border border-brand-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, sortBy: "date" })}
                >
                  Theo ngày
                  <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Lọc yêu thích */}
        <div className="px-4 mb-2">
          <div className="flex items-center gap-2 text-text-strong font-bold text-[14px] mb-1">
            <FiStar className="text-brand text-lg" />
            Yêu thích
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
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg font-medium text-text-strong group text-[13px] ${
                    !filter.showFavorites
                      ? "bg-brand-50 border border-brand-400 font-bold"
                      : ""
                  }`}
                  onClick={() =>
                    onChangeFilter({ ...filter, showFavorites: false })
                  }
                >
                  {t("file.sidebar.all")}
                  <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
                </li>
                <li
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg text-text-strong group text-[13px] ${
                    filter.showFavorites
                      ? "bg-brand-50 border border-brand-400 font-bold"
                      : ""
                  }`}
                  onClick={() =>
                    onChangeFilter({ ...filter, showFavorites: true })
                  }
                >
                  Chỉ yêu thích
                  <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="px-4 mb-2">
          <div className="flex items-center gap-2 text-text-strong font-bold text-[14px] mb-1">
            <FiLink className="text-brand text-lg" />
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
                  className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg font-medium group text-[13px] ${
                    !filter.fileType || filter.fileType === "all"
                      ? "bg-brand-50 border border-brand-400 font-bold"
                      : ""
                  }`}
                  onClick={() => onChangeFilter({ ...filter, fileType: "all" })}
                >
                  <span className="font-medium text-text-strong">
                    {t("file.sidebar.all")}
                  </span>
                  <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
                </li>
                {fileTypes.map((type) => (
                  <li
                    key={type.key}
                    className={`flex items-center gap-2 py-1.5 pl-4 pr-2 cursor-pointer hover:bg-surface-50 rounded-lg group text-[13px] ${
                      filter.fileType === type.key
                        ? "bg-brand-50 border border-brand-400 font-bold"
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
                    <span className="font-medium text-text-strong">
                      {type.label}
                    </span>
                    <span className="w-2 h-2 bg-border rounded-full ml-auto group-hover:bg-brand transition" />
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
