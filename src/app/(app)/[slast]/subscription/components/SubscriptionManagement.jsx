"use client";
import React, { useEffect, useState, useMemo } from "react";
import PlanList from "@/features/plans/components/PlanList";
import inforUserService from "../../account/services/inforUserService";
import { usePendingOrder } from "@/features/plans/hooks";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

export default function SubscriptionManagement() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize service with useMemo to prevent hook order changes
  const { getInforUser } = useMemo(() => inforUserService(), []);
  const {
    hasPendingOrder,
    pendingOrder,
    loading: pendingLoading,
  } = usePendingOrder();

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await getInforUser();
      const data = res.data;
      setUser(data);
    } catch (error) {
      console.error("Fetch user error:", error);
      toast.error("Không thể tải thông tin người dùng");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Tính số ngày còn lại trước khi hết hạn
  const daysUntilExpiry = React.useMemo(() => {
    if (!user?.planEndDate) return null;
    const now = new Date();
    const endDate = new Date(user.planEndDate);
    if (endDate <= now) return 0; // Đã hết hạn
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [user?.planEndDate]);

  // Kiểm tra xem có cần cảnh báo không (còn <= 3 ngày)
  const shouldShowExpiryWarning =
    daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry > 0;

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className=" mx-auto px-4 py-8 custom-scrollbar h-full">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/${user?.slast}/account`}
          className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 mb-4"
        >
          <FiArrowLeft /> Quay lại
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Quản lý gói dịch vụ
        </h1>
        <p className="text-gray-600">Chọn gói phù hợp với nhu cầu của bạn</p>
      </div>

      {/* Current Plan Info */}
      {user && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Gói hiện tại
              </h3>
              <p className="text-gray-600 capitalize">
                {user?.plan?.name || "Free"}
              </p>
              {daysUntilExpiry !== null && (
                <p className="text-sm text-gray-500 mt-1">
                  {daysUntilExpiry > 0
                    ? `Còn ${daysUntilExpiry} ngày hết hạn`
                    : "Đã hết hạn"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cảnh báo hết hạn gói */}
      {shouldShowExpiryWarning && (
        <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Gói của bạn sắp hết hạn
              </h3>
              <p className="text-sm text-gray-600">
                Gói hiện tại của bạn sẽ hết hạn sau{" "}
                <span className="font-semibold text-warning">
                  {daysUntilExpiry} {daysUntilExpiry === 1 ? "ngày" : "ngày"}
                </span>
                . Vui lòng gia hạn để tiếp tục sử dụng dịch vụ.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plans List - isLoggedIn=true vì user đang ở trang subscription = đã đăng nhập */}
      <PlanList
        currentPlanSlug={user?.plan?.slug || ""}
        daysUntilExpiry={daysUntilExpiry}
        userRole={user?.role}
        isLoggedIn={!!user}
      />
    </div>
  );
}
