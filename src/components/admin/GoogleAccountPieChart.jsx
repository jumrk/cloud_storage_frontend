"use client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#b7e4c7", "#ffd6a5", "#a5d8ff", "#f1f3f4"];

export default function GoogleAccountPieChart({
  data,
  loading,
  title = "Tài khoản Google",
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4 relative min-h-[280px]">
      <div className="font-semibold mb-2">{title}</div>
      {loading ? (
        <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
          Đang tải...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="count"
              label
              stroke="#fff"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
