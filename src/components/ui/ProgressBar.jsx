export default function ProgressBar({
  value,
  height = "h-2",
  rounded = "rounded-full",
}) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div
      className={`w-full mt-2 bg-neutral-200/70 ${height} ${rounded} overflow-hidden`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full ${rounded}
          bg-[#FF7979]
          shadow-[0_0_12px_rgba(244,63,94,0.25)]
          transition-[width] duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
