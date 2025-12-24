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
      <div className="mb-6 p-5 rounded-xl bg-white border border-border shadow-card">
        <div className="font-semibold text-text-strong mb-3 text-base tracking-wide">
          Phân bố File theo Member
        </div>
        <Skeleton height={200} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="mb-6 p-5 rounded-xl bg-white border border-border shadow-card">
        <div className="font-semibold text-text-strong mb-3 text-base tracking-wide">
          Phân bố File theo Member
        </div>
        <div className="text-sm text-text-muted text-center py-8">
          Chưa có dữ liệu
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-border rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-text-strong mb-1">
            {payload[0].payload.member}
          </p>
          <p className="text-xs text-text-muted">
            Số file: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mb-6 p-5 rounded-xl bg-white border border-border shadow-card">
      <div className="font-semibold text-text-strong mb-3 text-base tracking-wide">
        Phân bố File theo Member
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            type="number"
            stroke="var(--color-text-muted)"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            dataKey="member"
            type="category"
            stroke="var(--color-text-muted)"
            style={{ fontSize: "12px" }}
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

