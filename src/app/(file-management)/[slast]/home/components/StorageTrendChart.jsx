"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTranslations } from "next-intl";
import Skeleton from "react-loading-skeleton";
import { formatSize } from "@/shared/utils/driveUtils";

export function StorageTrendChart({ data, loading, period, onPeriodChange }) {
  const t = useTranslations();

  if (loading) {
    return (
      <div className="mb-6 p-5 rounded-xl bg-white border border-border shadow-card">
        <div className="font-semibold text-text-strong mb-3 text-base tracking-wide">
          Xu hướng Storage
        </div>
        <Skeleton height={200} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="mb-6 p-5 rounded-xl bg-white border border-border shadow-card">
        <div className="font-semibold text-text-strong mb-3 text-base tracking-wide">
          Xu hướng Storage
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
            {payload[0].payload.label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatSize(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mb-6 p-5 rounded-xl bg-white border border-border shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-text-strong text-base tracking-wide">
          Xu hướng Storage
        </div>
        {onPeriodChange && (
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="text-xs bg-surface-50 rounded px-2 py-1 outline-none border border-border hover:border-brand cursor-pointer"
          >
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
            <option value="year">Năm</option>
          </select>
        )}
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="label"
            stroke="var(--color-text-muted)"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="var(--color-text-muted)"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => formatSize(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="used"
            name="Đã dùng"
            stroke="var(--color-brand)"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="total"
            name="Tổng dung lượng"
            stroke="var(--color-text-muted)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

