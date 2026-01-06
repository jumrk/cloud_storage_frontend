"use client";
import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import axiosClient from "@/shared/lib/axiosClient";
function formatPrice(price) {
  if (!price) return "0₫";
  return price.toLocaleString("vi-VN") + "₫";
}
const FILTERS = [
  { label: "Tháng", value: "month" },
  { label: "Tuần", value: "week" },
  { label: "Năm", value: "year" },
];
export default function OverviewTab({ stats = {}, loading }) {
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [filter, setFilter] = useState("month");
  useEffect(() => {
    setChartLoading(true);
    axiosClient
      .get("/api/admin/orders", { params: { chart: 1, period: filter } })
      .then((res) => {
        const data = res.data;
        if (data.success) {
          setChartData(data.data);
        } else {
          setChartData([]);
        }
      })
      .catch(() => setChartData([]))
      .finally(() => setChartLoading(false));
  }, [filter]);
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-6 flex flex-col items-center"
            >
              <Skeleton width={60} height={28} />
              <Skeleton width={80} height={18} className="mt-2" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton width={140} height={24} />
            <Skeleton width={80} height={24} />
          </div>
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
            <Skeleton width={320} height={32} />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 shadow-lg px-4 py-5 flex flex-col items-center rounded-xl transition-all">
          <div className="text-xs text-gray-600 mb-1 font-semibold">
            Tổng doanh thu
          </div>
          <div className="text-2xl font-extrabold text-green-700 drop-shadow">
            {formatPrice(stats.totalPaidAmount || 0)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 shadow-lg px-4 py-5 flex flex-col items-center rounded-xl transition-all">
          <div className="text-xs text-gray-600 mb-1 font-semibold">
            Đang xử lý
          </div>
          <div className="text-2xl font-extrabold text-yellow-600 drop-shadow">
            {stats.totalPending || 0} đơn
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-lg px-4 py-5 flex flex-col items-center rounded-xl transition-all">
          <div className="text-xs text-gray-600 mb-1 font-semibold">
            Tổng giao dịch
          </div>
          <div className="text-2xl font-extrabold text-blue-700 drop-shadow">
            {stats.total || 0}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 shadow-lg px-4 py-5 flex flex-col items-center rounded-xl transition-all">
          <div className="text-xs text-gray-600 mb-1 font-semibold">
            Đơn hoàn thành
          </div>
          <div className="text-2xl font-extrabold text-purple-600 drop-shadow">
            {stats.totalPaid || 0} đơn
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Biểu đồ doanh thu</h3>
          <select
            className="text-xs bg-gray-100 rounded px-2 py-1 outline-none border border-gray-200 hover:border-gray-300 cursor-pointer"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        {chartLoading ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
            Đang tải biểu đồ...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="#f1f3f4" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 13 }} />
              <YAxis tick={{ fontSize: 13 }} tickFormatter={formatPrice} />
              <Tooltip formatter={(value) => formatPrice(value)} />
              <Bar dataKey="totalAmount" fill="#1cadd9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
