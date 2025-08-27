export default function SingleVoice({
  stylePrompt,
  setStylePrompt,
  text,
  setText,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3">
        <label className="block text-xs text-slate-500 mb-1">
          Hướng dẫn phong cách
        </label>
        <input
          value={stylePrompt}
          onChange={(e) => setStylePrompt(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="Read aloud in a warm and friendly tone:"
        />
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1">Nhắn tin</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="Nhập nội dung cần đọc…"
        />
      </div>
    </div>
  );
}
