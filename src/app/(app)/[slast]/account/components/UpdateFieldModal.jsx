"use client";
import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { useTranslations } from "next-intl";
import Button from "@/shared/ui/button";

export default function UpdateFieldModal({
  open,
  onClose,
  title,
  description,
  label,
  value: initialValue,
  type = "text",
  onSubmit,
  loading = false,
  placeholder,
  validation,
}) {
  const t = useTranslations();
  const [value, setValue] = useState(initialValue || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setValue(initialValue || "");
      setError("");
    }
  }, [open, initialValue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (validation) {
      const validationError = validation(value);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (onSubmit) {
      try {
        await onSubmit(value);
        onClose();
      } catch (err) {
        setError(err?.message || t("pages.account_settings.profile.update_failed"));
      }
    }
  };

  const handleClose = () => {
    setValue(initialValue || "");
    setError("");
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
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Label */}
          <label className="text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>

          {/* Input */}
          <input
            type={type}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            placeholder={placeholder}
            disabled={loading}
            className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed ${
              error ? "border-red-300" : "border-gray-300"
            }`}
            autoFocus
          />

          {/* Error Message */}
          {error && (
            <div className="text-red-500 text-sm mt-1.5">{error}</div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 justify-end mt-6">
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
              disabled={loading}
              color="brand"
            >
              {t("pages.account_settings.profile.update") || "Update"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

