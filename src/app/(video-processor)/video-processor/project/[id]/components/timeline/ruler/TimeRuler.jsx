"use client";
import { memo, useMemo } from "react";
import { useTimeline } from "../../../context/TimelineContext";

function formatClock(totalSec) {
  const s = Math.floor(totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) {
    return `${String(h)}:${String(m).padStart(2, "0")}:${String(ss).padStart(
      2,
      "0"
    )}`;
  }
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function chooseSteps(pxPerSec) {
  const secPerPx = 1 / Math.max(1e-6, pxPerSec);
  const targetMajorPx = 100;

  const bases = [1, 2, 5];
  let k = Math.floor(Math.log10(targetMajorPx * secPerPx));
  let majorSec = bases[0] * Math.pow(10, k);

  const needSec = targetMajorPx * secPerPx;
  let best = majorSec;
  let bestPx = best * pxPerSec;

  for (let i = -2; i <= 6; i++) {
    for (const b of bases) {
      const candSec = b * Math.pow(10, k + i);
      const px = candSec * pxPerSec;
      if (px >= 80 && px <= 160) {
        majorSec = candSec;
        bestPx = px;
        break;
      }
      if (Math.abs(px - 100) < Math.abs(bestPx - 100)) {
        best = candSec;
        bestPx = px;
      }
    }
  }
  if (bestPx && (bestPx < 80 || bestPx > 160)) majorSec = best;

  let midSec = majorSec / 5;
  let minorSec = majorSec / 10;

  const minorPx = minorSec * pxPerSec;
  if (minorPx < 6) {
    minorSec = majorSec / 5;
  }

  return {
    majorSec,
    midSec,
    minorSec,
    majorPx: majorSec * pxPerSec,
    midPx: midSec * pxPerSec,
    minorPx: minorSec * pxPerSec,
  };
}

export default memo(function TimeRuler({ widthPx }) {
  const { pxPerSec } = useTimeline();

  const steps = useMemo(() => chooseSteps(pxPerSec), [pxPerSec]);
  const { majorSec, midSec, minorSec, majorPx, midPx, minorPx } = steps;

  const ticks = useMemo(() => {
    const arrMajor = [];
    const arrMid = [];
    const arrMinor = [];

    const totalSec = widthPx / Math.max(1e-6, pxPerSec);

    if (minorPx >= 4) {
      for (let s = 0; s <= totalSec + 1e-6; s += minorSec) {
        const x = Math.round(s * pxPerSec);
        arrMinor.push(x);
      }
    }

    if (midPx >= 10) {
      for (let s = 0; s <= totalSec + 1e-6; s += midSec) {
        const x = Math.round(s * pxPerSec);
        arrMid.push(x);
      }
    }

    for (let s = 0; s <= totalSec + 1e-6; s += majorSec) {
      const x = Math.round(s * pxPerSec);
      arrMajor.push({ x, label: formatClock(s) });
    }

    const mids = new Set(arrMid);
    const majors = new Set(arrMajor.map((m) => m.x));
    const minorClean = arrMinor.filter((x) => !majors.has(x) && !mids.has(x));
    const midClean = arrMid.filter((x) => !majors.has(x));

    const labeled = [];
    let lastLabeled = -1e9;
    for (const m of arrMajor) {
      if (m.x - lastLabeled >= 56) {
        labeled.push(m);
        lastLabeled = m.x;
      }
    }

    return { minor: minorClean, mid: midClean, major: arrMajor, labeled };
  }, [widthPx, pxPerSec, majorSec, midSec, minorSec, majorPx, midPx, minorPx]);

  return (
    <div className="relative h-9 bg-white select-none overflow-hidden" style={{ width: widthPx, minWidth: widthPx }}>
      <div className="absolute inset-0" style={{ width: widthPx }}>
        {ticks.minor.map((x, i) => (
          <div key={`n-${i}`} className="absolute top-0" style={{ left: x }}>
            <div
              className="w-px bg-[color:var(--border,#e5e7eb)] opacity-60"
              style={{ height: 8 }}
            />
          </div>
        ))}

        {ticks.mid.map((x, i) => (
          <div key={`m-${i}`} className="absolute top-0" style={{ left: x }}>
            <div
              className="w-px bg-[color:var(--border,#e5e7eb)] opacity-80"
              style={{ height: 14 }}
            />
          </div>
        ))}

        {ticks.major.map((t, i) => (
          <div key={`M-${i}`} className="absolute top-0" style={{ left: t.x }}>
            <div
              className="w-px bg-[color:var(--text,#0c3e5a)]/30"
              style={{ height: 24 }}
            />
          </div>
        ))}

        {ticks.labeled.map((t, i) => (
          <div
            key={`L-${i}`}
            className="absolute top-[2px] text-[11px] leading-4 text-text-muted"
            style={{ left: t.x + 6 }}
          >
            {t.label}
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
    </div>
  );
});
