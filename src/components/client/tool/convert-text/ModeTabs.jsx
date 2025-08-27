export default function ModeTabs({ mode, setMode }) {
  const tab = (id, label) => (
    <button
      onClick={() => setMode(id)}
      className={`px-4 py-2 rounded-xl border transition ${
        mode === id
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-2">
      {tab("single", "Âm thanh một loa")}
      {tab("multi", "Âm thanh nhiều loa")}
      {tab("upload", "Tải tệp (.srt / .ass)")}
    </div>
  );
}
