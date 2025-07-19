"use client";
import React, { useState, useEffect } from "react";
import PlanPurchaseModal from "./PlanPurchaseModal";
import axiosClient from "@/lib/axiosClient";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { PLAN_ICONS } from "./admin/planIcons";

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
            const color = PLAN_COLORS[idx % PLAN_COLORS.length];
            const Icon =
              PLAN_ICONS[plan.icon] || PLAN_ICONS[Object.keys(PLAN_ICONS)[0]];
            return (
              <div
                key={plan._id || idx}
                className={`relative bg-white border-2 border-gray-200 hover:shadow-lg rounded-2xl shadow p-7 flex flex-col min-w-[240px] max-w-xs mx-auto md:mx-0 transition group`}
                style={{ boxShadow: `0 4px 24px 0 ${color}22` }}
              >
                {/* Top border effect */}
                <div
                  className="absolute left-0 top-0 w-full h-2 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{ background: color, zIndex: 10 }}
                />
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
                    {plan.priceMonth === 0
                      ? "Miễn phí"
                      : plan.priceMonth.toLocaleString("vi-VN") + "₫"}
                  </span>
                  <span className="text-base font-normal text-gray-500">
                    /tháng
                  </span>
                </div>
                {/* Giá năm + sale */}
                <div className="mb-2 text-center flex items-center justify-center gap-2">
                  <span className="text-sm text-gray-700">Năm:</span>
                  <span className="font-semibold text-gray-900">
                    {plan.priceYear === 0
                      ? "Miễn phí"
                      : plan.priceYear.toLocaleString("vi-VN") + "₫"}
                  </span>
                  {plan.sale > 0 && (
                    <span className="bg-[#1cadd9] text-white text-xs px-2 py-0.5 rounded ml-1">
                      Tiết kiệm {plan.sale}%
                    </span>
                  )}
                </div>
                {/* Số user + dung lượng */}
                <div className="flex justify-center gap-4 mb-2 text-xs text-gray-500">
                  <span>👤 {plan.users} người dùng</span>
                  <span>
                    💾{" "}
                    {plan.storage
                      ? typeof plan.storage === "number"
                        ? (plan.storage / (1024 * 1024 * 1024)).toFixed(1) +
                          " GB"
                        : plan.storage
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
