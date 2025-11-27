import { formatSize } from "@/shared/utils/driveUtils";

export function StoragePieChart({ used, total }) {
  const percent = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const circumference = 2 * Math.PI * 45;

  return (
    <div className="flex flex-col items-center justify-center my-4">
      <svg viewBox="0 0 100 100" className="w-28 h-28">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="10"
        />
        <g className="text-brand">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - percent / 100)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s" }}
          />
        </g>
        <text
          x="50"
          y="54"
          textAnchor="middle"
          fontSize="20"
          fontWeight="bold"
          fill="var(--color-text-strong)"
        >
          {percent.toFixed(0)}%
        </text>
      </svg>
      <div className="text-xs text-text-muted mt-1">
        {formatSize(used)} / {formatSize(total)} đã dùng
      </div>
    </div>
  );
}
