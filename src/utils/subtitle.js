const toSec = (h, m, s, ms = 0) => h * 3600 + m * 60 + s + ms / 1000;
const SRT_TIME =
  /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/;

export function parseSRT(raw) {
  const blocks = raw
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  const segments = [];
  let idx = 1;
  for (const b of blocks) {
    const lines = b.split("\n");
    const timeLine = lines.find((l) => SRT_TIME.test(l));
    if (!timeLine) continue;
    const m = timeLine.match(SRT_TIME);
    const start = toSec(+m[1], +m[2], +m[3], +m[4]);
    const end = toSec(+m[5], +m[6], +m[7], +m[8]);
    const startIdx = lines.indexOf(timeLine) + 1;
    const text = lines.slice(startIdx).join("\n").trim();
    segments.push({ idx: idx++, start, end, text, speaker: null });
  }
  return segments;
}

export function parseASS(raw) {
  const lines = raw.replace(/\r/g, "").split("\n");
  let fmtFields = [];
  const dialogues = [];
  const speakers = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("Format:")) {
      const f = line
        .slice(7)
        .split(",")
        .map((s) => s.trim().toLowerCase());
      fmtFields = f;
    } else if (line.startsWith("Dialogue:")) {
      const payload = line.slice(9).trim();
      const values = [];
      let buf = payload;
      for (let k = 0; k < fmtFields.length - 1; k++) {
        const comma = buf.indexOf(",");
        values.push(buf.slice(0, comma));
        buf = buf.slice(comma + 1);
      }
      values.push(buf);
      const map = {};
      fmtFields.forEach((key, idx) => (map[key] = (values[idx] || "").trim()));
      const start = assTimeToSec(map.start);
      const end = assTimeToSec(map.end);
      const text = stripAssTags(map.text || "");
      const actor = (map.Name || map.name || "").trim();

      dialogues.push({
        idx: dialogues.length + 1,
        start,
        end,
        text,
        speaker: actor || null,
      });
      if (actor) {
        const entry = speakers.get(actor) || {
          id: actor,
          label: actor,
          count: 0,
        };
        entry.count += 1;
        speakers.set(actor, entry);
      }
    }
  }
  return { segments: dialogues, speakers: Array.from(speakers.values()) };
}

function assTimeToSec(t) {
  const m = t.match(/(\d+):(\d{2}):(\d{2})[\.|:](\d{2,3})/);
  if (!m) return null;
  const h = +m[1],
    mi = +m[2],
    s = +m[3],
    cs = +m[4];
  const ms = String(cs).length === 2 ? cs * 10 : cs;
  return toSec(h, mi, s, ms);
}

function stripAssTags(s) {
  return s
    .replace(/\{\\[^}]*\}/g, "")
    .replace(/\\N/g, "\n")
    .trim();
}
