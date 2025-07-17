"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const FILTERS = [
  { label: "Tuần", value: "week" },
  { label: "Tháng", value: "month" },
  { label: "Năm", value: "year" },
];

export default function UserLineChart({
  data,
  filter,
  setFilter,
  loading,
  title = "Tăng trưởng user",
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4 relative min-h-[280px]">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">{title}</div>
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
      {loading ? (
        <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
          Đang tải...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid stroke="#f1f3f4" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 13 }} />
            <YAxis tick={{ fontSize: 13 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#b7e4c7"
              strokeWidth={3}
              dot={{ r: 5, fill: "#b7e4c7", stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
