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
import Popover from "@/shared/ui/Popover";
import SearchSuggestions from "./SearchSuggestions";
import { useState, useEffect, useRef, useMemo } from "react";
import FileManagementService from "../services/fileManagementService";

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
  isMember = false,
  currentFolderId = null,
  onNavigateToFile,
  onNavigateToFolder,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const api = useMemo(() => FileManagementService(), []);
  // ✅ No need for token - cookie sent automatically

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await api.getSearchSuggestions(searchTerm);
        if (res.success) {
          setSuggestions(res.suggestions || []);
        }
      } catch (error) {
        console.error("Suggestions error:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, api]);

  const handleSelectSuggestion = (item) => {
    setShowSuggestions(false);
    if (item.type === "folder") {
      onNavigateToFolder && onNavigateToFolder(item);
    } else {
      onNavigateToFile && onNavigateToFile(item);
    }
  };

  // Member can only upload/create folder when inside a folder (currentFolderId !== null)
  const canUploadOrCreate = !isMember || currentFolderId !== null;
  const allSelected = areAllVisibleSelected(
    tableActions?.selectedItems,
    foldersToShowFiltered,
    filesToShowFiltered,
  );

  return (
    <div className="w-full flex items-center justify-between gap-2 md:gap-3 lg:gap-4 mb-4 md:mb-6">
      
      <div className="flex-1 max-w-md relative" ref={searchRef}>
        
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-lg">
          
          <FiSearch />
        </span>
        <input
          type="text"
          placeholder={t("file.search.placeholder")}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-white shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand text-[15px] text-gray-900 placeholder:text-gray-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
        />
        <SearchSuggestions 
          suggestions={suggestions} 
          loading={loadingSuggestions} 
          visible={showSuggestions}
          onSelect={handleSelectSuggestion}
        />
      </div>
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        
        <div className="relative">
          
          <button
            className={`flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-card transition-all text-[15px] ${canUploadOrCreate ? "bg-brand text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-brand" : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"}`}
            onClick={() =>
              canUploadOrCreate && setShowUploadDropdown(!showUploadDropdown)
            }
            disabled={!canUploadOrCreate}
            title={
              !canUploadOrCreate
                ? t("member.page.upload_restriction") ||
                  "Bạn cần vào trong một thư mục để tải lên"
                : ""
            }
          >
            
            <FiPlus className="text-lg" /> {t("file.button.upload")}
            <FiChevronDown
              className={`text-sm transition-transform ${showUploadDropdown ? "rotate-180" : ""}`}
            />
          </button>
          {showUploadDropdown && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowUploadDropdown(false)}
            />
          )}
          <Popover
            open={showUploadDropdown}
            className="right-0 left-auto w-64 max-w-[90vw]"
          >
            
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white transition-colors rounded-t-lg"
              onClick={() => {
                setShowUploadModal(true);
                setShowUploadDropdown(false);
              }}
            >
              
              <FiUpload className="text-gray-600" />
              <span className="text-gray-900">
                
                {t("file.button.upload_files_folders")}
              </span>
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white transition-colors"
              onClick={() => {
                setShowCreateFolderModal(true);
                setShowUploadDropdown(false);
              }}
            >
              
              <FiFolderPlus className="text-gray-600" />
              <span className="text-gray-900">
                
                {t("file.button.create_folder")}
              </span>
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white transition-colors rounded-b-lg"
              onClick={() => {
                setOpenImport(true);
                setShowUploadDropdown(false);
              }}
            >
              
              <FiLink className="text-gray-600" />
              <span className="text-gray-900">
                
                {t("file.button.import_link")}
              </span>
            </button>
          </Popover>
        </div>
        <div className="hidden items-center gap-2 bg-white rounded-xl px-2 py-1 shadow-sm border border-gray-200 lg:flex">
          
          <button
            className={`p-2 rounded-lg transition-all text-lg ${viewMode === "grid" ? "shadow" : "text-gray-600 hover:bg-white"}`}
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
            className={`p-2 rounded-lg transition-all text-lg ${viewMode === "list" ? "shadow" : "text-gray-600 hover:bg-white"}`}
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
        <div className="bg-white rounded-xl px-1 py-1 shadow-sm border border-gray-200">
          
          <button
            aria-label={t("file.select_all")}
            title={
              allSelected
                ? t("file.deselect_all")
                : t("file.select_all_current")
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
    </div>
  );
}
