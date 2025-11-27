import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
export default function LanguageSelect({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 320 });

  const LANGS = useMemo(
    () => [
      {
        code: "vi-VN",
        base: "vi",
        region: "VN",
        label: "Tiếng Việt–Vietnamese",
      },
      {
        code: "en-US",
        base: "en",
        region: "US",
        label: "Tiếng Anh (Mỹ)–English",
      },
      {
        code: "en-GB",
        base: "en",
        region: "GB",
        label: "Tiếng Anh (Anh)–English",
      },
      {
        code: "zh-CN",
        base: "zh",
        region: "CN",
        label: "中文 (Giản thể)–Chinese",
      },
      {
        code: "zh-TW",
        base: "zh",
        region: "TW",
        label: "中文 (Phồn thể)–Chinese",
      },
      { code: "ja-JP", base: "ja", region: "JP", label: "日本語–Japanese" },
      { code: "ko-KR", base: "ko", region: "KR", label: "한국어–Korean" },
      { code: "fr-FR", base: "fr", region: "FR", label: "Français–French" },
      { code: "de-DE", base: "de", region: "DE", label: "Deutsch–German" },
      { code: "es-ES", base: "es", region: "ES", label: "Español–Spanish" },
      {
        code: "pt-BR",
        base: "pt",
        region: "BR",
        label: "Português–Portuguese",
      },
      { code: "ru-RU", base: "ru", region: "RU", label: "Русский–Russian" },
      { code: "it-IT", base: "it", region: "IT", label: "Italian–Italiano" },
      { code: "tr-TR", base: "tr", region: "TR", label: "Türkçe–Turkish" },
      { code: "pl-PL", base: "pl", region: "PL", label: "Tiếng Ba Lan–Polski" },
      {
        code: "nl-NL",
        base: "nl",
        region: "NL",
        label: "Tiếng Hà Lan–Nederlands",
      },
      { code: "sv-SE", base: "sv", region: "SE", label: "Svenska–Swedish" },
      { code: "no-NO", base: "no", region: "NO", label: "Norsk–Norwegian" },
      { code: "da-DK", base: "da", region: "DK", label: "Dansk–Danish" },
      { code: "fi-FI", base: "fi", region: "FI", label: "Suomi–Finnish" },
      { code: "cs-CZ", base: "cs", region: "CZ", label: "Čeština–Czech" },
      { code: "sk-SK", base: "sk", region: "SK", label: "Slovenčina–Slovak" },
      {
        code: "sl-SI",
        base: "sl",
        region: "SI",
        label: "Slovenščina–Slovenian",
      },
      { code: "hu-HU", base: "hu", region: "HU", label: "Magyar–Hungarian" },
      { code: "ro-RO", base: "ro", region: "RO", label: "Română–Romanian" },
      { code: "bg-BG", base: "bg", region: "BG", label: "Български–Bulgarian" },
      {
        code: "uk-UA",
        base: "uk",
        region: "UA",
        label: "Українська–Ukrainian",
      },
      { code: "el-GR", base: "el", region: "GR", label: "Ελληνικά–Greek" },
      { code: "ar-SA", base: "ar", region: "SA", label: "العربية–Arabic" },
      { code: "fa-IR", base: "fa", region: "IR", label: "فارسی–Farsi" },
      { code: "he-IL", base: "he", region: "IL", label: "עברית–Hebrew" },
      { code: "hi-IN", base: "hi", region: "IN", label: "Hindi–हिन्दी" },
      { code: "bn-BD", base: "bn", region: "BD", label: "Bengali–বাংলা" },
      { code: "ta-IN", base: "ta", region: "IN", label: "Tamil–தமிழ்" },
      { code: "te-IN", base: "te", region: "IN", label: "Telugu–తెలుగు" },
      { code: "ml-IN", base: "ml", region: "IN", label: "Malayalam–മലയാളം" },
      { code: "ur-PK", base: "ur", region: "PK", label: "Urdu–اردو" },
      { code: "id-ID", base: "id", region: "ID", label: "Bahasa Indonesia" },
      { code: "ms-MY", base: "ms", region: "MY", label: "Bahasa Melayu" },
      { code: "th-TH", base: "th", region: "TH", label: "ภาษาไทย–Thai" },
      { code: "km-KH", base: "km", region: "KH", label: "ភាសាខ្មែរ–Khmer" },
      { code: "lo-LA", base: "lo", region: "LA", label: "ພາສາລາວ–Lao" },
      {
        code: "tl-PH",
        base: "tl",
        region: "PH",
        label: "Tiếng Filipino–Filipino",
      },
      { code: "sw-KE", base: "sw", region: "KE", label: "Kiswahili–Swahili" },
      { code: "af-ZA", base: "af", region: "ZA", label: "Afrikaans" },
      { code: "sq-AL", base: "sq", region: "AL", label: "Shqip–Albanian" },
      { code: "hy-AM", base: "hy", region: "AM", label: "Հայերեն–Armenian" },
      { code: "ka-GE", base: "ka", region: "GE", label: "ქართული–Georgian" },
      { code: "et-EE", base: "et", region: "EE", label: "Eesti–Estonian" },
      { code: "lv-LV", base: "lv", region: "LV", label: "Latviešu–Latvian" },
      { code: "lt-LT", base: "lt", region: "LT", label: "Lietuvių–Lithuanian" },
      { code: "sr-RS", base: "sr", region: "RS", label: "Српски–Serbian" },
      { code: "hr-HR", base: "hr", region: "HR", label: "Hrvatski–Croatian" },
    ],
    []
  );

  const selected = LANGS.find((x) => x.code === value) || LANGS[0];
  const filtered = LANGS.filter((l) =>
    l.label.toLowerCase().includes(q.trim().toLowerCase())
  );

  const placeMenu = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const minW = 280;
    const maxW = 448; // 28rem
    const width = Math.min(maxW, Math.max(minW, r.width));
    const viewportPadding = 8;

    // tạm thời dùng chiều cao 340, sau render đo lại
    const approxH = Math.min(340, window.innerHeight - 2 * viewportPadding);

    let left = Math.max(
      viewportPadding,
      Math.min(r.left, window.innerWidth - viewportPadding - width)
    );
    let top = r.bottom + 8;
    if (top + approxH > window.innerHeight - viewportPadding) {
      top = Math.max(viewportPadding, r.top - 8 - approxH);
    }
    setPos({ top, left, width });
  };

  useLayoutEffect(() => {
    if (!open) return;
    placeMenu();
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    // đo lại đúng chiều cao rồi đặt lại nếu cần
    const re = () => {
      placeMenu();
    };
    re();
  }, [open, q, filtered.length]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => placeMenu();
    const onResize = () => placeMenu();
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onClick = (e) => {
      if (
        menuRef.current?.contains(e.target) ||
        btnRef.current?.contains(e.target)
      )
        return;
      setOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`w-full h-9 pl-3 pr-9 rounded-lg border border-border bg-white text-sm text-left
          flex items-center gap-2 hover:bg-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-500
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        aria-expanded={open ? "true" : "false"}
      >
        <span className="inline-flex items-center gap-2">
          <span className="w-7 h-6 rounded-md bg-surface-50 border border-border grid place-items-center text-[11px] text-text-muted">
            {selected.region}
          </span>
          <span className="truncate">{selected.label}</span>
        </span>
        <ChevronDown className="ml-auto -mr-1 w-4 h-4 text-text-muted" />
      </button>

      {open &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] rounded-xl border border-border bg-white shadow-[var(--shadow-card)] overflow-hidden"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: 300,
            }}
            role="listbox"
          >
            <div className="p-2 border-b border-border bg-surface-50">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tất cả ngôn ngữ…"
                className="w-full h-9 rounded-lg border border-border bg-white px-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="max-h-[240px] overflow-auto scrollbar-hide py-1">
              {filtered.map((l) => {
                const active = l.code === value;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      onChange?.(l.code);
                      setOpen(false);
                    }}
                    className={`w-full px-3 py-2 flex items-center gap-3 text-sm
                                hover:bg-surface-50 focus:bg-surface-50
                                ${active ? "bg-surface-50" : ""}`}
                    role="option"
                    aria-selected={active}
                  >
                    <span className="w-7 h-6 rounded-md bg-surface-50 border border-border grid place-items-center text-[11px] text-text-muted">
                      {l.region}
                    </span>
                    <span className="flex-1 text-left truncate">{l.label}</span>
                    {active && <Check className="w-4 h-4 text-brand-600" />}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
