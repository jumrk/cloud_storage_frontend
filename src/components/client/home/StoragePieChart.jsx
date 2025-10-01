import { formatSize } from "@/utils/driveUtils";

export function StoragePieChart({ used, total }) {
  const percent = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div className="flex flex-col items-center justify-center my-4">
      <svg viewBox="0 0 100 100" className="w-28 h-28">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#1cadd9"
          strokeWidth="10"
          strokeDasharray={2 * Math.PI * 45}
          strokeDashoffset={2 * Math.PI * 45 * (1 - percent / 100)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s" }}
        />
        <text
          x="50"
          y="54"
          textAnchor="middle"
          fontSize="20"
          fontWeight="bold"
          fill="#222"
        >
          {percent.toFixed(0)}%
        </text>
      </svg>
      <div className="text-xs text-gray-500 mt-1">
        {formatSize(used)} / {formatSize(total)} đã dùng
      </div>
    </div>
  );
}
