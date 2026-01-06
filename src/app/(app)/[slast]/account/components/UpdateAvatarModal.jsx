"use client";
import React, { useState, useEffect, useRef } from "react";
import { FiX, FiUpload } from "react-icons/fi";
import { useTranslations } from "next-intl";
import Button from "@/shared/ui/button";

export default function UpdateAvatarModal({
  open,
  onClose,
  currentAvatar,
  onSubmit,
  loading = false,
}) {
  const t = useTranslations();
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setPreview(null);
      setFile(null);
    }
  }, [open]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    if (onSubmit) {
      try {
        await onSubmit(file);
        onClose();
      } catch (err) {
        // Error handling is done in parent
      }
    }
  };

  const handleClose = () => {
    setPreview(null);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative animate-fadeIn border border-gray-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
        >
          <FiX size={20} />
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold mb-2 text-gray-900 pr-8">
          {t("pages.account_settings.profile.update_avatar_title")}
        </h2>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4">
          {t("pages.account_settings.profile.update_avatar_desc")}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Label */}
          <label className="text-sm font-medium text-gray-700 mb-1.5">
            {t("pages.account_settings.profile.update_avatar_label")}
          </label>

          {/* Preview */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="Current avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <FiUpload size={24} className="text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className="inline-block px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {file
                  ? t("pages.account_settings.profile.change_image")
                  : t("pages.account_settings.profile.choose_image")}
              </label>
              {file && (
                <p className="text-xs text-gray-500 mt-1">{file.name}</p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end mt-4">
            <Button
              type="button"
              handleClick={handleClose}
              disabled={loading}
              variant="outline"
              color="brand"
            >
              {t("pages.account_settings.profile.cancel")}
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading || !file}
              color="brand"
            >
              {t("pages.account_settings.profile.update")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

