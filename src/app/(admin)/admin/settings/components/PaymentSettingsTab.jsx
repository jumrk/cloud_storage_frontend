"use client";
import React, { useState } from "react";
import { FiSave, FiLoader, FiEye, FiEyeOff } from "react-icons/fi";

export default function PaymentSettingsTab({
  settings,
  setSettings,
  loading,
  onSave,
}) {
  const [showSecret, setShowSecret] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave();
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1.5">
          Cài đặt thanh toán (VNPay)
        </h2>
        <p className="text-gray-500 text-xs">
          Cấu hình kết nối cổng thanh toán VNPay cho hệ thống.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Enable VNPay */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <label className="text-sm font-medium text-gray-900">
              Bật thanh toán VNPay
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Cho phép người dùng thanh toán qua cổng VNPay
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.vnpayEnabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  vnpayEnabled: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {settings.vnpayEnabled && (
          <>
            {/* TMN Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã website (TMN Code) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.vnpayTmnCode}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    vnpayTmnCode: e.target.value,
                  })
                }
                placeholder="Ví dụ: 2QXUI4J4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Hash Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secret Key (Hash Secret) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={settings.vnpayHashSecret}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      vnpayHashSecret: e.target.value,
                    })
                  }
                  placeholder={
                    settings.vnpayHashSecret ? "***************" : "Nhập secret key..."
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showSecret ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Để giữ nguyên, hãy để trống hoặc giữ giá trị mã hóa hiện tại.
              </p>
            </div>

            {/* VNPay URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VNPay Gateway URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.vnpayUrl}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    vnpayUrl: e.target.value,
                  })
                }
                placeholder="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Return URL và IPN URL được tự động tạo từ backend (API_PUBLIC_ORIGIN).
              </p>
            </div>
          </>
        )}

        {/* Save Button */}
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
