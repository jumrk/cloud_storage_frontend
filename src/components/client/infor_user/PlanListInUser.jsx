import React, { useState, useEffect } from "react";
import axiosClient from "@/lib/axiosClient";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function PlanListInUser({
  currentPlanName,
  isExpiring,
  isExpired,
  onRenew,
  onChoose,
  currentPlanStorage,
}) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get("/api/admin/plans", {
          params: { limit: 100 },
        });
        if (res.data && res.data.success) {
          setPlans(res.data.data);
        } else {
          setPlans([]);
        }
      } catch (e) {
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div className="mt-10">
      <div className="font-bold text-lg mb-4">Các gói dịch vụ</div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6 px-2 sm:px-0">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-[#1cadd9] rounded-xl shadow p-6 flex flex-col min-w-[220px] max-w-xs mx-auto md:mx-0 relative"
            >
              <div className="flex items-center justify-center mb-2">
                <Skeleton circle width={32} height={32} className="mr-2" />
                <Skeleton width={80} height={24} />
              </div>
              <div className="mb-2 text-gray-700 text-sm">
                <Skeleton width={120} height={16} />
              </div>
              <div className="mb-2 text-gray-700 text-sm">
                <Skeleton width={80} height={16} />
              </div>
              <div className="mb-4">
                <Skeleton width={100} height={28} />
              </div>
              <div className="mb-2 text-gray-700 text-sm flex items-center gap-2">
                <Skeleton width={120} height={16} />
              </div>
              <ul className="flex-1 space-y-2 mb-6 text-gray-700 text-sm mt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <li key={i}>
                    <Skeleton width={120} height={14} />
                  </li>
                ))}
              </ul>
              <Skeleton width={120} height={36} style={{ borderRadius: 8 }} />
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center text-gray-400 py-12 px-2">
          Không có gói dịch vụ nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6 px-2 sm:px-0">
          {plans.map((plan, idx) => {
            const isCurrent = plan.name === currentPlanName;
            const isLower =
              currentPlanStorage && plan.storage < currentPlanStorage;
            const canDowngrade = isExpiring || isExpired;
            return (
              <div
                key={plan._id || idx}
                className="bg-white border-2 border-[#1cadd9] rounded-xl shadow p-6 flex flex-col min-w-[220px] max-w-xs mx-auto md:mx-0 relative"
              >
                <div className="flex items-center justify-center mb-2">
                  <span className="text-3xl mr-2">{plan.icon}</span>
                  <span className="font-bold text-xl">{plan.name}</span>
                </div>
                <div className="mb-2 text-gray-700 text-sm">
                  Dung lượng:{" "}
                  <span className="font-semibold">
                    {plan.storage
                      ? typeof plan.storage === "number"
                        ? (plan.storage / (1024 * 1024 * 1024)).toFixed(1) +
                          " GB"
                        : plan.storage
                      : "-"}
                  </span>
                </div>
                <div className="mb-2 text-gray-700 text-sm">
                  Người dùng:{" "}
                  <span className="font-semibold">{plan.users}</span>
                </div>
                <div className="mb-4">
                  <span className="text-2xl font-bold">
                    {plan.priceMonth === 0
                      ? "Miễn phí"
                      : plan.priceMonth.toLocaleString("vi-VN") + "₫"}
                  </span>
                  <span className="text-base font-normal">/tháng</span>
                </div>
                <div className="mb-2 text-gray-700 text-sm flex items-center gap-2">
                  <span>1 năm:</span>
                  <span className="font-semibold">
                    {plan.priceYear === 0
                      ? "Miễn phí"
                      : plan.priceYear.toLocaleString("vi-VN") + "₫"}
                  </span>
                </div>
                <ul className="flex-1 space-y-2 mb-6 text-gray-700 text-sm mt-2">
                  {plan.features &&
                    plan.features.map((f, i) => <li key={i}>✔️ {f}</li>)}
                </ul>
                {isCurrent ? (
                  isExpiring ? (
                    <button
                      className="rounded-md py-2 font-semibold transition bg-yellow-500 text-white hover:bg-yellow-600"
                      onClick={() => onRenew && onRenew(plan)}
                    >
                      Gia hạn
                    </button>
                  ) : (
                    <button
                      className="rounded-md py-2 font-semibold transition bg-gray-300 text-gray-500 cursor-not-allowed"
                      disabled
                    >
                      Đang sử dụng
                    </button>
                  )
                ) : isLower ? (
                  canDowngrade ? (
                    <button
                      className="rounded-md py-2 font-semibold transition bg-[#1cadd9] text-white hover:bg-[#189bc2]"
                      onClick={() => onChoose && onChoose(plan, "downgrade")}
                    >
                      Chọn gói này
                    </button>
                  ) : (
                    <button
                      className="rounded-md py-2 font-semibold transition bg-gray-300 text-gray-500 cursor-not-allowed"
                      disabled
                      title="Chỉ được hạ cấp khi gói sắp hết hạn hoặc đã hết hạn"
                    >
                      Không thể hạ cấp
                    </button>
                  )
                ) : (
                  <button
                    className="rounded-md py-2 font-semibold transition bg-[#1cadd9] text-white hover:bg-[#189bc2]"
                    onClick={() => onChoose && onChoose(plan, "upgrade")}
                  >
                    Chọn gói này
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
