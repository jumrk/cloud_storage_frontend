"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
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
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

export function FileDistributionByType({ data, loading }) {
  const t = useTranslations();

  if (loading) {
    return (
      <div className="mb-6 p-5 rounded-xl bg-white border border-border shadow-card">
        <div className="font-semibold text-text-strong mb-3 text-base tracking-wide">
          Phân bố File theo Loại
        </div>
        <Skeleton height={200} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="mb-6 p-5 rounded-xl bg-white border border-border shadow-card">
        <div className="font-semibold text-text-strong mb-3 text-base tracking-wide">
          Phân bố File theo Loại
        </div>
        <div className="text-sm text-text-muted text-center py-8">
          Chưa có dữ liệu
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-border rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-text-strong mb-1">
            {data.payload.ext.toUpperCase()}
          </p>
          <p className="text-xs text-text-muted">
            Số file: {data.value} ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate percentage
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : 0,
  }));

  return (
    <div className="mb-6 p-5 rounded-xl bg-white border border-border shadow-card">
      <div className="font-semibold text-text-strong mb-3 text-base tracking-wide">
        Phân bố File theo Loại
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={dataWithPercentage}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ ext, percentage }) => `${ext.toUpperCase()} (${percentage}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {dataWithPercentage.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>
                {value.toUpperCase()}: {entry.payload.count}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

