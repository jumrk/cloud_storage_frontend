"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatSize } from "@/utils/driveUtils";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const COLORS = ["#b7e4c7", "#f1f3f4"];

export default function StorageDonutChart({
  used,
  total,
  title = "Lưu lượng sử dụng",
  loading = false,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center">
        <div className="font-semibold mb-2 w-full">
          <Skeleton width={120} height={20} />
        </div>
        <div
          className="w-full flex items-center justify-center"
          style={{ height: 220 }}
        >
          <Skeleton width={160} height={160} circle={true} />
        </div>
        <div className="text-center mt-2 text-sm text-gray-500 w-full">
          <Skeleton width={120} height={16} />
        </div>
      </div>
    );
  }
  let usedVal = Number(used) || 0;
  let totalVal = Number(total) || 0;
  let remain = Math.max(totalVal - usedVal, 0);

  // Nếu tổng <= 0 hoặc used >= total, chia đều 2 phần cho dễ nhìn
  if (totalVal <= 0 || usedVal >= totalVal) {
    usedVal = 1;
    remain = 1;
  } else if (remain / totalVal < 0.01) {
    // Nếu phần còn lại quá nhỏ (<1%), ép lên 1% tổng để luôn thấy lát xám
    remain = totalVal * 0.01;
    usedVal = totalVal - remain;
  }

  const data = [
    { name: "Đã dùng", value: usedVal },
    { name: "Còn lại", value: remain },
  ];
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="font-semibold mb-2">{title}</div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
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
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-2 text-sm text-gray-500">
        Đã dùng:{" "}
        <span className="font-semibold text-gray-700">
          {formatSize(usedVal)}
        </span>{" "}
        / Còn lại:{" "}
        <span className="font-semibold text-gray-700">
          {formatSize(remain)}
        </span>
      </div>
    </div>
  );
}
