"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosClient from "@/shared/lib/axiosClient";
import creditsService from "@/shared/services/creditsService";
import toast from "react-hot-toast";
import { FiCreditCard, FiCheckCircle, FiLoader } from "react-icons/fi";

const CREDITS_PACKAGES = [
  { credits: 1000, price: 50000, popular: false },
  { credits: 2500, price: 100000, popular: true },
  { credits: 5000, price: 180000, popular: false },
  { credits: 10000, price: 320000, popular: false },
  { credits: 20000, price: 600000, popular: false },
];

export default function CreditsPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axiosClient.get("/api/user");
      if (res?.data) {
        setUser(res.data);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg) => {
    if (purchasing) return;

    setSelectedPackage(pkg);
    setPurchasing(true);

    try {
      // For now, just add credits directly
      // In production, you would integrate with payment gateway
      const res = await creditsService.purchaseCredits(pkg.price, pkg.credits);
      
      if (res.success) {
        toast.success(`Đã mua thành công ${pkg.credits.toLocaleString()} credits!`);
        await fetchUser(); // Refresh user data
        setSelectedPackage(null);
      } else {
        toast.error(res.error || "Mua credits thất bại");
      }
    } catch (error) {
      console.error("Error purchasing credits:", error);
      toast.error(
        error.response?.data?.error || "Có lỗi xảy ra khi mua credits"
      );
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FiLoader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Mua Credits
          </h1>
          <p className="text-gray-600">
            Credits của bạn:{" "}
            <span className="font-semibold text-primary">
              {(user?.credis || 0).toLocaleString()} credits
            </span>
          </p>
        </div>

        {/* Development Notice */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center mb-8">
          <FiTool className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Tính năng đang phát triển
          </h2>
          <p className="text-gray-600 mb-4">
            Tính năng mua credits đang được phát triển và sẽ sớm được tích hợp với VNPay.
          </p>
          <p className="text-sm text-gray-500">
            Vui lòng quay lại sau để sử dụng tính năng này.
          </p>
        </div>

        {/* Disabled Packages Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-50 pointer-events-none">
          {CREDITS_PACKAGES.map((pkg, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-lg border-2 p-6 ${
                pkg.popular
                  ? "border-primary shadow-lg"
                  : "border-gray-200"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Phổ biến
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {pkg.credits.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">credits</div>
              </div>

              <div className="text-center mb-6">
                <div className="text-2xl font-bold text-primary mb-1">
                  {pkg.price.toLocaleString()}₫
                </div>
                <div className="text-xs text-gray-500">
                  {(pkg.price / pkg.credits).toFixed(0)}₫/credit
                </div>
              </div>

              <button
                disabled
                className={`w-full py-2.5 rounded-lg font-medium ${
                  pkg.popular
                    ? "bg-gray-300 text-gray-600"
                    : "bg-gray-100 text-gray-600"
                } cursor-not-allowed flex items-center justify-center gap-2`}
              >
                <FiCreditCard className="w-4 h-4" />
                <span>Mua ngay</span>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Cách sử dụng Credits
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <FiCheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Trích xuất phụ đề:</strong> 1 credit mỗi lần sử dụng
              </span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Hard sub:</strong> 1 credit mỗi lần sử dụng
              </span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Lồng tiếng:</strong> 1 credit cho mỗi 100 ký tự (tối thiểu
                1 credit)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>
                Credits được reset mỗi tháng theo gói của bạn
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

