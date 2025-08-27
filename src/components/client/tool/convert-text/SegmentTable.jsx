function fmtTime(t) {
  if (t == null) return "—";
  const ms = Math.floor(t * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const ms3 = String(ms % 1000).padStart(3, "0");
  const hms = [h, m, s].map((x) => String(x).padStart(2, "0")).join(":");
  return `${hms}.${ms3}`;
}

export default function SegmentTable({
  segments = [],
  speakers = [],
  speakerMap = {},
  onChangeRowSpeaker,
  onPreviewRow,
  inheritVoice,
}) {
  const labelOf = (id) =>
    speakerMap[id]?.label ??
    speakers.find((s) => s.id === id)?.label ??
    id ??
    "—";

  return (
    <div className="overflow-hidden">
      <div className="overflow-auto max-h-[560px]">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left w-12">#</th>
              <th className="px-4 py-2 text-left w-44">Thời gian</th>
              <th className="px-4 py-2 text-left w-56">Nhân vật</th>
              <th className="px-4 py-2 text-left">Nội dung</th>
              <th className="px-4 py-2 text-left w-24">Preview</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {segments.map((row) => {
              const vLabel = row.speaker
                ? labelOf(row.speaker) || row.speaker
                : "—";
              return (
                <tr key={row.idx} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2 tabular-nums text-slate-500">
                    {row.idx}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    <div className="leading-tight">
                      <div>{fmtTime(row.start)}</div>
                      <div className="text-xs">→ {fmtTime(row.end)}</div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={row.speaker || ""}
                        onChange={(e) =>
                          onChangeRowSpeaker?.(row.idx, e.target.value || null)
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 min-w-[10rem]"
                      >
                        <option value="">— Trống —</option>
                        {speakers.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {speakerMap[sp.id]?.label ?? sp.label}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-slate-400">{vLabel}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="whitespace-pre-wrap">{row.text}</div>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => onPreviewRow?.(row)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                      Nghe
                    </button>
                  </td>
                </tr>
              );
            })}

            {segments.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Chưa có dữ liệu — nhập văn bản hoặc tải .srt/.ass
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
