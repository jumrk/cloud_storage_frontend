import { useMemo } from "react";
import { Check } from "lucide-react";

function parseRatio(r) {
  if (!r) return 16 / 9;
  const p = r.includes("/") ? r.split("/") : r.split(":");
  const [w, h] = p.map((s) => parseFloat(s.trim()));
  return !isNaN(w) && !isNaN(h) && h !== 0 ? w / h : 16 / 9;
}

function AspectThumb({
  ratio,
  boxW = 28,
  boxH = 18,
  padding = 2,
  className = "",
}) {
  const ar = useMemo(() => parseRatio(ratio), [ratio]);

  const innerW = boxW - padding * 2;
  const innerH = boxH - padding * 2;

  let w = innerW;
  let h = innerH;

  if (ar >= 1) {
    h = Math.min(innerH, Math.round(innerW / ar));
    w = Math.round(h * ar);
  } else {
    w = Math.min(innerW, Math.round(innerH * ar));
    h = Math.round(w / ar);
  }

  return (
    <div
      className={
        "relative shrink-0 rounded-md border border-dashed border-brand-300 bg-surface-50 " +
        className
      }
      style={{ width: boxW, height: boxH }}
      aria-hidden
    >
      {ratio && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     rounded-[3px] ring-1 ring-inset ring-brand-300/70 bg-brand-50/30"
          style={{ width: w, height: h }}
        />
      )}
    </div>
  );
}

export default function AspectItem({ label, ratio, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl px-3 py-2 mb-1 border transition
        ${
          active
            ? "bg-brand-50 border-brand-200"
            : "bg-white hover:bg-surface-50 border-transparent"
        }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AspectThumb ratio={ratio} boxW={28} boxH={18} />
          <span className="text-sm font-medium text-text-strong">{label}</span>
        </div>
        {active && <Check className="w-4 h-4 text-brand-600" />}
      </div>
    </button>
  );
}
