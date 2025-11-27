export default function Popover({ open, className = "", children }) {
  return (
    <div
      className={
        "absolute z-20 mt-2 origin-top-left transform rounded-xl border border-border bg-white p-3 shadow-lg transition duration-150 ease-out " +
        (open
          ? "opacity-100 scale-100"
          : "pointer-events-none opacity-0 scale-95") +
        " " +
        className
      }
      data-popover-panel
    >
      {children}
    </div>
  );
}
