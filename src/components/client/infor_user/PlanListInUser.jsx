import React, { useState, useEffect } from "react";
import axiosClient from "@/lib/axiosClient";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { PLAN_ICONS } from "@/components/admin/planIcons";
import { getCustomPlanPrice } from "@/utils/planUtils";
import { formatSize } from "@/utils/driveUtils";
import { FaUser, FaHdd } from "react-icons/fa";
import { useTranslations } from "next-intl";

const PLAN_COLORS = [
  "#4abad9",
  "#fbbf24",
  "#a78bfa",
  "#f87171",
  "#34d399",
  "#f472b6",
];

export default function PlanListInUser({
  currentPlanName,
  isExpiring,
  isExpired,
  onRenew,
  onChoose,
  currentPlanStorage,
  user, // nhận thêm prop user
}) {
  const t = useTranslations();
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

  // Tính số ngày còn lại của gói cũ
  const now = new Date();
  let daysLeft = 0;
  if (user?.planEndDate) {
    const end = new Date(user.planEndDate);
    daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }
  return (
    <div className="mt-10">
      <div className="font-bold text-lg mb-4">
        {t("plan_list_in_user.title")}
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6 px-2 sm:px-0">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-[#1cadd9] rounded-xl shadow p-6 flex flex-col w-[90%] md:max-w-xs mx-auto md:mx-0 relative"
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
          {t("plan_list_in_user.no_plans")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6 px-2 sm:px-0">
          {plans.map((plan, idx) => {
            const color = PLAN_COLORS[idx % PLAN_COLORS.length];
            const Icon =
              PLAN_ICONS[plan.icon] || PLAN_ICONS[Object.keys(PLAN_ICONS)[0]];
            const isCurrent = plan.name === currentPlanName;
            const isLower =
              currentPlanStorage && plan.storage < currentPlanStorage;
            const canDowngrade = isExpiring || isExpired;
            // Nếu user đang dùng custom plan, ẩn/disable nút chọn cho các gói nhỏ hơn
            const isCustomCurrent =
              currentPlanName === "Gói Tùy chọn" ||
              currentPlanName === "Custom" ||
              currentPlanName?.toLowerCase().includes("tùy chọn");
            const isPlanSmallerThanCustom =
              isCustomCurrent &&
              daysLeft > 0 && // chỉ disable khi còn ngày
              ((plan.storage && plan.storage < currentPlanStorage) ||
                (plan.users && plan.users < (user?.maxUser || 0)));
            return (
              <div
                key={plan._id || idx}
                className={`relative bg-white rounded-2xl shadow p-7 flex flex-col w-[90%] md:max-w-xs mx-auto md:mx-0 transition group
                  ${
                    plan.featured
                      ? "border-l-2 border-r-2 border-b-2 border-[#1cadd9] border-t-0 rounded-b-2xl"
                      : "border-2 border-gray-200"
                  }
                  ${
                    isCurrent && !plan.featured
                      ? "border-[#1cadd9] shadow-lg"
                      : ""
                  }`}
                style={{ boxShadow: `0 4px 24px 0 ${color}22` }}
              >
                {/* Top border effect */}
                <div
                  className={`absolute left-0 top-0 w-full h-2 rounded-t-2xl transition-all duration-300 ${
                    isCurrent
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                  style={{ background: color, zIndex: 10 }}
                />
                {/* Ribbon Ưu chuộng nhất */}
                {plan.featured && (
                  <div className="absolute left-0 right-0 top-0 z-20">
                    <div className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs py-2 rounded-t-2xl font-semibold shadow-lg border-b-2 border-blue-300 flex items-center justify-center">
                      {t("plan_list_in_user.featured")}
                    </div>
                  </div>
                )}
                {/* Icon + tên */}
                <div className="flex flex-col items-center mb-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-2 border-4"
                    style={{ borderColor: color, background: `${color}10` }}
                  >
                    <Icon className="w-8 h-8" style={{ color }} />
                  </div>
                  <span className="font-bold text-xl text-gray-900 mb-1">
                    {plan.name}
                  </span>
                </div>
                {/* Giá tháng */}
                <div className="mb-2 text-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {plan.isCustom
                      ? t("plan_list_in_user.custom")
                      : plan.priceMonth === 0
                      ? t("plan_list_in_user.free")
                      : plan.priceMonth?.toLocaleString("vi-VN") + "₫"}
                  </span>
                  <span className="text-base font-normal text-gray-500">
                    {t("plan_list_in_user.per_month")}
                  </span>
                </div>
                {/* Giá năm + sale */}
                <div className="mb-2 text-center flex items-center justify-center gap-2">
                  <span className="text-sm text-gray-700">
                    {t("plan_list_in_user.year")}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {plan.isCustom
                      ? t("plan_list_in_user.custom")
                      : plan.priceYear === 0
                      ? t("plan_list_in_user.free")
                      : plan.priceYear?.toLocaleString("vi-VN") + "₫"}
                  </span>
                  {plan.sale > 0 && !plan.isCustom && (
                    <span className="bg-[#1cadd9] text-white text-xs px-2 py-0.5 rounded ml-1">
                      {t("plan_list_in_user.save", { sale: plan.sale })}
                    </span>
                  )}
                </div>
                {/* Số user + dung lượng */}
                <div className="flex justify-center gap-4 mb-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <FaUser className="inline-block text-base align-middle" />{" "}
                    {plan.isCustom
                      ? t("plan_list_in_user.custom")
                      : t("plan_list_in_user.users", { users: plan.users })}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaHdd className="inline-block text-base align-middle" />{" "}
                    {plan.isCustom
                      ? t("plan_list_in_user.custom")
                      : plan.storage
                      ? formatSize(plan.storage)
                      : "-"}
                  </span>
                </div>
                {/* Description list */}
                <ul className="flex-1 space-y-2 mb-6 text-gray-700 text-sm mt-2">
                  {Array.isArray(plan.description) &&
                    plan.description.map((desc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5" style={{ color }}>
                          ✔️
                        </span>
                        <span>{desc}</span>
                      </li>
                    ))}
                </ul>
                {isCurrent ? (
                  isExpiring || isExpired ? (
                    <button
                      className="rounded-md py-2 font-semibold transition border-2 border-[#1cadd9] text-[#1cadd9] bg-white hover:bg-[#1cadd9] hover:text-white hover:shadow-lg w-full text-center"
                      onClick={() => onRenew && onRenew(plan)}
                    >
                      {t("plan_list_in_user.renew")}
                    </button>
                  ) : (
                    <button
                      className="rounded-md py-2 font-semibold transition bg-gray-300 text-gray-500 border-2 border-gray-300 cursor-not-allowed w-full text-center"
                      disabled
                    >
                      {t("plan_list_in_user.currently_using")}
                    </button>
                  )
                ) : isPlanSmallerThanCustom ? (
                  <button
                    className="rounded-md py-2 font-semibold transition bg-gray-300 text-gray-500 border-2 border-gray-300 cursor-not-allowed w-full text-center"
                    disabled
                    title={t("plan_list_in_user.cannot_buy_smaller_tooltip")}
                  >
                    {t("plan_list_in_user.cannot_buy_smaller")}
                  </button>
                ) : isLower ? (
                  canDowngrade ? (
                    <button
                      className="rounded-md py-2 font-semibold transition border-2 border-[#1cadd9] text-[#1cadd9] bg-white hover:bg-[#1cadd9] hover:text-white hover:shadow-lg w-full text-center"
                      onClick={() => onChoose && onChoose(plan, "downgrade")}
                    >
                      {t("plan_list_in_user.choose_this_plan")}
                    </button>
                  ) : (
                    <button
                      className="rounded-md py-2 font-semibold transition bg-gray-300 text-gray-500 border-2 border-gray-300 cursor-not-allowed w-full text-center"
                      disabled
                      title={t("plan_list_in_user.cannot_downgrade_tooltip")}
                    >
                      {t("plan_list_in_user.cannot_downgrade")}
                    </button>
                  )
                ) : (
                  <button
                    className="rounded-md py-2 font-semibold transition border-2 border-[#1cadd9] text-white bg-[#1cadd9] hover:bg-[#189bc2] hover:shadow-lg w-full text-center"
                    onClick={() => onChoose && onChoose(plan, "upgrade")}
                  >
                    {t("plan_list_in_user.choose_this_plan")}
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
