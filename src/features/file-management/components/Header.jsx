"use client";
import {
  FiSearch,
  FiPlus,
  FiChevronDown,
  FiUpload,
  FiFolderPlus,
  FiGrid,
  FiList,
  FiLink,
} from "react-icons/fi";
import { BiSelectMultiple } from "react-icons/bi";

export default function FileManagerHeader({
  t,
  searchTerm,
  setSearchTerm,
  showUploadDropdown,
  setShowUploadDropdown,
  setShowUploadModal,
  setShowCreateFolderModal,
  setOpenImport,
  viewMode,
  setViewMode,
  areAllVisibleSelected,
  tableActions,
  foldersToShowFiltered,
  filesToShowFiltered,
  dedupeById,
}) {
  const allSelected = areAllVisibleSelected(
    tableActions?.selectedItems,
    foldersToShowFiltered,
    filesToShowFiltered
  );

  return (
    <div className="w-full max-w-2xl flex items-center gap-3 mb-6">
      <div className="flex-1 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">
          <FiSearch />
        </span>
        <input
          type="text"
          placeholder={t("file.search.placeholder")}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-white shadow-sm border border-border focus:outline-none focus:ring-2 focus:ring-brand text-[15px] text-text-strong placeholder:text-text-muted/60"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="relative">
        <button
          className="flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-card transition-all text-[15px] bg-brand text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-brand"
          onClick={() => setShowUploadDropdown(!showUploadDropdown)}
        >
          <FiPlus className="text-lg" />
          {t("file.button.upload")}
          <FiChevronDown
            className={`text-sm transition-transform ${
              showUploadDropdown ? "rotate-180" : ""
            }`}
          />
        </button>

        {showUploadDropdown && (
          <div className="absolute top-full right-0 left-auto mt-1 w-64 max-w-[90vw] bg-white rounded-lg shadow-card border border-border z-50">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-50 transition-colors rounded-t-lg"
              onClick={() => {
                setShowUploadModal(true);
                setShowUploadDropdown(false);
              }}
            >
              <FiUpload className="text-text-muted" />
              <span className="text-text-strong">
                {t("file.button.upload_files_folders")}
              </span>
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-50 transition-colors"
              onClick={() => {
                setShowCreateFolderModal(true);
                setShowUploadDropdown(false);
              }}
            >
              <FiFolderPlus className="text-text-muted" />
              <span className="text-text-strong">
                {t("file.button.create_folder")}
              </span>
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-50 transition-colors rounded-b-lg"
              onClick={() => {
                setOpenImport(true);
                setShowUploadDropdown(false);
              }}
            >
              <FiLink className="text-text-muted" />
              <span className="text-text-strong">
                {t("file.button.import_link")}
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="hidden items-center gap-2 ml-2 bg-white rounded-xl px-2 py-1 shadow-sm border border-border lg:flex">
        <button
          className={`p-2 rounded-lg transition-all text-lg ${
            viewMode === "grid"
              ? "shadow"
              : "text-text-muted hover:bg-surface-50"
          }`}
          style={
            viewMode === "grid"
              ? {
                  background:
                    "color-mix(in srgb, var(--color-brand) 15%, transparent)",
                  color: "var(--color-brand)",
                }
              : undefined
          }
          onClick={() => setViewMode("grid")}
          aria-label={t("file.button.view_grid")}
        >
          <FiGrid />
        </button>
        <button
          className={`p-2 rounded-lg transition-all text-lg ${
            viewMode === "list"
              ? "shadow"
              : "text-text-muted hover:bg-surface-50"
          }`}
          style={
            viewMode === "list"
              ? {
                  background:
                    "color-mix(in srgb, var(--color-brand) 15%, transparent)",
                  color: "var(--color-brand)",
                }
              : undefined
          }
          onClick={() => setViewMode("list")}
          aria-label={t("file.button.view_list")}
        >
          <FiList />
        </button>
      </div>

      <div className="bg-white rounded-xl px-1 py-1 shadow-sm border border-border">
        <button
          aria-label={t("file.select_all")}
          title={
            allSelected ? t("file.deselect_all") : t("file.select_all_current")
          }
          className="p-2 rounded-lg transition focus:outline-none focus:ring-2"
          style={{
            color: allSelected
              ? "var(--color-danger-500)"
              : "var(--color-brand)",
            background: allSelected
              ? "color-mix(in srgb, var(--color-danger) 10%, transparent)"
              : undefined,
            boxShadow: allSelected ? "none" : undefined,
          }}
          onClick={() => {
            const allVisible = dedupeById([
              ...foldersToShowFiltered,
              ...filesToShowFiltered,
            ]);
            if (allSelected) {
              tableActions.setSelectedItems([]);
            } else {
              tableActions.setSelectedItems(allVisible);
            }
          }}
        >
          <BiSelectMultiple />
        </button>
      </div>
    </div>
  );
}
