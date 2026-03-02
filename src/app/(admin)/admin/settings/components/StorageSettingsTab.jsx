"use client";
import React, { useState } from "react";
import { FiSave, FiLoader, FiHardDrive, FiCloud, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import storageSettingsService from "../services/storageSettingsService";

export default function StorageSettingsTab({
  settings,
  setSettings,
  loading,
  onSave,
}) {
  const [checkingPath, setCheckingPath] = useState(false);
  const [pathCheckResult, setPathCheckResult] = useState(null); // { success, writable, error }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (settings.storageMode === "local" && !settings.localStorageRoot?.trim()) {
      toast.error("Khi dùng HDD nội bộ, vui lòng nhập đường dẫn thư mục gốc.");
      return;
    }
    await onSave();
  };

  const handleCheckWritable = async () => {
    const path = settings.localStorageRoot?.trim();
    if (!path) {
      toast.error("Vui lòng nhập đường dẫn thư mục trước.");
      return;
    }
    setCheckingPath(true);
    setPathCheckResult(null);
    try {
      const res = await storageSettingsService.checkWritable(path);
      setPathCheckResult({
        success: res.success && res.writable,
        writable: res.writable,
        error: res.error,
        message: res.message,
      });
      if (res.success && res.writable) {
        toast.success(res.message || "Thư mục có quyền ghi.");
      } else {
        toast.error(res.error || "Không thể ghi vào thư mục.");
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Lỗi kiểm tra";
      setPathCheckResult({ success: false, writable: false, error: msg });
      toast.error(msg);
    } finally {
      setCheckingPath(false);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1.5">
          Cài đặt lưu trữ upload
        </h2>
        <p className="text-gray-500 text-xs">
          Chọn nơi lưu file khi người dùng upload: Google Drive hoặc ổ HDD nội bộ (server).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Chế độ: Google Drive vs HDD */}
        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium text-gray-900">
            Chế độ lưu trữ
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="relative flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 border-gray-200 hover:border-gray-300 flex-1 min-w-[200px]">
              <input
                type="radio"
                name="storageMode"
                value="drive"
                checked={settings.storageMode === "drive"}
                onChange={() =>
                  setSettings({ ...settings, storageMode: "drive" })
                }
                className="sr-only"
              />
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
                <FiCloud className="text-xl" />
              </span>
              <div>
                <span className="block font-medium text-gray-900">Google Drive</span>
                <span className="text-xs text-gray-500">
                  File upload lên tài khoản Google Drive đã kết nối
                </span>
              </div>
            </label>
            <label className="relative flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 border-gray-200 hover:border-gray-300 flex-1 min-w-[200px]">
              <input
                type="radio"
                name="storageMode"
                value="local"
                checked={settings.storageMode === "local"}
                onChange={() =>
                  setSettings({ ...settings, storageMode: "local" })
                }
                className="sr-only"
              />
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-600">
                <FiHardDrive className="text-xl" />
              </span>
              <div>
                <span className="block font-medium text-gray-900">HDD nội bộ</span>
                <span className="text-xs text-gray-500">
                  File lưu trên ổ đĩa do bạn cấu hình (server)
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Chỉ hiện khi chọn HDD */}
        {settings.storageMode === "local" && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm font-medium text-gray-700">
              Cấu hình lưu trữ HDD nội bộ
            </p>

            {/* Đường dẫn thư mục gốc */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đường dẫn thư mục gốc (trên server) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.localStorageRoot}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      localStorageRoot: e.target.value,
                    })
                  }
                  placeholder="Ví dụ: D:\cloud_storage\files hoặc /mnt/storage/files"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleCheckWritable}
                  disabled={checkingPath || !settings.localStorageRoot?.trim()}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  {checkingPath ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <>
                      <FiCheckCircle className="text-green-600" />
                      Kiểm tra quyền ghi
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Đường dẫn tuyệt đối tới thư mục trên ổ HDD. Server cần quyền đọc/ghi. Windows: D:\cloud_storage\files — Linux: /mnt/storage/files
              </p>
              {pathCheckResult && (
                <div
                  className={`mt-2 flex items-center gap-2 text-sm ${
                    pathCheckResult.success ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {pathCheckResult.success ? (
                    <FiCheckCircle />
                  ) : (
                    <FiAlertCircle />
                  )}
                  <span>
                    {pathCheckResult.success
                      ? pathCheckResult.message
                      : pathCheckResult.error}
                  </span>
                </div>
              )}
            </div>

            {/* Cách chia thư mục con */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chia thư mục con
              </label>
              <select
                value={settings.localStorageShard}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    localStorageShard: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="none">Không chia (mọi file cùng thư mục gốc)</option>
                <option value="user">Theo user (mỗi user một thư mục)</option>
                <option value="date">Theo ngày (theo năm/tháng/ngày)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Giúp tránh một thư mục chứa quá nhiều file, dễ backup và quản lý.
              </p>
            </div>
          </div>
        )}

        {/* Save */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <FiSave />
                <span>Lưu cài đặt</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
