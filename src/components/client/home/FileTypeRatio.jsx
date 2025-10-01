export function FileTypeRatio({ types }) {
  const total = types.reduce((sum, t) => sum + t.count, 0);
  return (
    <div className="flex flex-col gap-2 mt-2">
      {types.map((t) => (
        <div key={t.ext} className="flex items-center gap-2 text-sm">
          <span className="w-8 text-right font-medium uppercase text-gray-600">
            {t.ext}
          </span>
          <div className="flex-1 h-3 bg-gray-200 rounded-full relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-[#1cadd9]"
              style={{ width: `${total ? (t.count / total) * 100 : 0}%` }}
            />
          </div>
          <span className="ml-2 text-xs text-gray-500">{t.count} file</span>
        </div>
      ))}
    </div>
  );
}
