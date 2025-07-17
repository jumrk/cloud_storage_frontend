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

const COLORS = [
  "#b7e4c7",
  "#a5d8ff",
  "#ffd6a5",
  "#d0bfff",
  "#ffe066",
  "#ffb3c6",
];

const FILTERS = [
  { label: "Tuần", value: "week" },
  { label: "Tháng", value: "month" },
  { label: "Năm", value: "year" },
];

export default function FileBarChart({
  data,
  filter,
  setFilter,
  loading,
  title = "Số lượng file theo loại",
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
          <BarChart data={data}>
            <CartesianGrid stroke="#f1f3f4" strokeDasharray="3 3" />
            <XAxis dataKey="type" tick={{ fontSize: 13 }} />
            <YAxis tick={{ fontSize: 13 }} />
            <Tooltip />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
