"use client";
import React, { useEffect, useState, useRef } from "react";
import Modal from "@/shared/ui/Modal";
import { useTranslations } from "next-intl";

export default function RenameModal({ isOpen, onClose, item, onRename }) {
  const t = useTranslations("file.context");
  const tCommon = useTranslations("file.button");
  const [name, setName] = useState("");
  const [ext, setExt] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && item) {
      const currentName = item.name || item.originalName || "";
      if (item.type === "file") {
        const lastDot = currentName.lastIndexOf(".");
        if (lastDot !== -1) {
          setName(currentName.slice(0, lastDot));
          setExt(currentName.slice(lastDot));
        } else {
          setName(currentName);
          setExt("");
        }
      } else {
        setName(currentName);
        setExt("");
      }
      
      // Auto focus and select text
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const finalName = item.type === "file" ? name.trim() + ext : name.trim();
    if (finalName !== (item.name || item.originalName)) {
      onRename(item.id || item._id, item.type, finalName);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <h3 className="text-lg font-bold text-gray-800">
            {t("rename") || "Đổi tên"}
          </h3>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex flex-col gap-1">
             <label className="text-sm font-medium text-gray-700">Name</label>
             <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                    placeholder="Enter new name"
                />
                {ext && (
                    <span className="text-gray-500 font-medium px-2 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        {ext}
                    </span>
                )}
             </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
            >
              {tCommon("cancel") || "Hủy"}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-brand text-white hover:bg-brand-600 rounded-lg shadow-sm shadow-brand/30 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tCommon("create") || "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
