export default function Popover({ open, className = "", children }) {
  if (!open) return null; // Don't render at all when closed

  return (
    <div
      className={
        "absolute z-50 transform rounded-xl border border-border bg-white shadow-lg transition duration-150 ease-out opacity-100 scale-100 " +
        className
      }
      data-popover-panel
    >
      {children}
    </div>
  );
}
