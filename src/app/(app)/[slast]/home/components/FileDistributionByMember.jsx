"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTranslations } from "next-intl";
import Skeleton from "react-loading-skeleton";

const COLORS = [
  "#189df2",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

export function FileDistributionByMember({ data, loading }) {
  const t = useTranslations();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="font-semibold text-gray-900 mb-3 text-base">
          Phân bố File theo Member
        </div>
        <Skeleton height={200} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="font-semibold text-gray-900 mb-3 text-base">
          Phân bố File theo Member
        </div>
        <div className="text-sm text-gray-500 text-center py-8">
          Chưa có dữ liệu
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {payload[0].payload.member}
          </p>
          <p className="text-xs text-gray-600">Số file: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="font-semibold text-gray-900 mb-3 text-base">
        Phân bố File theo Member
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#6b7280" }}
          />
          <YAxis
            dataKey="member"
            type="category"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#6b7280" }}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
