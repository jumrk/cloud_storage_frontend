"use client";
import React, { useState, useEffect } from "react";
import PlanPurchaseModal from "./PlanPurchaseModal";
import axiosClient from "@/lib/axiosClient";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { PLAN_ICONS } from "./admin/planIcons";
import { getCustomPlanPrice } from "@/utils/planUtils";
import { formatSize } from "@/utils/driveUtils";
import { FaUser, FaHdd } from "react-icons/fa";

const PLAN_COLORS = [
  "#4abad9",
  "#fbbf24",
  "#a78bfa",
  "#f87171",
  "#34d399",
  "#f472b6",
];

export default function PlanList() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [custom, setCustom] = useState({
    storage: 20,
    users: 20,
    cycle: "month",
  });
  const [customError, setCustomError] = useState("");

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

  const handleChoosePlan = (plan) => {
    if (plan.isCustom) {
      // Validate custom input
      if (!Number.isInteger(Number(custom.storage)) || custom.storage < 20) {
        setCustomError("Dung lượng tối thiểu 20TB, số nguyên");
        return;
      }
      if (!Number.isInteger(Number(custom.users)) || custom.users < 20) {
        setCustomError("Số người dùng tối thiểu 20, số nguyên");
        return;
      }
      setCustomError("");
      const customPlanPrice = getCustomPlanPrice(custom.storage);
      setSelectedPlan({
        ...plan,
        isCustom: true,
        customStorage: Number(custom.storage),
        customUsers: Number(custom.users),
        customPriceMonth: customPlanPrice.month,
        customPriceYear: customPlanPrice.year,
        priceMonth: customPlanPrice.month,
        priceYear: customPlanPrice.year,
        cycle: custom.cycle,
      });
      setModalOpen(true);
      return;
    }
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPlan(null);
  };

  const handleSubmit = (info) => {
    alert(
      `Đăng ký gói: ${info.plan.name}\nHọ tên: ${info.fullName}\nEmail: ${info.email}\nSĐT: ${info.phone}`
    );
    setModalOpen(false);
    setSelectedPlan(null);
  };

  return (
    <>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3  gap-6 mb-6 px-2 sm:px-0">
          {Array.from({ length: 3 }).map((_, idx) => (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6 px-2 sm:px-0">
          {plans.map((plan, idx) => {
            const color = PLAN_COLORS[idx % PLAN_COLORS.length];
            const Icon =
              PLAN_ICONS[plan.icon] || PLAN_ICONS[Object.keys(PLAN_ICONS)[0]];
            // Card giống nhau cho mọi gói, chỉ khác giá trị hiển thị nếu là custom
            return (
              <div
                key={plan._id || idx}
                className={`relative bg-white rounded-2xl shadow p-7 flex flex-col min-w-[240px] max-w-xs mx-auto md:mx-0 transition group
                  ${
                    plan.featured
                      ? "border-l-2 border-r-2 border-b-2 border-[#1cadd9] border-t-0 rounded-b-2xl"
                      : "border-2 border-gray-200"
                  }`}
                style={{ boxShadow: `0 4px 24px 0 ${color}22` }}
              >
                {/* Top border effect */}
                <div
                  className="absolute left-0 top-0 w-full h-2 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{ background: color, zIndex: 10 }}
                />
                {/* Ribbon Ưu chuộng nhất */}
                {plan.featured && (
                  <div className="absolute left-0 right-0 top-0 z-20">
                    <div className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs py-2 rounded-t-2xl font-semibold shadow-lg border-b-2 border-blue-300 flex items-center justify-center">
                      Ưu chuộng nhất
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
                      ? "Tùy chọn"
                      : plan.priceMonth === 0
                      ? "Miễn phí"
                      : plan.priceMonth?.toLocaleString("vi-VN") + "₫"}
                  </span>
                  <span className="text-base font-normal text-gray-500">
                    /tháng
                  </span>
                </div>
                {/* Giá năm + sale */}
                <div className="mb-2 text-center flex items-center justify-center gap-2">
                  <span className="text-sm text-gray-700">Năm:</span>
                  <span className="font-semibold text-gray-900">
                    {plan.isCustom
                      ? "Tùy chọn"
                      : plan.priceYear === 0
                      ? "Miễn phí"
                      : plan.priceYear?.toLocaleString("vi-VN") + "₫"}
                  </span>
                  {plan.sale > 0 && !plan.isCustom && (
                    <span className="bg-[#1cadd9] text-white text-xs px-2 py-0.5 rounded ml-1">
                      Tiết kiệm {plan.sale}%
                    </span>
                  )}
                </div>
                {/* Số user + dung lượng */}
                <div className="flex justify-center gap-4 mb-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <FaUser className="inline-block text-base align-middle" />{" "}
                    {plan.isCustom ? "Tùy chọn" : plan.users + " người dùng"}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaHdd className="inline-block text-base align-middle" />{" "}
                    {plan.isCustom
                      ? "Tùy chọn"
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
                          {"✔️"}
                        </span>
                        <span>{desc}</span>
                      </li>
                    ))}
                </ul>
                <button
                  className="rounded-md py-2 font-semibold transition border-2 border-[#1cadd9] text-white bg-[#1cadd9] hover:bg-[#189bc2] hover:shadow-lg w-full text-center"
                  onClick={() => handleChoosePlan(plan)}
                >
                  Chọn gói này
                </button>
              </div>
            );
          })}
        </div>
      )}
      {/* PlanPurchaseModal now handles its own close button and mobile layout */}
      <PlanPurchaseModal
        open={modalOpen}
        onClose={handleCloseModal}
        selectedPlan={selectedPlan}
        onSubmit={handleSubmit}
      />
    </>
  );
}
